import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { cloneRepository } from '../services/git/clone.service.js';
import { getChurnCounts } from '../services/git/churn.service.js';
import { getOwnership } from '../services/git/ownership.service.js';
import { analyzeComplexity } from '../services/analysis/complexity.service.js';
import { computeRiskScores, type FileRiskInput } from '../services/scoring/risk-score.service.js';
import { simpleGit } from 'simple-git';

export const createScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    
    const repo = await prisma.repo.findUnique({ where: { id: repoId as string } });
    if (!repo) {
      res.status(404).json({ error: 'Repo not found' });
      return;
    }

    const scan = await prisma.scan.create({
      data: {
        repoId: repo.id,
        status: 'CLONING',
        startedAt: new Date()
      }
    });
    
    res.status(202).json({ message: 'Scan started asynchronously', scanId: scan.id });

    // Background execution for verification
    (async () => {
      try {
        const repoUrl = `https://github.com/${repo.fullName}.git`;
        const localPath = await cloneRepository(repoUrl, repo.id);
        
        await prisma.scan.update({
          where: { id: scan.id },
          data: { status: 'ANALYZING' }
        });

        const git = simpleGit(localPath);
        const commitSha = await git.revparse(['HEAD']);

        const churnCounts = await getChurnCounts(localPath);
        const ownership = await getOwnership(localPath);
        const complexity = analyzeComplexity(localPath);
        
        await prisma.scan.update({
          where: { id: scan.id },
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
        
        // Save to DB in bulk might be better, but doing it in a loop for now is fine since we won't have 10k files.
        // Actually Prisma supports createMany
        if (scores.length > 0) {
          await prisma.fileScore.createMany({
            data: scores.map(score => ({
              scanId: scan.id,
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
          where: { id: scan.id },
          data: { status: 'COMPLETED', completedAt: new Date() }
        });
        
        console.log(`Scan ${scan.id} completed successfully`);

      } catch (err: any) {
        console.error('Scan failed', err);
        await prisma.scan.update({
          where: { id: scan.id },
          data: { status: 'FAILED', errorMessage: err.message, completedAt: new Date() }
        });
      }
    })();
    
  } catch (error) {
    next(error);
  }
};

export const getScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const scan = await prisma.scan.findUnique({ where: { id: id as string } });
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }
    res.json(scan);
  } catch (error) {
    next(error);
  }
};
