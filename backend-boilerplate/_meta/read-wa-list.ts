import { prisma } from '../src/lib/prisma';

async function main() {
  const convId = 'wa-5562966664444';
  const msgs = await prisma.chatMessage.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'asc' },
  });
  for (const m of msgs) {
    console.log('=== ' + m.role + ' [' + m.createdAt.toISOString() + '] ===');
    console.log(m.content);
    console.log('');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
