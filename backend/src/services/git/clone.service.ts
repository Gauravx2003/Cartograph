import { simpleGit } from 'simple-git';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export async function cloneRepository(repoUrl: string, repoId: string): Promise<string> {
  const targetDir = path.join(os.tmpdir(), 'cartograph-repos', repoId);
  
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(targetDir, { recursive: true });
  
  const git = simpleGit();
  await git.clone(repoUrl, targetDir);
  
  return targetDir;
}
