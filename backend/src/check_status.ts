import { prisma } from './db/client.js';

async function main() {
  const scans = await prisma.scan.findMany({
    orderBy: { startedAt: 'desc' },
    take: 3
  });
  console.log(JSON.stringify(scans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
