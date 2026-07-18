import { Redis } from 'ioredis';
import 'dotenv/config';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Connecting to Redis at: ${redisUrl}...`);

const redis = new Redis(redisUrl);

redis.ping()
  .then((response) => {
    console.log(`✅ Success! Redis responded with: ${response}`);
  })
  .catch((error) => {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('\nTip: Make sure your Redis server/Docker container is running.');
  })
  .finally(() => {
    redis.disconnect();
  });