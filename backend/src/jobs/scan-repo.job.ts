import { Job } from 'bullmq';
import { prisma } from '../db/client.js';
import { cloneRepository } from '../services/git/clone.service.js';
import { getChurnCounts } from '../services/git/churn.service.js';
import { getOwnership } from '../services/git/ownership.service.js';
import { analyzeComplexity } from '../services/analysis/complexity.service.js';
import { computeRiskScores, type FileRiskInput } from '../services/scoring/risk-score.service.js';
import { simpleGit } from 'simple-git';

export interface ScanJobData {
  scanId: string;
  repoId: string;
}

export async function processScanJob(job: Job<ScanJobData>) {
  const { scanId, repoId } = job.data;
  
  try {
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) {
      throw new Error(`Repo not found: ${repoId}`);
    }

    const scan = await prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan) {
      throw new Error(`Scan not found: ${scanId}`);
    }

    let token: string | undefined;
    if (repo.isPrivate && scan.requestedById) {
      const requester = await prisma.user.findUnique({ where: { id: scan.requestedById } });
      token = requester?.accessTokenEnc;
    }

    const repoUrl = `https://github.com/${repo.fullName}.git`;
    
    await job.updateProgress(10);
    const localPath = await cloneRepository(repoUrl, repo.id, repo.isPrivate, token);
    
    // Quick file count check before heavy lifting
    const git = simpleGit(localPath);
    const filesString = await git.raw(['ls-files']);
    const fileCount = filesString.trim().split('\n').filter(Boolean).length;
    
    if (scan.isAnonymous && fileCount > 200) {
      throw new Error(`Anonymous scan file limit exceeded (${fileCount} > 200 files). Please log in.`);
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'ANALYZING' }
    });
    await job.updateProgress(30);

    const commitSha = await git.revparse(['HEAD']);

    const churnCounts = await getChurnCounts(localPath);
    await job.updateProgress(50);
    
    const ownership = await getOwnership(localPath);
    await job.updateProgress(70);
    
    const complexity = analyzeComplexity(localPath);
    await job.updateProgress(90);
    
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'SCORING', commitSha, fileCount: complexity.length }
    });

    // Merge inputs
    const inputs: FileRiskInput[] = complexity.map(c => {
      const ch = churnCounts.find(ch => ch.filePath === c.filePath);
      const own = ownership.find(o => o.filePath === c.filePath);
      return {
        filePath: c.filePath,
        cyclomaticComplexity: c.cyclomaticComplexity,
        maxNestingDepth: c.maxNestingDepth,
        fileLengthLines: c.fileLength,
        churnCount: ch ? ch.commitCount : 0,
        uniqueContributors: own ? own.uniqueContributors : 0,
        topContributorPct: own ? own.topContributorPercent : 0
      };
    });

    const scores = computeRiskScores(inputs);
    
    if (scores.length > 0) {
      await prisma.fileScore.createMany({
        data: scores.map(score => ({
          scanId: scanId,
          filePath: score.filePath,
          churnCount: score.churnCount,
          complexityCyclomatic: score.cyclomaticComplexity,
          complexityMaxNesting: score.maxNestingDepth,
          fileLengthLines: score.fileLengthLines,
          uniqueContributors: score.uniqueContributors,
          topContributorPct: score.topContributorPct,
          normalizedChurn: score.normalizedChurn,
          normalizedComplexity: score.normalizedComplexity,
          busFactorPenalty: score.busFactorPenalty,
          riskScore: score.riskScore
        }))
      });
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });
    
    await job.updateProgress(100);
    console.log(`Scan job ${scanId} completed successfully`);

  } catch (err: any) {
    console.error(`Scan job ${scanId} failed:`, err);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'FAILED', errorMessage: err.message, completedAt: new Date() }
    });
    throw err;
  }
}
