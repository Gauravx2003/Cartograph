import { Queue } from 'bullmq';
import { Redis } from 'ioredis'; // Use named import
import 'dotenv/config';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Instantiate the named Redis class
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const scanQueue = new Queue('scan-queue', {
  connection: redisConnection,
});