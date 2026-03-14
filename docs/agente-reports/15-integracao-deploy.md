# Relatório de Integrações Externas, Deploy e Configuração

## Data da Análise
14 de Março de 2026

---

## Sumário Executivo

Este projeto é um **monorepo fullstack** contendo múltiplas aplicações:
- **Backend**: Fastify + Prisma + Redis + BullMQ + Socket.IO (porta 3333)
- **Frontend**: React + Vite + TailwindCSS (porta 5173)
- **Next.js API REST**: Next.js 15 + NextAuth (porta 4001)
- **Next.js Boilerplate**: Aplicação fullstack Next.js com Prisma

Infraestrutura com Docker Compose para PostgreSQL e Redis, configurada paraEasyPanel.

---

## 1. Variáveis de Ambiente

### 1.1 Arquivo `.env.example` (Nível Projeto)

Localização: `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/.env.example`

```env
# Variáveis de Ambiente do Projeto

## Backend
NODE_ENV=development
PORT=3333
BASE_URL=http://localhost:3333
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=postgres://postgres:postgres@localhost:5432/boilerplate?sslmode=disable
REDIS_URL=localhost
REDIS_PASSWORD=
REDIS_PORT=6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
UPLOAD_TIMEOUT=120000
CORS_ORIGINS=http://localhost:5173,http://localhost:3333

## Frontend
VITE_API_URL=http://localhost:3333
```

### 1.2 Schema de Validação (`backend-boilerplate/src/lib/env.ts`)

O backend implementa validação rigorosa com Zod:

```typescript
const envSchema = z.object({
  // Application
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  BASE_URL: z.string().url().default('http://localhost:4000'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_PORT: z.coerce.number().default(6379),

  // Upload
  UPLOAD_DIR: z.string().optional(),
  MAX_FILE_SIZE: z.coerce.number().default(104857600), // 100MB
  UPLOAD_TIMEOUT: z.coerce.number().default(120000), // 2min

  // OpenSearch
  OPENSEARCH_URL: z.string().default('http://localhost:9200'),
  OPENSEARCH_USERNAME: z.string().default(''),
  OPENSEARCH_PASSWORD: z.string().default(''),
  OPENSEARCH_SSL: z.coerce.boolean().default(false),

  // Security
  CORS_ORIGINS: z.string().optional(),
  SWAGGER_USER: z.string().optional(),
  SWAGGER_PASSWORD: z.string().optional(),
});
```

**Observações Críticas**:
- `JWT_SECRET` exige mínimo de 32 caracteres em produção
- `SWAGGER_USER` e `SWAGGER_PASSWORD` são opcionais - quando não definidos, o Swagger fica desprotegido
- Validação no startup - falha se variáveis obrigatórias ausentes
- OpenSearch está configurado mas não parece ativamente utilizado

### 1.3 Outros Arquivos `.env.example`

**Frontend** (`frontend-boilerplate/.env.development`):
```env
NODE_ENV=development
VITE_API_URL=http://localhost:3333
```

**Next.js API REST** (`nextjs-api-rest/.env.example`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/99freela"
JWT_SECRET="your-secret-key-change-this"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:4001"
PORT=4001
```

**Next.js Boilerplate** (`nextjs-boilerplate/.env.example`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_boilerplate?schema=public"
NEXTAUTH_URL="http://localhost:4001"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
```

### 1.4 Script de Configuração de Ambiente

Localização: `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/scripts/setup-env.sh`

```bash
#!/bin/bash

# Script para configurar variáveis de ambiente
# Uso: ./scripts/setup-env.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Configurando variáveis de ambiente...${NC}"

# Verifica se existe .env na raiz
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado na raiz!${NC}"
    echo -e "${YELLOW}📝 Copie .env.example para .env e configure${NC}"
    exit 1
fi

# Copia .env para backend
if [ -f "backend-boilerplate/.env" ]; then
    cp .env backend-boilerplate/.env.local
    echo -e "${GREEN}✅ .env copiado para backend-boilerplate/.env.local${NC}"
else
    echo -e "${RED}❌ Diretório backend-boilerplate não encontrado${NC}"
fi

# Copia .env para frontend (como .env.local)
if [ -f "frontend-boilerplate/.env" ]; then
    # Extrai apenas variáveis do frontend
    grep "^VITE_" .env > frontend-boilerplate/.env.local 2>/dev/null || true
    echo -e "${GREEN}✅ Variáveis VITE copiadas para frontend-boilerplate/.env.local${NC}"
else
    echo -e "${RED}❌ Diretório frontend-boilerplate não encontrado${NC}"
fi

echo -e "${GREEN}✨ Configuração concluída!${NC}"
```

---

## 2. Docker e docker-compose

### 2.1 Dockerfile do Backend

Localização: `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/Dockerfile`

**Multi-stage build otimizado**:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=3333

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1));"

CMD ["node", "dist/server.js"]
```

**Características**:
- Usa Alpine Linux para imagem leve (~120MB)
- Separação clara entre build e runtime
- Prisma generate executado em ambas as fases (necessário)
- Health check via endpoint `/health`
- Porta exposta 3333

**.dockerignore**:
```
node_modules/
dist/
.env
.env.local
.env.*.local
.vscode/
.idea/
*.log
uploads/
```

### 2.2 Docker Compose

Localização: `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: boilerplate-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: boilerplate
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: boilerplate-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Notas**:
- Foca apenas nos serviços de dados (PostgreSQL + Redis)
- A aplicação backend roda fora do compose, conectando-se aos containers
- Volume persistente para dados de banco e Redis
- Health checks configurados
- PostgreSQL 16, Redis 7

---

## 3. Build Scripts

### 3.1 Backend (package.json)

```json
{
  "name": "backend-boilerplate",
  "scripts": {
    "build": "tsup",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts",
    "service:up": "docker-compose up -d postgres redis",
    "service:down": "docker-compose down",
    "dev:up": "npm run service:up && npm run dev",
    "db:migrate": "npx prisma migrate dev",
    "db:push": "npx prisma db push",
    "db:seed": "npx prisma db seed",
    "db:studio": "npx prisma studio"
  }
}
```

**Ferramentas de build**:
- **tsup**: Bundler TypeScript (builder), output CJS para Node.js
- **tsx**: Runtime TypeScript com hot reload (desenvolvimento)
- Configuração `tsup.config.ts`:
  - Entry: `src/server.ts`
  - Formato: CJS (CommonJS)
  - Sourcemaps: habilitado
  - Target: Node 20

### 3.2 Frontend (Vite)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**Configuração Vite** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4001,
    allowedHosts: ['dashboard-freela.ddw1sl.easypanel.host', '.ddw1sl.easypanel.host'],
  },
})
```

**Observação**: O frontend Vite está configurado para rodar na porta 4001 (conflito com backend), compatível com EasyPanel.

### 3.3 Next.js Projects

**nextjs-api-rest**:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**nextjs-boilerplate**: Similar ao acima.

### 3.4 Monorepo Root

`package.json` principal é metadata-only:
```json
{
  "name": "boilerplate",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

## 4. Deploy no EasyPanel

### 4.1 Conexão MCP EasyPanel

Configurado em `.mcp.json`:

```json
{
  "mcpServers": {
    "mcp-easypanel": {
      "type": "http",
      "url": "https://nommand-mcp-easypanel.ddw1sl.easypanel.host/mcp"
    }
  }
}
```

**URL do Painel**: `https://nommand-mcp-easypanel.ddw1sl.easypanel.host`

### 4.2 Domínios Configurados

Evidência do uso de EasyPanel no `vite.config.ts`:

```typescript
server: {
  host: '0.0.0.0',
  port: 4001,
  allowedHosts: ['dashboard-freela.ddw1sl.easypanel.host', '.ddw1sl.easypanel.host'],
}
```

**Domínio identificado**: `dashboard-freela.ddw1sl.easypanel.host`

### 4.3 Processo de Deploy Recomendado EasyPanel

1. **Backend Fastify**:
   - Service: `backend-boilerplate`
   - Dockerfile: `backend-boilerplate/Dockerfile`
   - Porta: 3333
   - Variáveis: DATABASE_URL, REDIS_URL, JWT_SECRET, etc.

2. **Frontend Vite**:
   - Service: `frontend-boilerplate`
   - Build command: `npm run build`
   - Output dir: `dist`
   - Porta: 5173 (ou configurada 4001)
   - Domínio: app.ddw1sl.easypanel.host

3. **Next.js API**:
   - Service: `nextjs-api-rest`
   - Build command: `npm run build`
   - Porta: 4001

4. **PostgreSQL e Redis**:
   - Pode ser via EasyPanel services ou Docker Compose externo

5. **Volumes**:
   - Uploads: montar volume persistente em `/app/uploads`
   - Arquivos estáticos:渤

---

## 5. Logs e Monitoração

### 5.1 Estrutura de Logs Atual

**Sem framework de logging dedicado**. Logs via `console`:

```typescript
// server.ts start
console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Server is running on ${address}                       ║
║                                                            ║
║   Docs:   ${address}/docs                               ║
║   Queues: ${address}/queues                             ║
║   Health: ${address}/health                             ║
║   ${redisAvailable ? 'Redis: connected' : 'Redis: degraded mode'} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
```

**Error handler** (`src/http/error-handler.ts`):

```typescript
// Development: log completo
if (process.env.NODE_ENV === 'development') {
  console.error('Unhandled error:', error);
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    console.error('Stack:', error.stack);
  }
} else {
  // Production: log mínimo
  console.error(`[${new Date().toISOString()}] Error: ${error.name} - ${error.message}`);
}
```

### 5.2 Logs no Docker

**Estratégia atual**:
- Logs stdout/stderr (Docker capture automática)
- Arquivos `*.log` no .gitignore
- Sem rotação configurada
- Sem ferramenta como Winston/Pino

Logs existentes no projeto:
```
/workspace/.../backend-build.log
/workspace/.../backend-tsc.log
/workspace/.../frontend-build.log
/workspace/.../server.log
```

### 5.3 Monitoração Disponivel

**Health Check** (`src/http/routes/health/health-check.ts`):

```typescript
// endpoint GET /health
// Retorna status 200 se API operacional
```

Usado tanto pelo Docker HEALTHCHECK quanto por load balancers.

**Bull Board**: Visualização de filas em `/queues` (ver seção 6).

**Sem métricas**: Não configurado Prometheus, Grafana ou similar.

---

## 6. Swagger UI e Bull Board

### 6.1 Swagger / OpenAPI

**Plugins Fastify**:
```typescript
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

// Registro
app.register(fastifySwagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Backend Boilerplate API',
      description: 'API documentation for Backend Boilerplate',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
});
```

**Acesso**:
- Local: http://localhost:3333/docs
- OpenAPI JSON: http://localhost:3333/docs/json

**Proteção opcional com Basic Auth**:

```typescript
const swaggerUser = env.SWAGGER_USER;
const swaggerPass = env.SWAGGER_PASSWORD;

if (swaggerUser && swaggerPass) {
  app.register(fastifyBasicAuth, {
    validate: (username, password, req, reply, done) => {
      done({ username, valid: username === swaggerUser && password === swaggerPass });
    },
    ignore: (req) => !req.url.startsWith('/docs'),
  });
} else {
  console.warn('Swagger is not protected - set SWAGGER_USER and SWAGGER_PASSWORD for production');
}
```

**Ameaça**: Sem variáveis SWAGGER_USER/PASS, docs expostas publicamente.

### 6.2 Bull Board (Monitoramento de Filas)

**Setup**:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';

// Em start()
const queuesToMonitor = [
  QUEUE_NAMES.EMAIL,
  QUEUE_NAMES.NOTIFICATION,
  QUEUE_NAMES.PROCESSING,
  QUEUE_NAMES.WEBHOOK,
  QUEUE_NAMES.BACKGROUND,
  QUEUE_NAMES.DEAD_LETTER,
];

const queueAdapters = queuesToMonitor
  .map(name => {
    const queue = getQueue(name);
    return queue ? new BullMQAdapter(queue) : null;
  })
  .filter(Boolean);

if (queueAdapters.length > 0) {
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: queueAdapters as any,
    serverAdapter,
  });
  serverAdapter.setBasePath('/queues');
  app.register(serverAdapter.registerPlugin(), { prefix: '/queues' });
  console.log('Bull Board registered at /queues');
}
```

**Acesso**:
- Local: http://localhost:3333/queues
- Interface web completa: status de jobs, retry, clean, details

**Filas configuradas** (`queue-manager.ts`):

| Nome | Prioridade | Tentativas | Backoff | Observação |
|------|-----------|------------|---------|-----------|
| email-queue | 1 (alta) | 5 | exponential (2s) | emails |
| notification-queue | 2 | 3 | exponential (1s) | notificações |
| processing-queue | 3 | 3 | fixed (5s) | processamento |
| webhook-queue | 2 | 2 | fixed (3s) | webhooks |
| background-queue | 5 (baixa) | 2 | exponential (5s) | bg jobs |
| dead-letter-queue | - | 1 | - | DLQ (sem purge) |

---

## 7. Domínios e Portas

### 7.1 Portas de Desenvolvimento

| Serviço | Porta | URL Local |
|---------|-------|-----------|
| Backend Fastify | 3333 | http://localhost:3333 |
| Frontend Vite | 4001 (config) / 5173 (padrão) | http://localhost:4001 |
| Next.js API REST | 4001 (conflito!) | http://localhost:4001 |
| Next.js Boilerplate | - | - |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prisma Studio | 5555 | http://localhost:5555 |

**Problema identificado**: Frontend Vite e Next.js API REST configurados para mesma porta 4001.

### 7.2 Domínios EasyPanel

Evidências encontradas:
- `dashboard-freela.ddw1sl.easypanel.host` (domínio principal)
- `ddw1sl.easypanel.host` (wildcard)
- `.ddw1sl.easypanel.host` (allowedHosts)

**Configuração allowedHosts no Vite**:
```typescript
allowedHosts: ['dashboard-freela.ddw1sl.easypanel.host', '.ddw1sl.easypanel.host']
```

### 7.3 URLs de Produção Esperadas

| Serviço | Rota | Descrição |
|---------|------|-----------|
| API Backend | https://api.dominio.com | Fastify API |
| Frontend | https://app.dominio.com | React + Vite |
| Next.js API | https://next-api.dominio.com | Next.js App Router |
| API Docs | https://api.dominio.com/docs | Swagger UI |
| Bull Board | https://api.dominio.com/queues | Queue monitor |
| Health | https://api.dominio.com/health | Health check |

---

## 8. Integrações Externas Configuradas

### 8.1 Serviços de Dados

| Serviço | Versão | Cliente | Uso |
|---------|--------|---------|-----|
| PostgreSQL | 16-alpine | Prisma ORM | Banco principal |
| Redis | 7-alpine | ioredis + bullmq | Cache + Filas |

**Redis Connection Config** (`services/jobs/connection-redis-config.ts`):

```typescript
export const connectionRedisConfigQueue = {
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4, // Force IPv4
};

export const connectionRedisConfigWorker = {
  maxRetriesPerRequest: null, // Required by BullMQ
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4,
  connectTimeout: 10000,
};
```

### 8.2 OpenSearch

Configurado em `env.ts` mas **não utilizado ativamente** no código.

Dependencies encontradas:
- `@elastic/elasticsearch: ^9.3.4`
- `@opensearch-project/opensearch: ^3.5.1`

Variáveis:
```env
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USERNAME=
OPENSEARCH_PASSWORD=
OPENSEARCH_SSL=false
```

**Observação**: Serviço de search/indexing mencionado em estrutura mas não conectado.

### 8.3 Socket.IO

```typescript
import { setupSocketIO } from './socket';

// Em server.ts
setupSocketIO(app);
```

Configurado mas detalhes implementation em `src/socket/`.

### 8.4 SMTP (apenas Next.js Boilerplate)

Variáveis configuráveis no `.env.example` do Next.js:
```env
SMTP_HOST=
SMTP_PORT="587"
SMTP_USER=
SMTP_PASSWORD=
```

---

## 9. Segurança de Deploy

### 9.1 Headers de Segurança

```typescript
app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  dnsPrefetchControl: { allow: false },
});
```

### 9.2 Rate Limiting

```typescript
app.register(fastifyRateLimit, {
  max: 100, // 100 requests per window
  timeWindow: '1 minute',
  redis: redisAvailable ? app.redis : undefined, // com Redis
  keyGenerator: (request) => request.ip,
});
```

### 9.3 CORS

```typescript
const allowedOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map(o => o.trim())
  : env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://localhost:4000'];

app.register(fastifyCors, {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});
```

**Modo produção**: Se `CORS_ORIGINS` não definido, array vazio bloqueia tudo.

### 9.4 Uploads

```typescript
app.register(fastifyMultipart, {
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 5,
    fields: 50,
  },
});

const uploadDir = env.UPLOAD_DIR
  ? path.resolve(env.UPLOAD_DIR)
  : path.resolve('./uploads');

app.register(fastifyStatic, {
  root: uploadDir,
  prefix: '/uploads/',
  decorateReply: false,
});
```

---

## 10. Gap Analysis e Recomendações

### 10.1 Problemas Identificados

1. **Conflito de portas**: Frontend Vite e Next.js API na mesma porta (4001)
2. **Swagger desprotegido por padrão**: Requer configuração manual de SWAGGER_USER/PASS
3. **Falta logging estruturado**: Uso de console apenas, sem Pino/Winston
4. **Rotação de logs**: Não configurada para Docker
5. **OpenSearch ocioso**: Dependências incluídas sem uso
6. **Porta backend .env.example errada**: Em `.env.example` (4000) vs config (3333)
7. **Uploads no container**: Volume sugerido no Dockerfile mas não mountado

### 10.2 Recomendações Deploy EasyPanel

**Backend Fastify**:
```yaml
# Service config
- Build: Dockerfile em raiz do backend
- Port: 3333 → External: 80/443 (via proxy)
- Env: JWT_SECRET, DATABASE_URL, REDIS_URL, CORS_ORIGINS, SWAGGER_USER, SWAGGER_PASSWORD
- Volumes: /app/uploads (persistente)
```

**Frontend**:
```yaml
- Build command: npm ci && npm run build
- Output: dist/
- Env: VITE_API_URL (apontar para API)
```

**Proxy/Traefik**:
- Rotear dominios diferentes para Serviços diferentes
- HTTPS automático via Let's Encrypt

### 10.3 Monitoração Recomendada

1. **Logging**: Adicionar Pino + pino-pretty para dev
2. **Métricas**: Health endpoints existentes, adicionar /metrics (Prometheus)
3. **Alertas**: Monitorar filas Bull Board (thresholds de jobs)
4. **APM**: Considerar Sentry ou similar para erros
5. **Redis**: monitorar memory usage via INFO

---

## Conclusão

O projeto apresenta **boa arquitetura de deployment** com:
- Docker multi-stage otimizado
- Compose para serviços de dados
- Validação de ambiente com Zod
- Configuração clara de filas e endpoints de monitoração

Pontos de atenção para produção:
- Configurar SWAGGER_USER/PASS ou remover端点/docs
- Ajustar conflitos de porta
- Estruturar logging profissional
- Definir domínios e proxy no EasyPanel

---

**Arquivos analisados**:
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/.env.example`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/Dockerfile`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/docker-compose.yml`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/lib/env.ts`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/server.ts`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/package.json`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/scripts/setup-env.sh`
- `/workspace/temp-oruestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/vite.config.ts`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/.mcp.json`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/services/jobs/queue/queue-manager.ts`
- `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/nextjs-api-rest/src/app/api/docs/route.ts`
