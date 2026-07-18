import { simpleGit, type SimpleGit } from 'simple-git';

export interface OwnershipResult {
  filePath: string;
  uniqueContributors: number;
  topContributorPercent: number;
}

export async function getOwnership(repoPath: string): Promise<OwnershipResult[]> {
  const git: SimpleGit = simpleGit(repoPath);
  
  // Get log with author name and files changed
  const log = await git.raw(['log', '--name-only', '--format=AUTHOR:%an']);
  
  const lines = log.split('\n');
  
  const fileAuthors: Record<string, Record<string, number>> = {};
  let currentAuthor = '';

  for (const line of lines) {
    if (line.startsWith('AUTHOR:')) {
      currentAuthor = line.substring('AUTHOR:'.length).trim();
    } else if (line.trim() !== '') {
      const file = line.trim();
      if (!file.match(/\.(js|jsx|ts|tsx)$/)) continue;
      
      if (!fileAuthors[file]) {
        fileAuthors[file] = {};
      }
      fileAuthors[file][currentAuthor] = (fileAuthors[file][currentAuthor] || 0) + 1;
    }
  }

  const results: OwnershipResult[] = [];
  
  for (const [filePath, authors] of Object.entries(fileAuthors)) {
    const uniqueContributors = Object.keys(authors).length;
    let totalCommits = 0;
    let maxCommits = 0;
    
    for (const count of Object.values(authors)) {
      totalCommits += count;
      if (count > maxCommits) {
        maxCommits = count;
      }
    }
    
    const topContributorPercent = totalCommits > 0 ? maxCommits / totalCommits : 0;
    
    results.push({
      filePath,
      uniqueContributors,
      topContributorPercent
    });
  }

  return results;
}
