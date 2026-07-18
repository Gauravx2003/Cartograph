import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { scanQueue } from '../jobs/queue.js';

export const createScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repoId } = req.params;
    
    const repo = await prisma.repo.findUnique({ where: { id: repoId as string } });
    if (!repo) {
      res.status(404).json({ error: 'Repo not found' });
      return;
    }

    if (repo.isPrivate && !req.user) {
      res.status(401).json({ error: 'Unauthorized: Private repositories require authentication.' });
      return;
    }

    const scan = await prisma.scan.create({
      data: {
        repoId: repo.id,
        status: 'QUEUED',
        startedAt: new Date(),
        isAnonymous: !req.user,
        requestedById: req.user?.id || null,
        requesterIp: req.ip || null,
        explanationsRequested: req.body?.explanationsRequested || false
      }
    });
    
    // Add job to BullMQ
    await scanQueue.add('scan', { scanId: scan.id, repoId: repo.id });
    
    res.status(202).json({ message: 'Scan queued successfully', scanId: scan.id });
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
