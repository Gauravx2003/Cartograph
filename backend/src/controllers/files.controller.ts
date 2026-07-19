import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    
    const scan = await prisma.scan.findUnique({
      where: { id: scanId as string },
      include: { repo: true }
    });

    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.repo.isPrivate) {
      if (!req.user || req.user.id !== scan.requestedById) {
        res.status(401).json({ error: 'Unauthorized: You do not have permission to view files for this scan.' });
        return;
      }
    }

    const files = await prisma.fileScore.findMany({
      where: { scanId: scanId as string },
      orderBy: { riskScore: 'desc' }
    });
    res.json(files);
  } catch (error) {
    next(error);
  }
};
