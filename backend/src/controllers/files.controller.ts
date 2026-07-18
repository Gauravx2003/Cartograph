import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    const files = await prisma.fileScore.findMany({
      where: { scanId: scanId as string },
      orderBy: { riskScore: 'desc' },
      take: 100 // Limit to top 100
    });
    res.json(files);
  } catch (error) {
    next(error);
  }
};
