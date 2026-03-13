import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@99freela.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@99freela.com',
      password: passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  const userPasswordHash = await hash('user123', 10);

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@99freela.com' },
    update: {},
    create: {
      name: 'User Test',
      email: 'user@99freela.com',
      password: userPasswordHash,
      role: 'USER',
      isActive: true,
    },
  });

  console.log(`✅ Regular user created: ${regularUser.email}`);
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
