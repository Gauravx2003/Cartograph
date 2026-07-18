import 'dotenv/config';
import app from './app.js';
// Adjust this path based on exactly where your client.ts is located
import { prisma } from './db/client.js';
// Adjust this path based on exactly where your BullMQ setup file is located
import { redisConnection } from './jobs/queue.js'; 

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // 1. Explicitly connect to the PostgreSQL database
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL database.');

    // 2. Explicitly verify the Redis connection
    await redisConnection.ping();
    console.log('✅ Successfully connected to Redis instance.');

    // 3. Start the Express server only after all services are connected
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    // 4. Catch connection errors and kill the process
    console.error('❌ Failed to connect to required services:', error);
    process.exit(1); 
  }
}

startServer();