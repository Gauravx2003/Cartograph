import { Router } from 'express';
import { createRepo, getRepos, getUserGithubRepos, getGithubRepoDetails } from '../controllers/repos.controller.js';
import { createScan } from '../controllers/scans.controller.js';
import { rateLimitAnonymous } from '../middleware/rate-limit.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/github', requireAuth, getUserGithubRepos);
router.get('/github/:owner/:repo', optionalAuth, getGithubRepoDetails);
router.post('/', createRepo);
router.get('/', getRepos);
router.post('/:repoId/scans', rateLimitAnonymous, createScan);

export default router;
