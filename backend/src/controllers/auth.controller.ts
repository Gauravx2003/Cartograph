import type { Request, Response, NextFunction } from 'express';
import { getGithubOAuthUrl, handleGithubCallback } from '../services/github/oauth.service.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const githubLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = getGithubOAuthUrl();
    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

export const githubCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).send('Missing code parameter');
      return;
    }

    const jwtToken = await handleGithubCallback(code);

    // Set HTTP-only cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to frontend (the frontend will rely on the cookie for future API calls)
    res.redirect(`${FRONTEND_URL}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
};

export const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }
  
  const { accessTokenEnc, ...safeUser } = req.user;
  res.json({ user: safeUser });
};
