# Boilerplate Fullstack

Monorepo fullstack com Backend (Fastify + Prisma + Redis + BullMQ + Socket.IO) e Frontend (React + Vite + TailwindCSS).

## Pre-requisitos

- Node.js 22+
- Docker e Docker Compose

## Setup

### 1. Subir servicos (PostgreSQL + Redis)

```bash
cd backend-boilerplate
docker-compose up -d
```

### 2. Instalar dependencias

```bash
cd backend-boilerplate && npm install
cd ../frontend-boilerplate && npm install
```

### 3. Configurar banco

```bash
cd backend-boilerplate
npx prisma db push
npx prisma db seed
```

### 4. Iniciar desenvolvimento

Backend (porta 4001):
```bash
cd backend-boilerplate
npm run dev
```

Frontend (porta 5173):
```bash
cd frontend-boilerplate
npm run dev
```

## Variaveis de Ambiente

### Backend (`backend-boilerplate/.env`)

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| PORT | 4001 | Porta do servidor |
| DATABASE_URL | postgres://postgres:postgres@localhost:5432/boilerplate | PostgreSQL |
| REDIS_URL | localhost | Host do Redis |
| REDIS_PORT | 6379 | Porta do Redis |
| JWT_SECRET | (obrigatorio) | Segredo para JWT |

### Frontend

Usar `VITE_API_URL` para apontar para o backend. Padrao: `http://localhost:4001`

## Scripts

### Backend

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Desenvolvimento (watch) |
| `npm run build` | Build producao |
| `npm run start` | Iniciar producao |
| `npm run service:up` | Subir PostgreSQL + Redis |
| `npm run service:down` | Parar servicos |
| `npm run db:migrate` | Rodar migrations |
| `npm run db:push` | Push schema |
| `npm run db:seed` | Seed do banco |
| `npm run db:studio` | Prisma Studio |

### Frontend

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build producao |
| `npm run lint` | ESLint |

## Estrutura

```
boilerplate/
├── backend-boilerplate/
│   ├── src/
│   │   ├── http/           # Rotas HTTP (auth, users, health)
│   │   ├── middlewares/    # Auth JWT, Auth Socket
│   │   ├── lib/            # Prisma, Redis, Env
│   │   ├── socket/         # WebSocket (Socket.IO)
│   │   ├── services/       # Jobs (BullMQ), Notifications
│   │   └── server.ts       # Entry point
│   ├── prisma/             # Schema e seeds
│   └── docker-compose.yml  # PostgreSQL + Redis
│
├── frontend-boilerplate/
│   ├── src/
│   │   ├── app/            # App, Routes, Layout
│   │   ├── features/       # Auth, Dashboard
│   │   └── shared/         # Components, Hooks, Utils
│   └── vite.config.ts
```

## Usuarios de Teste

| Email | Senha | Role |
|-------|-------|------|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |

## Endpoints

- API: `http://localhost:4001`
- Docs Swagger: `http://localhost:4001/docs`
- Queues: `http://localhost:4001/queues`
- Health: `http://localhost:4001/health`
- Frontend: `http://localhost:5173`
