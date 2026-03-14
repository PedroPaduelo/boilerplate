#!/usr/bin/env node

// Healthcheck do sistema - verifica saúde dos serviços
// Retorna JSON: { status: 'ok' | 'degraded' | 'error', details: {...} }

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

// Carrega variáveis de ambiente
function loadEnv() {
  const { DATABASE_URL, REDIS_URL, OPENSEARCH_URL, NODE_ENV } = process.env;

  return {
    databaseUrl: DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boilerplate',
    redisUrl: REDIS_URL || 'redis://localhost:6379',
    opensearchUrl: OPENSEARCH_URL || 'http://localhost:9200',
    nodeEnv: NODE_ENV || 'development',
  };
}

// Verificahealth do banco de dados via Prisma
async function checkDatabase(prisma) {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Verificahealth do Redis
async function checkRedis(redisClient) {
  try {
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Verificahealth do OpenSearch
async function checkOpenSearch(opensearch) {
  try {
    const start = Date.now();
    const { statusCode } = await opensearch.transport.request({
      method: 'GET',
      path: '/_cluster/health',
    });
    const latency = Date.now() - start;

    if (statusCode === 200) {
      return { status: 'ok', latency, clusterStatus: 'unknown' };
    }
    return { status: 'error', error: `HTTP ${statusCode}` };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function main() {
  const config = loadEnv();
  const details = {};
  let overallStatus = 'ok';

  console.log(`${YELLOW}🔍 Executando healthcheck...${NC}`);

  // --- DATABASE CHECK ---
  const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  const dbCheck = await checkDatabase(prisma);
  details.database = dbCheck;
  if (dbCheck.status !== 'ok') {
    overallStatus = 'degraded';
  }
  await prisma.$disconnect();

  // --- REDIS CHECK ---
  const redisClient = new Redis(config.redisUrl, { connectTimeout: 5000 });
  try {
    const redisCheck = await checkRedis(redisClient);
    details.redis = redisCheck;
    if (redisCheck.status !== 'ok') {
      overallStatus = 'degraded';
    }
  } finally {
    redisClient.disconnect();
  }

  // --- OPENSEARCH CHECK ---
  const opensearch = new OpenSearchClient({
    node: config.opensearchUrl,
    maxRetries: 1,
    requestTimeout: 5000,
  });
  try {
    const opensearchCheck = await checkOpenSearch(opensearch);
    details.opensearch = opensearchCheck;
    if (opensearchCheck.status !== 'ok') {
      overallStatus = 'degraded';
    }
  } finally {
    await opensearch.close();
  }

  // --- SERVIÇOS ADICIONAIS ---
  details.timestamp = new Date().toISOString();
  details.environment = config.nodeEnv;

  // Log colorido no console
  if (overallStatus === 'ok') {
    console.log(`${GREEN}✅ Sistema saudável${NC}`);
  } else if (overallStatus === 'degraded') {
    console.log(`${YELLOW}⚠️  Sistema degradado${NC}`);
  } else {
    console.log(`${RED}❌ Sistema em erro${NC}`);
  }

  console.log('');
  console.log(`Database: ${details.database.status === 'ok' ? GREEN : RED}${details.database.status}${NC}${details.database.latency ? ` (${details.database.latency}ms)` : ''}`);
  console.log(`Redis:    ${details.redis.status === 'ok' ? GREEN : RED}${details.redis.status}${NC}${details.redis.latency ? ` (${details.redis.latency}ms)` : ''}`);
  console.log(`Search:   ${details.opensearch.status === 'ok' ? GREEN : RED}${details.opensearch.status}${NC}${details.opensearch.latency ? ` (${details.opensearch.latency}ms)` : ''}`);

  // Retornar JSON para uso em APIs/monitoramento
  const result = {
    status: overallStatus,
    details,
  };

  console.log('');
  console.log('JSON para uso em API:');
  console.log(JSON.stringify(result, null, 2));

  // Código de saída apropriado
  if (overallStatus === 'error') process.exit(1);
  else if (overallStatus === 'degraded') process.exit(2);
  else process.exit(0);
}

main().catch((error) => {
  console.error(`${RED}❌ Erro no healthcheck: ${error.message}${NC}`);
  process.exit(1);
});
