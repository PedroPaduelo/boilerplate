import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user (use to validate ADMIN-only routes / RBAC).
  // Passwords follow the app password policy (min 8 chars, letter + number).
  const adminPassword = await hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email, '(password: admin1234)');

  // Create regular user (should be denied on ADMIN-only routes).
  const userPassword = await hash('user1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { role: 'USER' },
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('✅ Regular user created:', user.email, '(password: user1234)');

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
