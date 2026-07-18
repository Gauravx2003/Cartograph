import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import type { User } from '../../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (token) {
      // In a real app this would verify a JWT, here we just lookup the token
      const user = await prisma.user.findFirst({
        where: { accessTokenEnc: token }
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
