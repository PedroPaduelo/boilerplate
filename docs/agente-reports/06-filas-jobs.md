# Relatrio: Sistema de Filas e Jobs (BullMQ + Redis)

**Data da anlise:** 14 de maro de 2026
**Projeto:** Backend Boilerplate
**Stack:** Fastify + BullMQ + Redis + TypeScript

---

## Viso Geral

O sistema de filas e jobs utiliza **BullMQ** (biblioteca de filas baseada em Redis) para processamento assncrono de tarefas. A arquitetura segue o padro producer-consumer com:

- **Queue Manager**: Gerncia centralizada das instncias de fila
- **Worker Manager**: Gerncia de workers para processamento de jobs
- **Scheduler Manager**: Agendamento de jobs recorrentes e nicos
- **Bull Board**: Interface visual para monitoramento

---

## 1. Filas Configuradas (QUEUE_NAMES)

### 1.1 Lista de Filas

| Fila | Nome Tcnico | Propsito | Prioridade |
|------|-------------|----------|------------|
| Email | `email-queue` | Envio de e-mails | 1 (Alta) |
| Notificaes | `notification-queue` | Push/SMS | 2 (Alta) |
| Processamento | `processing-queue` | Imagens, relatrios, exportaes | 3 (Media) |
| Webhooks | `webhook-queue` | Chamadas HTTP externas | 2 (Alta) |
| Background | `background-queue` | Tarefas em background | 5 (Baixa) |
| Dead Letter | `dead-letter-queue` | Jobs falhados | N/A |

### 1.2 Configuraes por Fila

```typescript
// Local: queue-manager.ts (linhas 45-104)

EMAIL:
  - attempts: 5
  - backoff: exponential (2000ms)
  - removeOnComplete: { count: 500 }
  - removeOnFail: { count: 200 }

NOTIFICATION:
  - attempts: 3
  - backoff: exponential (1000ms)
  - removeOnComplete: { count: 1000 }
  - removeOnFail: { count: 500 }

PROCESSING:
  - attempts: 3
  - backoff: fixed (5000ms)
  - removeOnComplete: { count: 100 }
  - removeOnFail: { count: 50 }

WEBHOOK:
  - attempts: 2
  - backoff: fixed (3000ms)
  - removeOnComplete: { count: 500 }
  - removeOnFail: { count: 100 }

BACKGROUND:
  - attempts: 2
  - backoff: exponential (5000ms)
  - removeOnComplete: { count: 50 }
  - removeOnFail: { count: 20 }

DEAD_LETTER:
  - attempts: 1
  - removeOnComplete: false
  - removeOnFail: false
```

---

## 2. Workers e Processadores de Jobs

### 2.1 Arquitetura do Worker

**Arquivo:** `src/services/jobs/worker/worker-manager.ts`

O worker manager implementa:

- **Criao dinmica de workers** por fila
- **Rate limiting** (distribudo ou em memria)
- **Concorrncia configurvel** por fila
- **Event listeners**: completed, failed, stalled, error, closed
- **Pause/Resume** de workers individuais

### 2.2 Configuraes Padro de Workers

```typescript
// Linhas 332-358

EMAIL (email-queue):
  - concurrency: 10
  - rate limit: 50 jobs/segundo

NOTIFICATION (notification-queue):
  - concurrency: 15
  - rate limit: 100 jobs/segundo

PROCESSING (processing-queue):
  - concurrency: 5
  - rate limit: 10 jobs/segundo

WEBHOOK (webhook-queue):
  - concurrency: 20
  - rate limit: 50 jobs/segundo

BACKGROUND (background-queue):
  - concurrency: 3
  - rate limit: 5 jobs/segundo
```

### 2.3 Processadores de Jobs (Processors)

```typescript
// Linhas 84-156

Email:
  - send-email
  - send-bulk-email

Notificaes:
  - push-notification
  - send-sms

Processamento:
  - process-image
  - generate-report
  - export-data

Webhooks:
  - call-webhook

Background:
  - cleanup-data
  - sync-external

Default:
  - Processador genrico para jobs desconhecidos
```

### 2.4 Inicializao

```typescript
// server.ts (linhas 268-269)

await startAllWorkers();
```

Todos os workers so iniciados automaticamente junto com o servidor se Redis estiver disponvel.

---

## 3. Bull Board (Dashboard)

### 3.1 Configurao

```typescript
// server.ts (linhas 21-23, 236-266)

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
```

### 3.2 Rotas do Dashboard

- **Base path:** `/queues`
- **Filas monitoradas:** Todas as 6 filas configuradas
- **Adaptador:** BullMQAdapter (compatvel com BullMQ)

### 3.3 Funcionalidades Disponveis

- Visualizao de jobs por status (waiting, active, completed, failed, delayed)
- Detalhes de job individual
- Retry manual de jobs falhados
- Remoo de jobs
- Limpeza de filas

---

## 4. Retry e Dead Letters

### 4.1 Estratgia de Retry

**Configurao por fila:**

| Fila | Max Attempts | Backoff Type | Delay |
|------|--------------|--------------|-------|
| Email | 5 | Exponential | 2000ms |
| Notifications | 3 | Exponential | 1000ms |
| Processing | 3 | Fixed | 5000ms |
| Webhooks | 2 | Fixed | 3000ms |
| Background | 2 | Exponential | 5000ms |
| Dead Letter | 1 | N/A | N/A |

### 4.2 Lgica de Dead Letter Queue

```typescript
// worker-manager.ts (linhas 199-206, 302-326)

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);

  // Move para DLQ aps mximo de tentativas
  if (job?.attemptsMade && job.attemptsMade >= (job.opts.attempts || 3)) {
    moveToDeadLetterQueue(job).catch(console.error);
  }
});

async function moveToDeadLetterQueue(job: Job): Promise<void> {
  const dlq = getQueue(QUEUE_NAMES.DEAD_LETTER);
  await dlq.add('failed-job', {
    originalQueue: job.queueName,
    originalJobId: job.id,
    jobName: job.name,
    jobData: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    timestamp: job.timestamp,
  });
}
```

**Estrutura do job na DLQ:**
- `originalQueue`: Nome da fila original
- `originalJobId`: ID do job original
- `jobName`: Nome/tipo do job
- `jobData`: Dados do job
- `failedReason`: Motivo da falha
- `attemptsMade`: Nmero de tentativas
- `finishedOn`, `processedOn`: Timestamps
- `timestamp`: Data de criao

---

## 5. Producers (Servios que Geram Jobs)

### 5.1 API HTTP para Adio de Jobs

**Arquivo:** `src/http/routes/queue/queue-routes.ts`

#### Endpoint: POST `/queues/add`
Adiciona um nico job a uma fila.

```typescript
{
  "queue": "email-queue",
  "name": "send-email",
  "data": { "to": "user@example.com", "subject": "Hello" },
  "options": {
    "priority": 1,
    "delay": 0,
    "attempts": 5,
    "jobId": "optional-unique-id"
  }
}
```

#### Endpoint: POST `/queues/add-bulk`
Adiciona mltiplos jobs em uma nica operao.

```typescript
{
  "queue": "background-queue",
  "jobs": [
    { "name": "cleanup-data", "data": { "daysOld": 30 } },
    { "name": "sync-external", "data": { "source": "api" } }
  ]
}
```

#### Endpoint: GET `/queues`
Retorna status de todas as filas com contadores.

#### Endpoint: GET `/queues/:queue/jobs`
Lista jobs de uma fila especfica (at 100 por tipo).

#### Endpoint: GET `/queues/:queue/jobs/:jobId`
Detalhes de um job especfico.

#### Endpoint: POST `/queues/:queue/jobs/:jobId/retry`
Reexecuta um job falhado.

#### Endpoint: DELETE `/queues/:queue/jobs/:jobId`
Remove um job.

#### Endpoint: DELETE `/queues/:queue/clean`
Limpa at 100 jobs por status (waiting, active, completed, failed).

#### Endpoint: DELETE `/queues/:queue/empty`
Esvazia completamente uma fila.

### 5.2 Scheduler (Jobs Agendados/Recorrentes)

**Arquivo:** `src/services/jobs/scheduler/scheduler-manager.ts`

#### Padres de Repetio Disponveis:

```typescript
RepeatPatterns:
  - everyMinute()       // A cada minuto
  - every5Minutes()     // A cada 5 minutos
  - every15Minutes()    // A cada 15 minutos
  - everyHour()         // A cada hora
  - dailyAt(hour, min)  // Dirio s X:XX
  - weeklyOnSunday(h, m) // Semanalmente (domingo)
  - monthly(day, h, m)  // Mensalmente
  - weekdays(h, m)      // Dias teis (seg-sex)
```

#### Funes do Scheduler:

- `addRepeatableJob(jobKey, name, queueName, data, repeatOptions)`
- `removeRepeatableJob(jobKey)`
- `getRepeatableJobs()`
- `scheduleJob(name, queueName, data, delayMs)` - Job nico com delay
- `scheduleJobAt(name, queueName, data, date)` - Job nico em data especfica

#### Jobs Pr-configurados (scheduler-manager.ts linhas 242-281):

```typescript
- daily-cleanup:      cleanup-data na BACKGROUND-queue dirio s 3:00
- hourly-sync:        sync-external na BACKGROUND-queue a cada hora
- daily-report:       generate-report na PROCESSING-queue dias teis s 8:00
- monthly-backup:     export-data na PROCESSING-queue dia 1 s 2:00
```

### 5.3 Outros Producers Potenciais

O boilerplate permite que quaisquer servios adicionem jobs:

```typescript
import { addJob } from './services/jobs/queue/queue-manager';

// Exemplo de uso em um servio:
await addJob(QUEUE_NAMES.EMAIL, {
  name: 'send-email',
  data: { to: 'user@example.com', template: 'welcome' }
});
```

---

## 6. Redis Configuration

### 6.1 Conexes Separadas

```typescript
// connection-redis-config.ts

// Para Queue (operacoes de add/get)
connectionRedisConfigQueue = {
  host: env.REDIS_URL,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  family: 4,
};

// Para Workers (maxRetriesPerRequest  necessrio)
connectionRedisConfigWorker = {
  host: env.REDIS_URL,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  family: 4,
  maxRetriesPerRequest: null,  // Requerido pelo BullMQ
  connectTimeout: 10000,
};
```

### 6.2 Mode Degradado

O sistema opera em "modo degradado" se Redis est indisponvel:
- Workers no iniciam
- Queues retornam `null`
- API retorna status 503

---

## 7. Estrutura de Arquivos

```
backend-boilerplate/src/
├── services/
│   └── jobs/
│       ├── connection-redis-config.ts    # Config Redis
│       ├── queue/
│       │   ├── queue-manager.ts          # Gerenciador central de filas
│       │   └── example-queue.ts          # Exemplo de fila isolada
│       ├── worker/
│       │   ├── worker-manager.ts         # Gerenciador de workers
│       │   └── example-worker.ts         # Exemplo de worker simples
│       └── scheduler/
│           └── scheduler-manager.ts      # Agendamento de jobs
├── http/
│   └── routes/
│       └── queue/
│           └── queue-routes.ts           # API endpoints
└── server.ts                             # Setup BullBoard + workers
```

---

## 8. Dependncias Principais

```json
{
  "bullmq": "^5.64.0",
  "@bull-board/api": "^6.14.2",
  "@bull-board/fastify": "^6.14.2",
  "ioredis": "^5.4.1",
  "rate-limiter-flexible": "^9.1.1"
}
```

---

## 9. Resumo de Capacidades

| Recurso | Suporte |
|---------|---------|
| Prioridade de jobs | Sim (1-10) |
| Delay/Atraso | Sim |
| Repeties (repeatable) | Sim (cron, interval) |
| Retry automtico | Sim (max attempts + backoff) |
| Dead Letter Queue | Sim |
| Rate limiting | Sim (por worker/fila) |
| Concorrncia | Sim (configurvel por fila) |
| Monitoramento UI | Sim (Bull Board) |
| API REST de gerenciamento | Sim |
| Bulk add | Sim |
| Pause/Resume workers | Sim |
| Job progress tracking | Sim |
| Eventos (events) | Sim (QueueEvents disponvel) |

---

## 10. Recomendaes de Uso

1. **Para e-mails e notificaes crticas**: Use `email-queue` e `notification-queue` (alta prioridade, mais attempts)
2. **Para processamento pesado**: Use `processing-queue` (backoff fixo, menos concorrncia)
3. **Para integraes externas**: Use `webhook-queue` (timeout mais curto, 2 attempts)
4. **Para tarefas de manuteno**: Use `background-queue` (baixa prioridade)
5. **Para falhas**: Verificar `dead-letter-queue` manualmente ou via API

---

**Fim do relatrio**
