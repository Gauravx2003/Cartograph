import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import type { User } from '../generated/prisma/client.js';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Read from cookie (requires cookie-parser) or fallback to Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.warn('JWT_SECRET is missing, cannot verify tokens');
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    if (decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Optional auth doesn't fail on error, just passes through as anonymous
  }
  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  optionalAuth(req, res, (err?: any) => {
    if (err) return next(err);
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
};

