import 'dotenv/config';
import { prisma } from '../../db/client.js';
import { encryptToken } from '../../utils/crypto.js';
import jwt from 'jsonwebtoken';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

export function getGithubOAuthUrl(): string {
  if (!GITHUB_CLIENT_ID) throw new Error('GITHUB_CLIENT_ID is not set');
  // Need both repo and user scopes. For private repos, we need 'repo' scope.
  const scope = 'repo,user';
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scope)}`;
}

export async function handleGithubCallback(code: string): Promise<string> {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new Error('GitHub OAuth credentials are not set');
  }
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  // 1. Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  
  if (!accessToken) {
    throw new Error('GitHub did not return an access token');
  }

  // 2. Fetch user profile
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Cartograph-App',
    },
  });

  if (!userResponse.ok) {
    throw new Error(`Failed to fetch GitHub user: ${userResponse.statusText}`);
  }

  const githubUser = await userResponse.json();
  
  if (!githubUser.id || !githubUser.login) {
    throw new Error('Invalid user payload from GitHub');
  }

  // 3. Encrypt the access token
  const encryptedToken = encryptToken(accessToken);

  // 4. Upsert user in Prisma
  const user = await prisma.user.upsert({
    where: { githubId: githubUser.id.toString() },
    update: {
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      accessTokenEnc: encryptedToken,
    },
    create: {
      githubId: githubUser.id.toString(),
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      accessTokenEnc: encryptedToken,
    },
  });

  // 5. Generate JWT
  const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
  return jwtToken;
}
