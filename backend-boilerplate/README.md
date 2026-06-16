# Backend Boilerplate

Backend boilerplate com Fastify, Prisma, Redis, BullMQ e Socket.IO.

## Stack

- **Framework**: Fastify v5
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Cache/Filas**: Redis + BullMQ
- **Validação**: Zod
- **Auth**: JWT + bcryptjs
- **Real-time**: Socket.IO
- **Docs**: Swagger/OpenAPI

## Quick Start

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

### 3. Iniciar serviços (PostgreSQL + Redis)

```bash
npm run service:up
```

### 4. Rodar migrations

```bash
npm run db:migrate
```

### 5. (Opcional) Seed do banco

```bash
npm run db:seed
```

### 6. Iniciar em desenvolvimento

```bash
npm run dev
```

Ou tudo de uma vez:

```bash
npm run dev:up
```

## URLs

| Serviço | URL |
|---------|-----|
| API | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/docs |
| Bull Board | http://localhost:4000/queues |
| Health Check | http://localhost:4000/health |

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Compila para produção |
| `npm run start` | Inicia servidor compilado |
| `npm run service:up` | Sobe containers PostgreSQL e Redis |
| `npm run service:down` | Para containers |
| `npm run db:migrate` | Roda migrations Prisma |
| `npm run db:push` | Push schema para banco (dev) |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run db:studio` | Abre Prisma Studio |

## Estrutura de Pastas

```
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── seed.ts            # Seed de dados
├── src/
│   ├── @types/            # Tipos TypeScript
│   ├── http/
│   │   ├── routes/        # Rotas por módulo
│   │   │   ├── _errors/   # Classes de erro
│   │   │   ├── auth/      # Autenticação
│   │   │   ├── user/      # CRUD usuários
│   │   │   └── health/    # Health check
│   │   └── error-handler.ts
│   ├── lib/
│   │   ├── env.ts         # Variáveis de ambiente
│   │   ├── prisma.ts      # Cliente Prisma
│   │   └── redis/         # Serviços Redis
│   ├── middlewares/       # Middlewares
│   ├── services/
│   │   ├── jobs/          # Filas BullMQ
│   │   └── notification/  # Notificações
│   ├── socket/            # Socket.IO
│   ├── server.ts          # Entry point
│   └── socket.ts          # Setup Socket.IO
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Usuários de Teste (após seed)

| Email | Senha | Role |
|-------|-------|------|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |

## Autenticação

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Usar token

```bash
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Produção

### Build

```bash
npm run build
```

### Docker

```bash
docker-compose up -d
```

## Adicionando Novos Módulos

1. Criar pasta em `src/http/routes/[modulo]/`
2. Criar arquivos de rota seguindo o padrão:
   - `create-[entidade].ts`
   - `list-[entidades].ts`
   - `get-[entidade].ts`
   - `update-[entidade].ts`
   - `delete-[entidade].ts`
3. Registrar rotas em `server.ts`
4. Adicionar model em `prisma/schema.prisma`
5. Rodar `npm run db:migrate`
