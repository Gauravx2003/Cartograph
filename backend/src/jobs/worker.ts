import { Worker } from 'bullmq';
import { redisConnection } from './queue.js';
import { processScanJob } from './scan-repo.job.js';
import 'dotenv/config';

console.log('Starting BullMQ worker on scan-queue...');

const worker = new Worker('scan-queue', processScanJob, {
  connection: redisConnection,
  concurrency: 1, // Process one scan at a time for now
});

worker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});

export default worker;
