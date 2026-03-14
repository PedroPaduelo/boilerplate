# Análise de Uso do Redis (Cache + Broker)

## 1. Configuração do Redis

### 1.1 Variáveis de Ambiente

O Redis é configurado através das seguintes variáveis de ambiente (definidas em `backend-boilerplate/src/lib/env.ts`):

```typescript
REDIS_URL: string        // Host do Redis (obrigatório)
REDIS_PASSWORD: string   // Senha (opcional, padrão: '')
REDIS_PORT: number       // Porta (padrão: 6379)
```

### 1.2 Docker Compose

O projeto inclui Redis 7 Alpine no docker-compose.yml:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

### 1.3 Configurações de Conexão

O projeto define duas configurações de conexão Redis em `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/services/jobs/connection-redis-config.ts`:

**Para Filas (Queue):**
```typescript
export const connectionRedisConfigQueue = {
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4, // Force IPv4
};
```

**Para Workers:**
```typescript
export const connectionRedisConfigWorker = {
  maxRetriesPerRequest: null, // Requerido pelo BullMQ
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4,
  connectTimeout: 10000, // 10 segundos
};
```

### 1.4 Verificação de Disponibilidade

Antes de iniciar o servidor, há uma verificação de disponibilidade do Redis em `server.ts`:

```typescript
async function isRedisAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new Redis({
      host: env.REDIS_URL,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      family: 4,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    // Timeout de 4 segundos
  });
}
```

### 1.5 Dependências

Principais packages relacionados ao Redis:
- `ioredis`: ^5.4.1 - Cliente Redis para Node.js
- `@fastify/redis`: ^7.1.0 - Plugin Fastify para Redis
- `bullmq`: ^5.64.0 - Biblioteca de filas (usa Redis como broker)
- `@fastify/rate-limit`: ^10.3.0 - Rate limiting
- `rate-limiter-flexible`: ^9.1.1 - Rate limiter flexível com suporte a Redis

---

## 2. Uso como Cache

### 2.1 RedisService

O projeto implementa um serviço de cache robusto em `backend-boilerplate/src/lib/redis/redis-service.ts`:

```typescript
export class RedisService {
  // Operações com Strings
  async getValue(key: string): Promise<string | null>
  async setValue(key: string, value: string, expirationInSeconds?: number): Promise<string>

  // Verificação e Deleção
  async hasKey(key: string): Promise<boolean>
  async deleteKey(key: string): Promise<number>

  // Operações com Sets
  async addToSet(key: string, value: string): Promise<number>
  async getSetMembers(key: string): Promise<string[]>

  // Operações com Contadores
  async increment(key: string, increment = 1): Promise<number>

  // Operações com Hashes
  async setHashField(hashKey: string, field: string, value: string): Promise<number>
  async getHashField(hashKey: string, field: string): Promise<string | null>
  async getHashAll(hashKey: string): Promise<Record<string, string>>

  // Operações com Listas
  async addToList(key: string, value: string): Promise<number>
  async getList(key: string): Promise<string[]>

  //TTL
  async expire(key: string, seconds: number): Promise<number>

  // Padrões
  async keys(pattern: string): Promise<string[]>
}
```

### 2.2 Registro Global do Cliente Redis

O cliente Redis é registrado globalmente através do Fastify:

```typescript
// server.ts
if (redisAvailable) {
  app.register(fastifyRedis, {
    host: env.REDIS_URL,
    password: env.REDIS_PASSWORD || undefined,
    port: env.REDIS_PORT,
    family: 4,
  });

  app.addHook('onReady', () => {
    redisInstance.setClient(app.redis);
  });
}
```

---

## 3. Chaves e TTLs

### 3.1 Prefixos de Chaves Usados

| Prefixo | Descrição | Localização |
|---------|-----------|-------------|
| `ratelimit:` | Rate limiting | worker-manager.ts |
| Filas BullMQ | Jobs em processamento | queue-manager.ts |
| Cache genérico | Dados de cache | redis-service.ts |

### 3.2 TTLs Configurados

**Rate Limiting (Worker):**
```typescript
// 100 requests por segundo
rateLimiterRedis = new RateLimiterRedis({
  keyPrefix: 'ratelimit',
  points: 100,
  duration: 1000, // 1 segundo
});
```

**Rate Limiting Global (Fastify):**
```typescript
app.register(fastifyRateLimit, {
  max: 100, // 100 requests por window
  timeWindow: '1 minute',
});
```

**TTL via RedisService:**
O TTL é configurável por chamada:
```typescript
await redisService.setValue(key, value, expirationInSeconds);
```

### 3.3 TTLs BullMQ

As filas BullMQ têm configurações de TTL para jobs:

| Fila | removeOnComplete | removeOnFail |
|------|-----------------|--------------|
| EMAIL | 500 jobs | 200 jobs |
| NOTIFICATION | 1000 jobs | 500 jobs |
| PROCESSING | 100 jobs | 50 jobs |
| WEBHOOK | 500 jobs | 100 jobs |
| BACKGROUND | 50 jobs | 20 jobs |
| DEAD_LETTER | false | false |

---

## 4. Modo Degradado

### 4.1 Implementação do Modo Degradado

O projeto implementa um sistema robusto de modo degradado em `backend-boilerplate/src/lib/redis/redis-instance.ts`:

```typescript
class RedisInstance {
  private client: RedisClient | null = null;
  private _isDegraded = false;

  setDegraded(value: boolean): void {
    this._isDegraded = value;
  }

  isDegraded(): boolean {
    return this._isDegraded;
  }
}
```

### 4.2 Ativação do Modo Degradado

**Durante a inicialização (server.ts):**
```typescript
const redisAvailable = await isRedisAvailable();

if (redisAvailable) {
  // Inicializa Redis normalmente
  app.register(fastifyRedis, {...});
} else {
  redisInstance.setDegraded(true);
  console.warn('⚠️ Redis offline - modo degradado (sem cache e filas)');
}
```

### 4.3 Resposta às Requisições

Todas as rotas relacionadas a filas verificam o modo degradado:

```typescript
// queue-routes.ts
if (redisInstance.isDegraded()) {
  return reply.status(503).send({
    error: 'Service unavailable',
    message: 'Redis is in degraded mode',
  });
}
```

### 4.4 Fallbacks

| Componente | Fallback |
|-----------|----------|
| Rate Limiter Redis | RateLimiterMemory (memória) |
| Cache Redis | Sem cache |
| Filas BullMQ | Retornam null, jobs não são adicionados |
| Workers | Não são iniciados |

### 4.5 Verificação em Filas e Workers

```typescript
// queue-manager.ts
export function getQueue(name: QueueName): Queue | null {
  if (redisInstance.isDegraded()) {
    console.warn(`⚠️ Cannot get queue ${name} - Redis is in degraded mode`);
    return null;
  }
  // ...
}

// worker-manager.ts
export function startWorker(config: WorkerConfig): Worker | null {
  if (redisInstance.isDegraded()) {
    console.warn(`⚠️ Cannot start worker - Redis is in degraded mode`);
    return null;
  }
  // ...
}
```

---

## 5. Rate Limiting com Redis

### 5.1 Rate Limiting Global (Fastify)

O projeto usa `@fastify/rate-limit` com Redis:

```typescript
// server.ts
app.register(fastifyRateLimit, {
  max: 100, // 100 requests por window
  timeWindow: '1 minute',
  redis: redisAvailable ? app.redis : undefined,
  keyGenerator: (request) => {
    return request.ip;
  },
});
```

### 5.2 Rate Limiting nos Workers

O projeto implementa rate limiting por fila usando `rate-limiter-flexible`:

```typescript
// worker-manager.ts
let rateLimiterRedis: RateLimiterRedis | null = null;
let rateLimiterMemory: RateLimiterMemory | null = null;

async function initRateLimiters() {
  // Memory limiter como fallback
  rateLimiterMemory = new RateLimiterMemory({
    points: 100,
    duration: 1000, // 100 requests por segundo
  });

  // Redis limiter (se disponível)
  try {
    const redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    await redisClient.ping();
    rateLimiterRedis = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ratelimit',
      points: 100,
      duration: 1000,
    });
  } catch (error) {
    console.warn('⚠️ Rate limiter (Redis) failed, using memory fallback');
  }
}
```

### 5.3 Rate Limiting BullMQ

Cada worker BullMQ tem seu próprio limitador configurável:

```typescript
export const defaultWorkerConfigs: WorkerConfig[] = [
  {
    queueName: QUEUE_NAMES.EMAIL,
    concurrency: 10,
    limiter: { max: 50, duration: 1000 }, // 50 emails/seg
  },
  {
    queueName: QUEUE_NAMES.NOTIFICATION,
    concurrency: 15,
    limiter: { max: 100, duration: 1000 }, // 100 notifs/seg
  },
  {
    queueName: QUEUE_NAMES.PROCESSING,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 }, // 10 processamentos/seg
  },
  {
    queueName: QUEUE_NAMES.WEBHOOK,
    concurrency: 20,
    limiter: { max: 50, duration: 1000 },
  },
  {
    queueName: QUEUE_NAMES.BACKGROUND,
    concurrency: 3,
    limiter: { max: 5, duration: 1000 },
  },
];
```

---

## 6. BullMQ como Broker

### 6.1 Filas Definidas

O projeto define 6 filas principais em `backend-boilerplate/src/services/jobs/queue/queue-manager.ts`:

```typescript
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  PROCESSING: 'processing-queue',
  WEBHOOK: 'webhook-queue',
  BACKGROUND: 'background-queue',
  DEAD_LETTER: 'dead-letter-queue',
};
```

### 6.2 Configuração das Filas

| Fila | Prioridade | Attempts | Backoff |removeOnComplete | removeOnFail |
|------|-----------|----------|---------|-----------------|--------------|
| EMAIL | 1 (alta) | 5 | exponential (2s) | 500 | 200 |
| NOTIFICATION | 2 | 3 | exponential (1s) | 1000 | 500 |
| PROCESSING | 3 | 3 | fixed (5s) | 100 | 50 |
| WEBHOOK | 2 | 2 | fixed (3s) | 500 | 100 |
| BACKGROUND | 5 (baixa) | 2 | exponential (5s) | 50 | 20 |
| DEAD_LETTER | - | 1 | - | false | false |

### 6.3 Operações com Filas

```typescript
// Adicionar job
const job = await addJob(QUEUE_NAMES.EMAIL, {
  name: 'send-email',
  data: { to: 'user@example.com' },
  options: {
    priority: 1,
    delay: 0,
    attempts: 3,
  },
});

// Adicionar múltiplos jobs
const jobs = await addBulkJobs(QUEUE_NAMES.EMAIL, [
  { name: 'send-email', data: {...} },
  { name: 'send-email', data: {...} },
]);

// Obter job
const job = await queue.getJob(jobId);

// Retry job
await job.retry();

// Remover job
await job.remove();

// Limpar fila
await queue.clean(grace, 100, 'wait');

// Esvaziar fila
await queue.empty();
```

### 6.4 Workers

Os workers processam jobs de cada fila:

```typescript
const processors: Record<string, JobProcessor> = {
  'send-email': async (job) => {...},
  'push-notification': async (job) => {...},
  'process-image': async (job) => {...},
  'generate-report': async (job) => {...},
  'call-webhook': async (job) => {...},
  'cleanup-data': async (job) => {...},
  'sync-external': async (job) => {...},
};
```

### 6.5 Dead Letter Queue

Jobs que falham após todas as tentativas são movidos para a DLQ:

```typescript
async function moveToDeadLetterQueue(job: Job): Promise<void> {
  await dlq.add('failed-job', {
    originalQueue: job.queueName,
    originalJobId: job.id,
    jobName: job.name,
    jobData: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  });
}
```

### 6.6 Jobs Agendados (Scheduler)

O projeto suporta jobs agendados via RepeatOptions:

```typescript
// Padrões de repetição disponíveis
RepeatPatterns.everyMinute()
RepeatPatterns.every5Minutes()
RepeatPatterns.every15Minutes()
RepeatPatterns.everyHour()
RepeatPatterns.dailyAt(hour, minute)
RepeatPatterns.weeklyOnSunday(hour, minute)
RepeatPatterns.monthly(day, hour, minute)
RepeatPatterns.weekdays(hour, minute)
```

Exemplo de job agendado:
```typescript
await addRepeatableJob(
  'daily-cleanup',
  'cleanup-data',
  QUEUE_NAMES.BACKGROUND,
  { daysOld: 30 },
  RepeatPatterns.dailyAt(3, 0) // Todo dia às 3:00
);
```

### 6.7 Bull Board (Monitoramento)

Interface de monitoramento disponível em `/queues`:
```typescript
// server.ts
const serverAdapter = new FastifyAdapter();
createBullBoard({
  queues: queueAdapters,
  serverAdapter,
});
serverAdapter.setBasePath('/queues');
app.register(serverAdapter.registerPlugin(), { prefix: '/queues' });
```

---

## 7. Resumo

### Pontos Fortes

1. **Modo Degradado Robusto**: O sistema degrada gracefully quando Redis não está disponível
2. **Rate Limiting em Múltiplos Níveis**: Fastify (HTTP), BullMQ (filas), e rate-limiter-flexible
3. **Filas Bem Estruturadas**: Prioridades, retry, DLQ e jobs agendados
4. **Monitoramento**: Bull Board integrado
5. **Fallbacks**: Rate limiter memória, cache em memória

### Considerações

1. **Redis como Ponto Único de Falha**: O projeto usa Redis para cache, rate limiting e filas
2. **TTL Padrão**: TTLs de cache não são definidos por padrão (precisam ser passados explicitamente)
3. **Keys Pattern**: O uso de `keys()` pode ser problemático em produção (bloqueante)
4. **Cache de Search**: O search usa Elasticsearch, não há cache Redis específico implementado

### Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/redis/redis-instance.ts` | Singleton do cliente Redis |
| `src/lib/redis/redis-service.ts` | Serviço de cache |
| `src/lib/redis/index.ts` | Exports |
| `src/services/jobs/connection-redis-config.ts` | Configurações de conexão |
| `src/services/jobs/queue/queue-manager.ts` | Gerenciador de filas |
| `src/services/jobs/worker/worker-manager.ts` | Workers e rate limiting |
| `src/services/jobs/scheduler/scheduler-manager.ts` | Jobs agendados |
| `src/server.ts` | Inicialização e configuração |
