import * as crypto from 'crypto';
import 'dotenv/config';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }
  
  // Hash the key to ensure it is exactly 32 bytes for aes-256-gcm
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedString: string): string {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format. Expected iv:authTag:encryptedData');
  }
  
  const ivStr = parts[0] as string;
  const authTagStr = parts[1] as string;
  const encrypted = parts[2] as string;

  const iv = Buffer.from(ivStr, 'hex');
  const authTag = Buffer.from(authTagStr, 'hex');
  const key = getEncryptionKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted as string, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
