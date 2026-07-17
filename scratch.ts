import prisma from './src/lib/prisma.ts';

async function main() {
  const tCount = await prisma.transaction.count();
  const eCount = await prisma.workspaceEvent.count();
  console.log('Transactions in DB:', tCount);
  console.log('WorkspaceEvents in DB:', eCount);
}
main().catch(console.error).finally(() => prisma.$disconnect());
