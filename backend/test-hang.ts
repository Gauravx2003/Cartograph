console.log('1. Starting...');
import { redisConnection } from './src/jobs/queue.js';
console.log('2. Imported queue');
import { processScanJob } from './src/jobs/scan-repo.job.js';
console.log('3. Imported scan-repo.job');
console.log('Done');
