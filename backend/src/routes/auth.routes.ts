import { Router } from 'express';
import { githubLogin, githubCallback, logout, getMe } from '../controllers/auth.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.post('/logout', logout);
router.get('/me', optionalAuth, getMe);

export default router;
