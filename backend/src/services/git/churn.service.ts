import { simpleGit, type SimpleGit } from 'simple-git';

export interface ChurnResult {
  filePath: string;
  commitCount: number;
}

export async function getChurnCounts(repoPath: string, sinceDays: number = 180): Promise<ChurnResult[]> {
  const git: SimpleGit = simpleGit(repoPath);
  
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);
  const sinceStr = sinceDate.toISOString();

  const log = await git.raw(['log', '--name-only', '--format=format:', `--since=${sinceStr}`]);
  
  const files = log.split('\n').filter(line => line.trim() !== '');
  
  const counts: Record<string, number> = {};
  for (const file of files) {
    if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      counts[file] = (counts[file] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([filePath, commitCount]) => ({
    filePath,
    commitCount
  }));
}
