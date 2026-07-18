import { prisma } from './db/client.js';

async function main() {
  console.log('Connecting to database...');
  
  // Create a dummy repo
  const newRepo = await prisma.repository.create({
    data: {
      name: 'test-repo',
      url: 'https://github.com/test/repo',
    },
  });
  
  console.log('Successfully inserted repo:', newRepo);
  
  // Fetch all repos to verify
  const allRepos = await prisma.repository.findMany();
  console.log('All repos in DB:', allRepos);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });