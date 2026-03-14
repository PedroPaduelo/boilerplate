# Relatório de Serviços e Regras de Negócio

**Data**: 2026-03-14
**Diretório Analisado**: `backend-boilerplate/src/services/`

---

## 1. Estrutura de Diretórios

```
src/services/
├── notification/
│   └── notification-service.ts      # Serviço de notificações (email, SMS, push)
└── jobs/
    ├── connection-redis-config.ts   # Configurações de conexão Redis
    ├── queue/
    │   ├── example-queue.ts         # Exemplo de fila customizada
    │   └── queue-manager.ts         # Gerenciador central de filas
    ├── scheduler/
    │   └── scheduler-manager.ts     # Agendamento de jobs repetitivos
    └── worker/
        ├── example-worker.ts        # Worker de exemplo
        └── worker-manager.ts        # Gerenciador de workers
```

---

## 2. Gerenciamento de Filas (BullMQ + Redis)

### 2.1 Definição de Filas

**Arquivo**: `src/services/jobs/queue/queue-manager.ts`

Todas as filas são tipadas via `QUEUE_NAMES`:

```typescript
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  PROCESSING: 'processing-queue',
  WEBHOOK: 'webhook-queue',
  BACKGROUND: 'background-queue',
  DEAD_LETTER: 'dead-letter-queue',
} as const;
```

### 2.2 Configurações por Fila

| Fila | Prioridade | Tentativas | Backoff | Remoção Completo | Remoção Falha |
|------|------------|------------|---------|------------------|---------------|
| EMAIL | 1 (alta) | 5 | exponential (2s) | 500 | 200 |
| NOTIFICATION | 2 | 3 | exponential (1s) | 1000 | 500 |
| PROCESSING | 3 | 3 | fixed (5s) | 100 | 50 |
| WEBHOOK | 2 | 2 | fixed (3s) | 500 | 100 |
| BACKGROUND | 5 (baixa) | 2 | exponential (5s) | 50 | 20 |
| DEAD_LETTER | - | 1 | - | false | false |

*Observação*: Em BullMQ, número menor = prioridade maior (1 é a mais alta).

### 2.3 APIs Principais

- `getQueue(name: QueueName): Queue | null` – Obtém instância singleton; retorna `null` se Redis em modo degradado.
- `addJob(queueName, options)` – Adiciona job à fila com logs.
- `addBulkJobs(queueName, jobs[])` – Adição em lote (até 500/1000 por configuração).
- `getAllQueues()` – Lista todas as filas ativas.
- `closeAllQueues()` – Fecha conexões no shutdown.

---

## 3. Processadores de Jobs (Worker Manager)

**Arquivo**: `src/services/jobs/worker/worker-manager.ts`

### 3.1 Processadores por Tipo de Job

| Nome do Job | Descrição | Exemplo de Dados |
|-------------|-----------|------------------|
| `send-email` | Envio de email único | `{ to: string, subject: string }` |
| `send-bulk-email` | Envio em massa | `{ recipients: string[] }` |
| `push-notification` | Notificação push | `{ title: string, body: string }` |
| `send-sms` | SMS via provedor | `{ phone: string, message: string }` |
| `process-image` | Processamento de imagem | `{ imageId: string }` |
| `generate-report` | Geração de relatórios | `{ reportType: string, format: 'pdf'\|'csv' }` |
| `export-data` | Exportação de dados | `{ format: 'json', type: 'full-backup' }` |
| `call-webhook` | Chamada HTTP a webhook | `{ url: string, method: string, body?: any }` |
| `cleanup-data` | Limpeza de dados antigos | `{ daysOld: number }` |
| `sync-external` | Sincronização com sistema externo | `{ source: string }` |
| `default` | Fallback para jobs não mapeados | qualquer |

### 3.2 Configuração de Workers

```typescript
interface WorkerConfig {
  queueName: string;
  concurrency?: number;      // jobs simultâneos
  limiter?: { max: number; duration: number }; // rate limit (ms)
  lockDuration?: number;     // duração do lock (padrão 30s)
  lockRenewTime?: number;    // renovação lock (padrão 15s)
  maxStalledCount?: number;  // max de jobs travados (padrão 2)
}
```

**Configurações Padrão (`defaultWorkerConfigs`)**

| Fila | Concorrência | Rate Limit |
|------|--------------|------------|
| EMAIL | 10 | 50 req/s |
| NOTIFICATION | 15 | 100 req/s |
| PROCESSING | 5 | 10 req/s |
| WEBHOOK | 20 | 50 req/s |
| BACKGROUND | 3 | 5 req/s |

Rate limit usa `rate-limiter-flexible` com Redis como store primário e memória como fallback.

### 3.3 Tratamento de Falhas

- Eventos: `completed`, `failed`, `stalled`, `error`, `closed`.
- Após `attemptsMade >= attempts` (padrão 3), job é movido para `DEAD_LETTER`.
- Jobs falhados são registrados com `failedReason`, timestamps.

### 3.4 Controles de Worker

- `startWorker(config)` – Inicia worker única.
- `stopWorker(queueName)` – Encerra worker.
- `stopAllWorkers()` – Limpa todos.
- `pauseWorker(queueName)` / `resumeWorker(queueName)` – Pausa/retoma.
- `getWorkerStatus(queueName)` – Retorna `{ running, isRunning, isPaused }`.

---

## 4. Agendamento de Tarefas (Scheduler)

**Arquivo**: `src/services/jobs/scheduler/scheduler-manager.ts`

### 4.1 Padrões de Repetição (`RepeatPatterns`)

```typescript
everyMinute()           // 60.000 ms
every5Minutes()         // 300.000 ms
every15Minutes()        // 900.000 ms
everyHour()             // 3.600.000 ms
dailyAt(hour, minute)   // cron: "minute hour * * *" (America/Sao_Paulo)
weeklyOnSunday(hour, minute) // cron: "minute hour * * 0"
monthly(day, hour, minute)   // cron: "minute hour day * *"
weekdays(hour, minute) // seg-sex: "minute hour * * 1-5"
```

### 4.2 Jobs Agendados Comuns (`setupCommonScheduledJobs`)

| Job Key | Nome | Fila | Agendamento | Dados |
|---------|------|------|-------------|-------|
| `daily-cleanup` | `cleanup-data` | BACKGROUND | Diário 03:00 | `{ daysOld: 30 }` |
| `hourly-sync` | `sync-external` | BACKGROUND | A cada hora | `{ source: 'external-api' }` |
| `daily-report` | `generate-report` | PROCESSING | Dias úteis 08:00 | `{ reportType: 'daily-summary', format: 'pdf' }` |
| `monthly-backup` | `export-data` | PROCESSING | Dia 1, 02:00 | `{ format: 'json', type: 'full-backup' }` |

### 4.3 APIs de Agendamento

- `addRepeatableJob(jobKey, name, queueName, data, repeatOptions)` – Adiciona job repetitivo; substitui chave existente.
- `removeRepeatableJob(jobKey)` – Remove agendamento específico.
- `getRepeatableJobs()` – Lista agendamentos ativos.
- `scheduleJob(name, queueName, data, delayMs)` – Job único com delay.
- `scheduleJobAt(name, queueName, data, Date)` – Agenda em data/hora específica.
- `removeAllScheduledJobs()` – Limpa todos agendamentos.

---

## 5. Serviço de Notificações

**Arquivo**: `src/services/notification/notification-service.ts`

```typescript
export interface NotificationPayload {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  async send(payload: NotificationPayload): Promise<boolean> { /* switch */ }
  private async sendEmail(payload): Promise<boolean>;
  private async sendSMS(payload): Promise<boolean>;
  private async sendPush(payload): Promise<boolean>;
}
```

- Uso: Switch por tipo; cada método privado deve integrar com provedor externo (ex: nodemailer, Twilio, Firebase).
- Atualmente apenas loga no console.
- Exporta instância singleton `notificationService`.

---

## 6. Configuração de Conexão Redis

**Arquivo**: `src/services/jobs/connection-redis-config.ts`

```typescript
export const connectionRedisConfigQueue = {
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4, // IPv4
};

export const connectionRedisConfigWorker = {
  maxRetriesPerRequest: null, // requerido pelo BullMQ
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4,
  connectTimeout: 10000, // 10s
};
```

- As configurações são usadas por `Queue` e `Worker`.
- O worker usa `maxRetriesPerRequest: null` para evitar erros de longas operações.

---

## 7. Integrações com Outros Subsistemas

### 7.1 Prisma

A camada de serviços **não acessa diretamente o Prisma**. O uso do Prisma ocorre nas rotas HTTP (`src/http/routes/`):

- `src/http/routes/auth/authenticate.ts`: busca usuário por email, verifica senha, atualiza `lastLoginAt`.
- `src/http/routes/user/create-user.ts`: criação de usuário com hash de senha.

Transações Prisma **não são encontradas** nos serviços atuais.

### 7.2 Redis

- **BullMQ** usa Redis como broker de filas.
- **Rate Limiter** (`rate-limiter-flexible`) usa Redis ou memória (fallback).
- **RedisService** (`src/lib/redis/redis-service.ts`) oferece operações: strings, sets, hashes, lists, TTL, contadores. Não é usado explicitamente nos workers, mas disponível.
- Servidor registra `fastify-redis` e compartilha `redisInstance` global para uso em request (disponível em hooks).

### 7.3 Socket.IO

Gerenciado em `src/socket/manager/socket-manager.ts` e eventos em `src/socket/events/`. Não integrado diretamente aos serviços.

### 7.4 Bull Board

Painel de monitoramento registrado em `/queues` (server.ts) usando adaptadores BullMQ.

---

## 8. Casos de Uso (API de Gerenciamento de Filas)

**Arquivo**: `src/http/routes/queue/queue-routes.ts`

Todas as rotas exigem autenticação (`fastify.authenticate`) e verificam `redisInstance.isDegraded()` retornando 503 se em degradação.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/queues` | Lista status de todas as filas com contagens (waiting, active, completed, failed, delayed). |
| POST | `/queues/add` | Adiciona job único. Body: `{ queue, name, data, options? }`. |
| POST | `/queues/add-bulk` | Adiciona múltiplos jobs. Body: `{ queue, jobs[] }`. |
| GET | `/queues/:queue/jobs` | Lista até 100 jobs por estado (waiting, active, failed). |
| GET | `/queues/:queue/jobs/:jobId` | Detalhes do job: state, progress, attempts, razão da falha. |
| POST | `/queues/:queue/jobs/:jobId/retry` | Reexecuta job falhado. |
| DELETE | `/queues/:queue/jobs/:jobId` | Remove job específico. |
| DELETE | `/queues/:queue/clean` | Limpa até 100 jobs por estado (waiting/active/completed/failed). |
| DELETE | `/queues/:queue/empty` | Esvazia completamente a fila. |

---

## 9. Inicialização do Servidor e Workers

**Arquivo**: `src/server.ts`

Sequência de inicialização:

1. Pré-verificação de disponibilidade Redis (`isRedisAvailable`).
2. Cria app Fastify com Zod type provider, hel­met, CORS, rate-limit, multipart, static, swagger.
3. Registra `fastify-redis` se Redis disponível; compartilha cliente global.
4. Registra Bull Board em `/queues` (monitoramento).
5. Inicia todos os workers via `startAllWorkers()`.
6. Registra todas as rotas (health, auth, users, queues, search).
7. Inicia listener na porta configurada.
8. Inicializa Socket.IO.

Se Redis indisponível, define `redisInstance.setDegraded(true)` e desabilita filas/cache.

---

## 10. Tratamento de Erros e Transações

### 10.1 Erros

- Middleware `errorHandler` em `src/http/routes/_errors/index.ts` (não analisado em detalhes aqui).
- Workers:
  - `failed` dispara logs e move para DLQ após `attempts`.
  - `stalled` loga warning.
- Queue manager: retorna `null` em falhas de adição, loga erros.
- Degradação: Verificação `redisInstance.isDegraded()` antes de operações críticas.

### 10.2 Transações

Não há uso de transações Prima nos serviços atuais. Rotas de usuário operam em única operação por request. Casos de uso complexos eventualmente usarão `prisma.$transaction()` em camadas de domínio (não presente neste boilerplate).

---

## 11. Regras de Negócio Identificadas

1. **Priorização de Jobs** – As filas possuem prioridades numéricas diferentes; quanto menor, mais alta a prioridade.
2. **Política de Retry** – Cada fila configura `attempts` e `backoff` (exponencial ou fixo).
3. **Limpeza Automática** – Configurações `removeOnComplete` e `removeOnFail` limitam armazenamento em Redis.
4. **Rate Limiting** – Workers aplicam limites por fila via `rate-limiter-flexible`.
5. **Dead Letter Queue** – Jobs que excedem tentativas são arquivados para análise posterior.
6. **Scheduler Patterns** – Agendamentos com timezone `America/Sao_Paulo`.
7. **Sistema Degradado** – Se Redis falha, operações de cache e filas são desabilitadas, mas endpoints HTTP ainda funcionam (com exceção das rotas de fila que retornam 503).
8. **Monitoramento** – Bull Board em `/queues` permite inspecionar filas em tempo real.

---

## 12. Considerações Finais

- A arquitetura é baseada em **jobs assíncronos** com BullMQ e Redis.
- A separação por filas permite escalonamento independente e políticas de retry/rate-limit específicas.
- O código é **altamente configurável** e serve como boilerplate para aplicações que necessitam processamento em background.
- O serviço de notificações está aberto para implementação concreta de provedores.
- O sistema demonstra boas práticas: log estruturado, tratamento de degradação, eventos de workers, monitoramento via dashboard.
- O uso de Prisma está presente na aplicação mas em camada diferente da de serviços/filas.

---

**Fim do Relatório**
