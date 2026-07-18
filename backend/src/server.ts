import 'dotenv/config';
import app from './app.js';
// Adjust this path based on exactly where your client.ts is located
import { prisma } from './db/client.js'; 

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // 1. Explicitly connect to the database
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL database.');

    // 2. Start the Express server only after DB connects
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    // 3. Catch connection errors and kill the process
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1); 
  }
}

startServer();