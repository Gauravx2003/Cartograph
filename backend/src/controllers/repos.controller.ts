import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { decryptToken } from '../utils/crypto.js';

export const createRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, name, githubRepoId, defaultBranch, isPrivate } = req.body;
    const finalGithubRepoId = githubRepoId || `dummy-${Date.now()}`;
    const repo = await prisma.repo.upsert({
      where: { githubRepoId: finalGithubRepoId },
      update: {
        owner: owner || 'dummy-owner',
        name: name || 'dummy-repo',
        fullName: `${owner || 'dummy-owner'}/${name || 'dummy-repo'}`,
        defaultBranch: defaultBranch || 'main',
        isPrivate: isPrivate || false,
        connectedById: req.user?.id || null
      },
      create: {
        githubRepoId: finalGithubRepoId,
        owner: owner || 'dummy-owner',
        name: name || 'dummy-repo',
        fullName: `${owner || 'dummy-owner'}/${name || 'dummy-repo'}`,
        defaultBranch: defaultBranch || 'main',
        isPrivate: isPrivate || false,
        connectedById: req.user?.id || null
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

export const getUserGithubRepos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user.accessTokenEnc) {
      res.status(401).json({ error: 'No GitHub token available' });
      return;
    }

    const token = decryptToken(user.accessTokenEnc);

    // Fetch user repos from GitHub API
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cartograph-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
    }

    const repos = await response.json() as any[];
    
    // Map to a simpler format for the frontend
    const mappedRepos = repos.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch
    }));

    res.json(mappedRepos);
  } catch (error) {
    next(error);
  }
};

export const getGithubRepoDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    
    let token = '';
    const user = req.user;
    if (user && user.accessTokenEnc) {
      token = decryptToken(user.accessTokenEnc);
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Cartograph-App'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

    //console.log("Response is: ", response);

    if (!response.ok) {
      if (response.status === 404) {
         res.status(404).json({ error: 'Repository not found or private' });
         return;
      }
      throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
    }

    const repoData = await response.json() as any;

    //console.log(repoData);
    
    res.json({
      name: repoData.name,
      fullName: repoData.full_name,
      owner: repoData.owner.login,
      isPrivate: repoData.private,
      defaultBranch: repoData.default_branch,
      sizeKb: repoData.size
    });
  } catch (error) {
    next(error);
  }
};
