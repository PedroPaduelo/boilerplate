#!/usr/bin/env node

// Seed de dados iniciais para o projeto Boilerplate.
// Usa PrismaClient para criar dados idempotentes.

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

async function main() {
  console.log(`${YELLOW}🌱 Iniciando seed de dados...${NC}`);

  const adminPassword = await hash('admin123', 10);
  const userPassword = await hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@boilerplate.com' },
    update: {
      name: 'Admin Boilerplate',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@boilerplate.com',
      name: 'Admin Boilerplate',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@boilerplate.com' },
    update: {
      name: 'User Boilerplate',
      password: userPassword,
      role: 'USER',
      isActive: true,
    },
    create: {
      email: 'user@boilerplate.com',
      name: 'User Boilerplate',
      password: userPassword,
      role: 'USER',
      isActive: true,
    },
  });

  console.log(`${GREEN}✅ Usuários criados/atualizados:${NC} ${admin.email}, ${normalUser.email}`);

  // Cria tabelas de logs, notificações e documentos de busca se não existirem.
  // Como o schema atual só tem User, vamos criar dados de exemplo em tabelas genéricas com prisma.$executeRaw.

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email TEXT,
      level TEXT,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email TEXT,
      title TEXT,
      message TEXT,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS documents_search (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO logs (id, user_email, level, message)
    VALUES
      (gen_random_uuid(), $1, 'INFO', 'Seed inicial executada'),
      (gen_random_uuid(), $2, 'INFO', 'Usuário criado via seed')
    ON CONFLICT DO NOTHING
  `, admin.email, normalUser.email;

  await prisma.$executeRaw`
    INSERT INTO notifications (id, user_email, title, message, read)
    VALUES
      (gen_random_uuid(), $1, 'Bem-vindo!', 'Seu ambiente foi provisionado', FALSE),
      (gen_random_uuid(), $2, 'Lembrete', 'Troque sua senha regularmente', FALSE)
    ON CONFLICT DO NOTHING
  `, admin.email, normalUser.email;

  await prisma.$executeRaw`
    INSERT INTO documents_search (id, title, content)
    VALUES
      (gen_random_uuid(), 'Documento de Exemplo', 'Este é um documento de exemplo para busca.'),
      (gen_random_uuid(), 'Guia de Uso', 'Use o boilerplate para desenvolver rapidamente.')
    ON CONFLICT DO NOTHING
  `;

  console.log(`${GREEN}✅ Dados de logs, notificações e documentos de pesquisa inseridos${NC}`);

  console.log(`${GREEN}🎉 Seed finalizado com sucesso!${NC}`);
}

main()
  .catch((error) => {
    console.error(`${RED}❌ Seed falhou: ${error.message || error}${NC}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
