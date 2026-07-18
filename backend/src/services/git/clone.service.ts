import { simpleGit } from 'simple-git';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export async function cloneRepository(repoUrl: string, repoId: string, isPrivate: boolean, token?: string): Promise<string> {
  if (isPrivate && !token) {
    throw new Error('Unauthorized: Private repos require a stored access token');
  }

  if (token) {
    const urlObj = new URL(repoUrl);
    urlObj.username = 'x-access-token';
    urlObj.password = token;
    repoUrl = urlObj.toString();
  }

  const targetDir = path.join(os.tmpdir(), 'cartograph-repos', repoId);
  
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(targetDir, { recursive: true });
  
  const git = simpleGit();
  await git.clone(repoUrl, targetDir);
  
  return targetDir;
}
