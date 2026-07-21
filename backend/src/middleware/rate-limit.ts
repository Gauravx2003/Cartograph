import type { Request, Response, NextFunction } from 'express';
import { redisConnection } from '../jobs/queue.js';

const ANONYMOUS_SCANS_PER_HOUR_PER_IP = 1;

export const rateLimitAnonymous = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    return next(); // Bypass rate limiting for authenticated users
  }

  console.log("IP address is: ",req.ip);

  const ip = req.ip || 'unknown';
  const key = `ratelimit:scans:anon:${ip}`;

  try {
    const current = await redisConnection.incr(key);
    
    if (current === 1) {
      await redisConnection.expire(key, 3600); // 1 hour
    }

    if (current > ANONYMOUS_SCANS_PER_HOUR_PER_IP) {
      console.log("Rate Limit Exceeded.. for maximum files");
      res.status(429).json({ error: `Rate limit exceeded. Maximum ${ANONYMOUS_SCANS_PER_HOUR_PER_IP} anonymous scans per hour.` });
      return;
    }

    next();
  } catch (error) {
    // Fallback if Redis fails
    next();
  }
};
