import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';

export const createRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, name, githubRepoId, defaultBranch, isPrivate } = req.body;
    
    // Create a dummy user for the sake of bypassing auth in this step
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: 'dummy-github-id',
          username: 'dummyuser',
          accessTokenEnc: 'dummy-token',
        }
      });
    }

    const repo = await prisma.repo.create({
      data: {
        githubRepoId: githubRepoId || `dummy-${Date.now()}`,
        owner: owner || 'dummy-owner',
        name: name || 'dummy-repo',
        fullName: `${owner || 'dummy-owner'}/${name || 'dummy-repo'}`,
        defaultBranch: defaultBranch || 'main',
        isPrivate: isPrivate || false,
        connectedById: user.id
      }
    });
    
    res.status(201).json(repo);
  } catch (error) {
    next(error);
  }
};

export const getRepos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repos = await prisma.repo.findMany();
    res.json(repos);
  } catch (error) {
    next(error);
  }
};
