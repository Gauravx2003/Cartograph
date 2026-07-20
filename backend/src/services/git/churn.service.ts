import { simpleGit, type SimpleGit } from 'simple-git';

export interface ChurnResult {
  filePath: string;
  commitCount: number;
  history: { date: string; commits: number }[];
}

export async function getChurnCounts(repoPath: string, sinceDays: number = 180): Promise<ChurnResult[]> {
  const git: SimpleGit = simpleGit(repoPath);
  
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);
  const sinceStr = sinceDate.toISOString();

  // Get both filename and commit date
  // Format: <date>| <filename>
  const log = await git.raw(['log', '--name-only', '--format=format:--COMMIT--|%cd', '--date=iso-strict', `--since=${sinceStr}`]);
  
  const lines = log.split('\n').filter(line => line.trim() !== '');
  
  const fileStats: Record<string, { count: number; dates: string[] }> = {};
  
  let currentCommitDate: string | null = null;
  
  for (const line of lines) {
    if (line.startsWith('--COMMIT--|')) {
      currentCommitDate = line.replace('--COMMIT--|', '').trim();
    } else if (currentCommitDate && line.match(/\.(js|jsx|ts|tsx)$/)) {
      const file = line.trim();
      if (!fileStats[file]) {
        fileStats[file] = { count: 0, dates: [] };
      }
      fileStats[file].count += 1;
      fileStats[file].dates.push(currentCommitDate);
    }
  }

  // Convert dates to weekly buckets (e.g., "Week 1", "Week 2")
  // Or just bucket by week number relative to the start date
  const generateHistory = (dates: string[]) => {
    // Generate buckets for the last 6 months (26 weeks) roughly, or just bucket them by week.
    // For simplicity, let's group by "Week N" where N is weeks ago from now, or just an ISO week string.
    // Actually, grouping by "Week 1", "Week 2" from the start date makes a nice left-to-right graph.
    const weeksCount = Math.ceil(sinceDays / 7);
    const buckets: Record<string, number> = {};
    for (let i = 1; i <= weeksCount; i++) {
      buckets[`Week ${i}`] = 0;
    }
    
    dates.forEach(dateStr => {
      const d = new Date(dateStr);
      const diffTime = Math.abs(d.getTime() - sinceDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      let weekNum = Math.ceil(diffDays / 7);
      if (weekNum === 0) weekNum = 1;
      if (weekNum > weeksCount) weekNum = weeksCount;
      buckets[`Week ${weekNum}`] = (buckets[`Week ${weekNum}`] || 0) + 1;
    });

    return Object.keys(buckets).sort((a, b) => {
      const aNum = parseInt(a.replace('Week ', ''));
      const bNum = parseInt(b.replace('Week ', ''));
      return aNum - bNum;
    }).map(week => ({
      date: week,
      commits: buckets[week] || 0
    }));
  };

  return Object.entries(fileStats).map(([filePath, stats]) => ({
    filePath,
    commitCount: stats.count,
    history: generateHistory(stats.dates)
  }));
}
