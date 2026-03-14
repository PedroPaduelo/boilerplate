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
| `npm run test` | Rodar testes unitarios (Jest + Supertest) |

### Frontend

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build producao |
| `npm run lint` | ESLint |
| `npm run test` | Rodar testes unitarios (Vitest + Testing Library) |
| `npm run test:watch` | Rodar testes em modo watch |

### Raiz (Monorepo)

| Comando | Descricao |
|---------|-----------|
| `npm run test` | Rodar todos os testes (backend + frontend) |
| `npm run test:backend` | Rodar apenas testes do backend |
| `npm run test:frontend` | Rodar apenas testes do frontend |
| `npm run test:performance` | Rodar testes de performance (k6) |

## Testes

### Estrutura de Testes

```
tests/
├── backend/          # Testes do backend (Jest + Supertest)
│   ├── jest.config.js
│   ├── test-helper.ts
│   ├── health.test.ts      # Testa endpoint /health
│   ├── auth.test.ts        # Testa POST /auth/login
│   └── users.test.ts       # Testa GET /users e GET /users/:id
└── frontend/         # Testes do frontend (Vitest + React Testing Library)
    ├── setup.ts
    ├── App.test.tsx
    ├── LoginForm.test.tsx
    └── Dashboard.test.tsx
```

### Backend (Jest + Supertest)

- **Health Tests**: Verifica se o endpoint `/health` retorna status 200 com `{status: 'ok'}`
- **Auth Tests**: Testa autenticacao via JWT, validacao de credenciais
- **Users Tests**: Testa listagem e busca de usuarios com autenticacao

### Frontend (Vitest + React Testing Library)

- **App.test.tsx**: Testa renderizacao do componente App
- **LoginForm.test.tsx**: Testa formulario de login (validacao, submit)
- **Dashboard.test.tsx**: Testa renderizacao do dashboard com dados mockados
- **@testing-library/jest-dom**: Matchers adicionais para assertions

### Executar Testes

```bash
# Todos os testes
npm run test

# Apenas backend
npm run test:backend

# Apenas frontend
npm run test:frontend

# Backend (na pasta backend-boilerplate)
cd backend-boilerplate && npm test

# Frontend (na pasta frontend-boilerplate)
cd frontend-boilerplate && npm test

# Frontend em watch mode
cd frontend-boilerplate && npm run test:watch
```

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
