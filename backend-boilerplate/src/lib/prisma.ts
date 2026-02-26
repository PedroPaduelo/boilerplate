import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL || '';
const urlWithParams = dbUrl.includes('?') ? dbUrl : `${dbUrl}?`;
const connectionParams = 'connection_limit=50&pool_timeout=20';
const finalUrl = urlWithParams.includes('connection_limit')
  ? dbUrl
  : `${urlWithParams}&${connectionParams}`;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: finalUrl,
      },
    },
    errorFormat: 'minimal',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
