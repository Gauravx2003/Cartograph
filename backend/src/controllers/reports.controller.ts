import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import crypto from 'crypto';

// Helper to verify if the user has access to a scan
const verifyScanAccess = async (scanId: string, req: Request) => {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { repo: true }
  });
  
  if (!scan) return null;
  
  if (scan.repo.isPrivate) {
    if (!req.user || req.user.id !== scan.requestedById) {
      return false; // Unauthorized
    }
  }
  
  return scan;
};

export const exportCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scan = await verifyScanAccess(req.params.scanId as string, req);
    if (scan === false) {
       res.status(401).json({ error: 'Unauthorized: You do not have permission to view this scan.' });
       return;
    }
    if (!scan) {
       res.status(404).json({ error: 'Scan not found' });
       return;
    }

    const files = await prisma.fileScore.findMany({
      where: { scanId: scan.id },
      orderBy: { riskScore: 'desc' }
    });

    const header = [
      'FilePath', 
      'RiskScore', 
      'ChurnCount', 
      'CyclomaticComplexity', 
      'MaxNestingDepth', 
      'FileLengthLines', 
      'UniqueContributors', 
      'TopContributorPct'
    ].join(',');
    
    const rows = files.map(f => [
      f.filePath,
      f.riskScore.toFixed(4),
      f.churnCount,
      f.complexityCyclomatic,
      f.complexityMaxNesting,
      f.fileLengthLines,
      f.uniqueContributors,
      f.topContributorPct.toFixed(4)
    ].join(','));

    const csvData = [header, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cartograph-report-${scan.id}.csv`);
    res.send(csvData);
  } catch (err) {
    next(err);
  }
};

export const createShareLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scan = await verifyScanAccess(req.params.scanId as string, req);
    if (scan === false) {
       res.status(401).json({ error: 'Unauthorized: You do not have permission to share this scan.' });
       return;
    }
    if (!scan) {
       res.status(404).json({ error: 'Scan not found' });
       return;
    }

    let report = await prisma.report.findFirst({
      where: { scanId: scan.id, format: 'LINK' }
    });

    if (!report) {
      const slug = crypto.randomBytes(8).toString('hex');
      report = await prisma.report.create({
        data: {
          scanId: scan.id,
          format: 'LINK',
          url: slug
        }
      });
    }

    res.json({ url: report.url });
  } catch (err) {
    next(err);
  }
};

export const getSharedScanMeta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const report = await prisma.report.findFirst({
      where: { url: slug as string, format: 'LINK' },
      include: { scan: { include: { repo: true } } }
    });

    if (!report) {
       res.status(404).json({ error: 'Shared report not found' });
       return;
    }

    res.json((report as any).scan);
  } catch (err) {
    next(err);
  }
};

export const getSharedScanFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const report = await prisma.report.findFirst({
      where: { url: slug as string, format: 'LINK' }
    });

    if (!report) {
       res.status(404).json({ error: 'Shared report not found' });
       return;
    }

    const fileScores = await prisma.fileScore.findMany({
      where: { scanId: report.scanId },
      include: { contributors: true },
      orderBy: { riskScore: 'desc' }
    });

    const dependencies = await prisma.fileDependency.findMany({
      where: { scanId: report.scanId }
    });

    res.json({ fileScores, dependencies });
  } catch (err) {
    next(err);
  }
};
