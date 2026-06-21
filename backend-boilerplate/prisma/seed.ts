import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Wipe all existing users — start the project from a clean slate.
  const deleted = await prisma.user.deleteMany({});
  console.log(`🧹 Removed ${deleted.count} existing user(s)`);

  // Single demo user (ADMIN) used to test the app.
  // Password follows the app policy (min 8 chars, letter + number).
  const password = await hash('demo1234', 10);
  const demo = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      password,
      role: 'ADMIN',
    },
  });

  console.log('✅ Demo user created:', demo.email, '(password: demo1234, role: ADMIN)');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
