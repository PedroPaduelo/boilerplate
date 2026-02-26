# 01-analise.md - Análise de Requisitos e Arquitetura (Revisada)

## 1. Triagem do Projeto

| Atributo | Valor |
|----------|-------|
| **Tipo** | Fullstack Monorepo (Backend + Frontend) |
| **Prioridade** | P1 (Boilerplate/template para novos projetos) |
| **Complexidade** | M (Projeto robusto com múltiplas tecnologias) |
| **Status** | Build OK, mas serviços externos offline |

---

## 2. Estrutura do Projeto

```
boilerplate/
├── backend-boilerplate/      # API REST + WebSocket
│   ├── src/
│   │   ├── http/             # Rotas HTTP
│   │   ├── middlewares/      # Auth, Auth-Socket
│   │   ├── lib/              # Prisma, Redis, Env
│   │   ├── socket/           # WebSocket (rooms, events)
│   │   ├── services/         # Jobs (BullMQ), Notifications
│   │   └── server.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma     # Modelo User
│   └── package.json
│
├── frontend-boilerplate/     # SPA React
│   ├── src/
│   │   ├── app/              # App, Routes, Layout
│   │   ├── features/         # Auth, Dashboard
│   │   └── shared/           # Components, Hooks, Utils
│   ├── package.json
│   └── vite.config.ts
│
└── 01-analise.md
```

---

## 3. Stack Tecnológico

### Backend
- **Runtime**: Node.js 22 + TypeScript
- **Framework**: Fastify 5.x
- **ORM**: Prisma 6.x (PostgreSQL)
- **Cache/Sessions**: Redis (ioredis)
- **Filas**: BullMQ
- **WebSocket**: Socket.IO
- **Autenticação**: JWT (@fastify/jwt) + bcryptjs

### Frontend
- **Framework**: React 19 + Vite 7
- **Estado**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **UI**: Radix UI + TailwindCSS

---

## 4. Teste de Inicialização

### Backend
- **Build**: ✅ OK (`npx tsup` - sucesso)
- **Inicialização**: ❌ FALHA
  - Motivo: Redis externo offline (cloud.nommand.com:6389)
  - O servidor não inicia porque o plugin `@fastify/redis` tenta conectar e falha
  - O BullMQ Worker também tenta conectar ao Redis e falha

### Frontend
- **Build**: ✅ OK (`npx vite build` - sucesso)
- **Inicialização**: ⚠️ Pendente (depende do backend)
- **Issue**: `VITE_API_URL` aponta para porta 8181, mas backend está na 4500

### Banco de Dados
- **PostgreSQL**: ❌ Offline (cloud.nommand.com:54369)
  - Erro: `P1001: Can't reach database server`

---

## 5. Problemas Identificados

| # | Problema | Severidade | Componente |
|---|----------|------------|------------|
| 1 | PostgreSQL offline | Crítica | Backend |
| 2 | Redis offline | Crítica | Backend |
| 3 | API URL incorreta no frontend | Alta | Frontend |
| 4 | Falta tratamento de graceful degradation quando Redis indisponível | Média | Backend |
| 5 | Worker BullMQ inicia automaticamente mesmo sem Redis | Média | Backend |

---

## 6. Tasks para Resolução

### Task 1: Configurar Serviços Externos (CRÍTICA)
- **Descrição**: Disponibilizar PostgreSQL e Redis acessíveis
- **Opções**:
  - Usar Docker Compose local (melhor para desenvolvimento)
  - Usar serviços cloud disponíveis
- **Arquivo relevante**: `backend-boilerplate/.env`

### Task 2: Corrigir API URL no Frontend
- **Descrição**: Alterar `VITE_API_URL` de `http://localhost:8181` para `http://localhost:4500`
- **Arquivo**: `frontend-boilerplate/src/shared/lib/api-client.ts`
- **Valor atual**: `http://localhost:8181`
- **Valor esperado**: `http://localhost:4500`

### Task 3: Adicionar Graceful Degradation para Redis
- **Descrição**: O servidor deve iniciar mesmo se Redis não estiver disponível
- **Arquivos**:
  - `backend-boilerplate/src/server.ts` - tratar falha do plugin
  - `backend-boilerplate/src/services/jobs/worker/example-worker.ts` - não iniciar automaticamente

### Task 4: Testar Integração Backend + Frontend
- **Descrição**: Após resolver tasks 1-3, testar fluxo completo
- **Passos**:
  1. Iniciar backend
  2. Testar `/health`
  3. Testar autenticação
  4. Iniciar frontend
  5. Testar login

---

## 7. Scripts Disponíveis

### Backend
```bash
npm run dev          # Desenvolvimento (watch mode)
npm run build        # Build production
npm run start        # Start production
npm run db:migrate   # Migration Prisma
npm run db:studio    # Prisma Studio
```

### Frontend
```bash
npm run dev    # Desenvolvimento
npm run build  # Build production
npm run lint   # ESLint
```

---

## 8. Conclusão

O projeto é um **boilerplate bem estruturado** com código de qualidade. O problema atual é apenas a **indisponibilidade dos serviços externos** (PostgreSQL e Redis). Com os serviços disponíveis, o projeto deve funcionar corretamente.

**Próximos passos recomendados**:
1. Configurar Docker Compose para serviços locais OU verificar disponibilidade dos serviços cloud
2. Ajustar API URL no frontend
3. Testar integração
