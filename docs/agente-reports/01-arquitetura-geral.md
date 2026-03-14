# Arquitetura Geral do Projeto Boilerplate

## Visao Geral

Este projeto e um **monorepo fullstack** que compreende um backend robusto e um frontend moderno, projetado para servir como base para aplicacoes web de medio porte.

### Estrutura do Monorepo

```
boilerplate/
├── backend-boilerplate/    # API REST com Fastify (porta 4001)
├── frontend-boilerplate/   # SPA com React + Vite (porta 5173)
├── packages/               # Pacotes compartilhados
├── nextjs-boilerplate/     # Alternate frontend (Next.js)
├── nextjs-api-rest/        # Alternate backend (Next.js API Routes)
├── docs/                   # Documentacao
└── scripts/                # Scripts utilitarios
```

---

## Diagrama das Camadas (Backend)

```
+------------------------------------------------------------------+
|                        ENTRADA (Entry Point)                     |
|                         server.ts (Fastify)                       |
+------------------------------------------------------------------+
                                    |
                    +---------------+---------------+
                    |               |               |
            +-------v-----+  +------v-----+  +------v------+
            |   HTTP      |  |   Socket   |  |  Background  |
            |   Routes    |  |    (IO)    |  |    Jobs     |
            +------+------+  +------+-----+  +------+------+
                   |                  |                |
            +------v------+    +------v------+   +-----v------+
            |  Middlewares |    |   Services  |   |  BullMQ    |
            |  - Auth JWT  |    |  - Search   |   |  Workers   |
            |  - Auth Socket|    |  - Notification|          |
            +------+------+    +------+------+   +------------+
                   |                  |
            +------v------+    +------+------+
            |     Lib      |    |    Prisma   |
            |  - Prisma    |    |    (ORM)    |
            |  - Redis     |    +-------------+
            |  - Env       |
            |  - Search    |
            +--------------+
```

---

## Tecnologias e Proposito

### Backend

| Tecnologia | Proposito |
|------------|-----------|
| **Fastify** | Framework HTTP de alta performance |
| **Prisma** | ORM para interacao com PostgreSQL |
| **PostgreSQL** | Banco de dados relacional principal |
| **Redis** | Cache, filas e dados temporarios |
| **BullMQ** | Gerenciamento de filas e jobs assincronos |
| **Socket.IO** | Comunicacao em tempo real (WebSockets) |
| **Elasticsearch/OpenSearch** | Motor de busca textual e geoespacial |
| **Zod** | Validacao de schemas e tipagem runtime |
| **JWT** | Autenticacao stateless |
| **Swagger/OpenAPI** | Documentacao automatica da API |
| **tsup** | Build e bundle para producao |

### Frontend

| Tecnologia | Proposito |
|------------|-----------|
| **React 19** | Biblioteca de interface de usuario |
| **Vite** | Build tool moderno e rapido |
| **TailwindCSS** | Framework CSS utility-first |
| **Radix UI** | Componentes acessiveis (headless) |
| **React Router** | Roteamento de paginas |
| **TanStack Query** | Gerenciamento de estado servidor (data fetching) |
| **Zustand** | Gerenciamento de estado global (client state) |
| **Zod** | Validacao de formularios |
| **React Hook Form** | Gerenciamento de formularios |
| **Socket.IO Client** | Comunicacao em tempo real |
| **Recharts** | Biblioteca de graficos |
| **Framer Motion** | Animacoes declarativas |
| **TipTap** | Editor de texto rico |

### Infraestrutura

| Servico | Porta | Descricao |
|---------|-------|-----------|
| PostgreSQL | 5432 | Banco de dados |
| Redis | 6379 | Cache e filas |
| Backend | 4001 | API REST + Socket.IO |
| Frontend | 5173 | SPA development |

---

## Padroes Arquiteturais

### Backend: Modular com Divisao de Responsabilidades

O backend segue uma arquitetura **modular** baseada em pastas por responsabilidade:

```
src/
├── http/
│   ├── routes/          # Definição de rotas e handlers
│   │   ├── auth/        # Rotas de autenticacao
│   │   ├── user/       # Rotas de usuarios
│   │   ├── search/     # Rotas de busca
│   │   ├── queue/     # Rotas de gerenciamento de filas
│   │   ├── health/    # Health checks
│   │   └── _errors/   # Classes de erro customizadas
│   └── error-handler.ts  # Tratamento centralizado de erros
│
├── middlewares/         # Middlewares (JWT auth, Socket auth)
├── lib/                 # Bibliotecas de infraestrutura
│   ├── prisma.ts       # Instancia do Prisma Client
│   ├── env.ts          # Validacao de variaveis de ambiente
│   ├── redis/          # Cliente Redis singleton
│   └── search/         # Cliente Elasticsearch/OpenSearch
│
├── services/           # Logica de negocio
│   ├── jobs/          # Filas BullMQ
│   │   ├── queue/    # Definicao de filas
│   │   ├── worker/  # Processadores de jobs
│   │   └── scheduler/ # Agendamento de jobs
│   └── notification/ # Servico de notificacoes
│
└── socket/             # WebSocket
    ├── manager/       # Gerenciador de conexoes
    └── events/        # Handlers de eventos
```

### Frontend: Feature-Sliced Design Simplificado

O frontend segue um padrao de **organizacao por feature**:

```
src/
├── app/                    # Configuracao principal
│   ├── App.tsx            # Componente raiz
│   ├── routes.tsx         # Definicao de rotas
│   └── app-layout.tsx     # Layout principal
│
├── features/              # Funcionalidades (bounded contexts)
│   ├── auth/             # Autenticacao
│   │   ├── api.ts        # Chamadas API
│   │   ├── store.ts      # Zustand store
│   │   ├── hooks/        # Hooks customizados
│   │   ├── components/  # Componentes especificos
│   │   └── types.ts      # Tipos TypeScript
│   ├── dashboard/        # Dashboard
│   └── search/          # Busca
│
└── shared/               # Codigo compartilhado
    ├── components/      # Componentes reutilizaveis
    │   ├── ui/          # Componentes base (Radix UI)
    │   ├── layout/      # Layout components
    │   └── editor/      # Componentes de editor
    ├── hooks/           # Hooks genericos
    ├── lib/             # Utilitarios
    │   ├── api-client.ts  # Axios instance com interceptors
    │   └── utils.ts     # Funcoes helper
    └── types/           # Tipos globais
```

---

## Divisao de Responsabilidades

### Backend

| Camada | Responsabilidade |
|--------|-----------------|
| **Routes** | Definir endpoints HTTP, validar input com Zod, delegar para services |
| **Middlewares** | Autenticacao, autorizacao, preprocessamento de requests |
| **Services** | Logica de negocio pura, orquestacao de operacoes |
| **Lib** | Infraestrutura (DB, Cache, Config) |
| **Socket** | Gerenciar conexoes temps real e eventos |

### Frontend

| Camada | Responsabilidade |
|--------|-----------------|
| **Features** | Funcionalidades completas (UI + estado + API) |
| **Shared/UI** | Componentes visuais genericos |
| **Shared/hooks** | Logica reutilizavel |
| **Shared/lib** | Axios client, utilitarios |

---

## Comunicacao Frontend <-> Backend

### 1. HTTP/REST (Axios)

O frontend utiliza **Axios** com interceptors para comunicacao:

```typescript
// api-client.ts
export const apiClient = axios.create({
  baseURL: API_URL,
})

// Interceptor de request - adiciona token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de response - trata 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 2. WebSocket (Socket.IO)

Para comunicacao em tempo real:

```typescript
// Frontend
import { io } from 'socket.io-client'

const socket = io(API_URL, {
  auth: { token: localStorage.getItem('token') }
})

socket.on('connect', () => {
  console.log('Connected:', socket.id)
})

// Backend (server.ts)
import { Server } from 'socket.io'
const io = new Server(app.server, { cors: {...} })

io.on('connection', (socket) => {
  socketManager.addSocket(socket)
  registerJoinRoom(socket)
  registerLeaveRoom(socket)
  registerDisconnect(socket)
})
```

### 3. Filas (BullMQ -> Frontend via Socket)

O backend processa tarefas pesadas em background:

```typescript
// Adicionar job na fila
await addJob(QUEUE_NAMES.EMAIL, {
  name: 'send-welcome',
  data: { userId: user.id, email: user.email }
})

// Worker processa o job
worker.on('completed', (job) => {
  // Notifica cliente via Socket.IO
  io.to(userId).emit('job-completed', { jobId: job.id })
})
```

---

## Fluxo de Inicializacao do Sistema

### 1. Servicos de Infraestrutura (Docker)

```bash
docker-compose up -d
# PostgreSQL (porta 5432)
# Redis (porta 6379)
```

### 2. Backend (Fastify)

```
server.ts::start()
    |
    +-> isRedisAvailable()  # Verifica conexao Redis
    |
    +-> fastify()           # Cria instancia Fastify
    |
    +-> Registra plugins:
    |   - fastifyHelmet     # Headers de seguranca
    |   - fastifyRateLimit # Rate limiting
    |   - fastifyCors      # CORS configuravel
    |   - fastifyMultipart # Upload de arquivos
    |   - fastifyStatic    # Arquivos estaticos
    |   - fastifySwagger   # Documentacao
    |   - fastifyJwt       # Autenticacao JWT
    |   - fastifyRedis     # Cliente Redis
    |
    +-> Registra rotas:
    |   - /health, /auth/*, /users/*, /search/*, /queue/*
    |
    +-> setupSocketIO()    # Configura WebSocket
    |
    +-> startAllWorkers()  # Inicia workers BullMQ
    |
    +-> app.listen()       # Escuta na porta configurada
```

### 3. Frontend (Vite)

```
vite.config.ts
    |
    +-> defineConfig()
        - react()           # Plugin React
        - alias @ -> ./src # Path aliasing
        - server config    # host, porta

main.tsx
    |
    +-> ReactDOM.createRoot()
        |
        +-> App()
            |
            +-> QueryClientProvider (TanStack Query)
                |
                +-> RouterProvider
                    |
                    +-> Router (React Router)
                        |
                        +-> Routes:
                            - /login, /register
                            - / (Protected) -> AppLayout
                                - /dashboard (lazy)
```

### 4. Fluxo de uma Requisicao HTTP

```
[Frontend]
    |
    apiClient.get('/users')
        |
        | 1. Interceptor adiciona Bearer token
        |
[Backend: Fastify]
    |
    server.ts -> app.register(userRoutes)
        |
        | 2. Rate limiting verificado
        |
        | 3. CORS validado
        |
        | 4. Middleware auth verifica JWT
        |
        | 5. Route handler executado
        | create-user.ts -> async (request, reply) => {
        |     |
        |     +-> request.body validado com Zod schema
        |     |
        |     +-> prisma.user.findUnique() [DB]
        |     |
        |     +-> bcrypt.hash() [CPU]
        |     |
        |     +-> prisma.user.create() [DB]
        |     |
        |     +-> return reply.status(201).send(user)
        | }
        |
        | 6. Error handler captura excecoes
        |
[Frontend]
    |
    7. Interceptor verifica status 401 -> redirect /login
```

---

## Configuracoes Principais

### Backend (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "node16",
    "lib": ["es2023"],
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Backend (tsup.config.ts)

Build com tsup para producao - gera bundle otimizado.

### Frontend (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { host: '0.0.0.0', port: 4001 }
})
```

### Frontend (tsconfig)

TypeScript com path aliases e integracao React 19.

---

## Observacoes sobre Qualidade Arquitetural

### Pontos Fortes

1. **Validacao rigorosa**: Zod em todas as camadas (backend input validation, frontend form validation, env validation)

2. **Seguranca em profundidade**:
   - Helmet headers
   - Rate limiting
   - CORS restritivo
   - JWT com expiracao
   - Password hashing com bcrypt

3. **Tratamento de erros centralizado**: Error handler unificado no backend

4. **Resiliencia**: Modo degradado quando Redis nao disponivel

5. **Documentacao automatica**: Swagger/OpenAPI disponivel em `/docs`

6. **Codigo tipado end-to-end**: TypeScript em todo o projeto

7. **Composicao de funcionalidades**: Frontend organizado por features com lazy loading

8. **Jobs assincronos**: BullMQ com filas separadas por prioridade

9. **Busca avancada**: OpenSearch/Elasticsearch com suporte a fuzzy search, geolocalizacao e autocomplete

### Pontos de Atencao

1. **Monorepo real**: Nao ha configuracao de workspace (npm/yarn/pnpm), cada projeto tem seus proprios node_modules

2. **Estado global**: Frontend usa Zustand com persistencia local - adequado mas pode crescer

3. **Sem testes**: Nao ha configuracao de testes visivel (Jest, Vitest, Playwright - apenas instalado no frontend)

4. **Sem migrations ativas**: Prisma schema existe mas nao ha historico de migrations

5. **Cache**: Redis integrado mas uso de cache nao esta evidente no codigo

6. **Arquivos estaticos**: Servidos localmente, sem CDN configurado

---

## Arquivo: Estrutura Completa

### Backend (36 arquivos TypeScript)

```
backend-boilerplate/src/
├── server.ts                          # Entry point
├── socket.ts                          # Socket.IO setup
├── http/
│   ├── error-handler.ts              # Tratamento de erros
│   └── routes/
│       ├── _errors/                  # Custom errors
│       │   ├── bad-request-error.ts
│       │   ├── unauthorized-error.ts
│       │   ├── not-found-error.ts
│       │   ├── forbidden-error.ts
│       │   └── index.ts
│       ├── auth/
│       │   ├── authenticate.ts
│       │   └── get-me.ts
│       ├── user/
│       │   ├── create-user.ts
│       │   ├── list-users.ts
│       │   ├── get-user.ts
│       │   ├── update-user.ts
│       │   └── delete-user.ts
│       ├── search/
│       │   ├── search.ts
│       │   ├── geo-search.ts
│       │   ├── autocomplete.ts
│       │   ├── analytics.ts
│       │   ├── admin-index.ts
│       │   ├── bulk-index.ts
│       │   ├── delete-document.ts
│       │   └── index.ts
│       ├── health/
│       │   └── health-check.ts
│       └── queue/
│           └── queue-routes.ts
├── middlewares/
│   ├── auth.ts                       # JWT auth plugin
│   ├── auth-socket.ts                # Socket auth
│   └── index.ts
├── lib/
│   ├── prisma.ts                     # Prisma client
│   ├── env.ts                        # Env validation
│   ├── redis/
│   │   ├── redis-instance.ts        # Singleton
│   │   ├── redis-service.ts
│   │   └── index.ts
│   └── search/
│       ├── config.ts
│       ├── query-service.ts
│       ├── indexing-service.ts
│       └── index.ts
├── services/
│   ├── jobs/
│   │   ├── connection-redis-config.ts
│   │   ├── scheduler/
│   │   │   └── scheduler-manager.ts
│   │   ├── queue/
│   │   │   ├── queue-manager.ts
│   │   │   └── example-queue.ts
│   │   └── worker/
│   │       ├── worker-manager.ts
│   │       └── example-worker.ts
│   └── notification/
│       └── notification-service.ts
└── socket/
    ├── manager/
    │   └── socket-manager.ts
    ├── events/
    │   ├── join-room.ts
    │   └── leave-room.ts
    └── disconnect.ts
```

### Frontend (50 arquivos TypeScript/TSX)

```
frontend-boilerplate/src/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes.tsx
│   └── app-layout.tsx
├── features/
│   ├── auth/
│   │   ├── api.ts
│   │   ├── store.ts
│   │   ├── types.ts
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   ├── components/
│   │   │   ├── protected-route.tsx
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── dashboard/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.tsx
│   └── search/
│       ├── api.ts
│       ├── types.ts
│       ├── hooks/
│       ├── components/
│       └── index.tsx
└── shared/
    ├── components/
    │   ├── ui/
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── card.tsx
    │   │   ├── select.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── avatar.tsx
    │   │   ├── switch.tsx
    │   │   ├── label.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   └── sonner.tsx
    │   ├── layout/
    │   │   ├── header.tsx
    │   │   ├── sidebar.tsx
    │   │   └── index.ts
    │   └── editor/
    │       └── rich-text-editor.tsx
    ├── hooks/
    │   ├── use-debounce.ts
    │   └── use-local-storage.ts
    ├── lib/
    │   ├── api-client.ts
    │   ├── utils.ts
    │   └── constants.ts
    └── types/
        └── common.ts
```

---

## Conclusao

Este boilerplate representa uma **arquitetura madura** para aplicacoes fullstack, combinando:

- Backend de alta performance com Fastify
- Frontend moderno com React 19 e Vite
- Comunicacao em tempo real com Socket.IO
- Processamento assincrono com BullMQ
- Busca avancada com OpenSearch
- Seguranca robusta com JWT, Helmet, Rate Limiting

A estrutura e bem organizada e escalavel, seguindo padroes reconhecidos na industria (feature-based no frontend, modular no backend).
