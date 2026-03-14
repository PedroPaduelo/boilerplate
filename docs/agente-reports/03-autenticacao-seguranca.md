# Relatório de Segurança e Autenticação
*Boilerplate Backend/Frontend - Análise Completa*

---

## Sumário Executivo

Este relatório documenta a análise detalhada do fluxo de autenticação, autorização e segurança do sistema boilerplate, baseado em **Fastify + Prisma + React/Vite + Zustand**. O sistema utiliza **JWT stateless** como estratégia principal de autenticação.

**Data da análise:** 14/03/2026
**Versão do projeto:** 1.0.0

---

## 1. Estratégia de Autenticação

### 1.1 Tipo de Autenticação
- **Estratégia:** JWT (JSON Web Tokens) stateless
- **Bibliotecas:** `@fastify/jwt`, `jsonwebtoken`
- **Algoritmo:** HS256 (padrão Fastify JWT)

### 1.2 Fluxo de Login

```
┌──────────┐     POST /auth/login      ┌────────────┐
│ Frontend │ ────────────────────────> │   Backend  │
│ (React)  │   {email, password}       │  (Fastify) │
└──────────┘                           └─────┬──────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      │                    │                    │
                      ▼                    ▼                    ▼
           ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
           │ Find user by    │ │ bcrypt.compare() │ │  Check isActive  │
           │ email           │ │  (password)      │ │  flag            │
           │ (Prisma)        │ └────────┬─────────┘ └────────┬─────────┘
           └────────┬────────┘          │                      │
                    │                  │ (valid)               │ (active)
                    │                  ▼                       ▼
                    └─────────────────┼───────────────────────┘
                                      │
                            ┌─────────▼─────────┐
                            │ jwtSign()         │
                            │ { sub: userId }   │
                            │ expiresIn: '1h'   │
                            └─────────┬─────────┘
                                      │
                                      ▼
                  ┌─────────────────────────────────────┐
                  │  { token, user: { id, name, email } }
                  └─────────────────────────────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────────┐
                   │ localStorage.setItem('token', token)   │
                   │ setAuth(user, token)                   │
                   │ Redirect → /dashboard                  │
                   └─────────────────────────────────────────┘
```

### 1.3 Token Payload

```javascript
// Payload JWT:
{
  "sub": "<userId>",        // Subject - ID do usuário no banco
  "iat": <timestamp>,       // Issued At
  "exp": <timestamp>        // Expires (1 hora)
}

// NÃO contém role no token atualmente
```

---

## 2. Armazenamento de Senhas

### 2.1 Biblioteca
- **Biblioteca:** `bcryptjs` (v2.4.3)
- **Custo:** 10 rounds
- **Salt automático:** Sim (bcrypt gera salt automaticamente)

### 2.2 Implementação

**Backend (`/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/http/routes/user/create-user.ts`)**:
```typescript
const passwordHash = await hash(password, 10);
```

**Verificação de login (`authenticate.ts`)**:
```typescript
const isPasswordValid = await compare(password, user.password);
```

### 2.3 Avaliação
- ✅ Bcrypt é resistente a rainbow tables
- ⚠️ 10 rounds é o mínimo aceitável, mas poderia ser 12 para maior segurança
- ✅ Salt automático por senha

---

## 3. Fluxo Completo de Autenticação

### 3.1 Login
1. Frontend envia POST `/auth/login` com email e senha
2. Backend busca usuário por email no banco
3. Verifica se usuário existe e está `isActive = true`
4. Compara senha com bcrypt
5. Atualiza `lastLoginAt`
6. Gera JWT válido por 1 hora
7. Retorna token e dados básicos do usuário

### 3.2 Autenticação em Rotas Protegidas

```
Request with header: Authorization: Bearer <jwt>
         │
         ▼
┌─────────────────────────────┐
│ Middleware `auth`           │
│ (preHandler hook)           │
├─────────────────────────────┤
│ 1. request.jwtVerify()      │
│ 2. Armazena getCurrentUserId│
│    e getCurrentUserRole     │
└─────────────┬───────────────┘
              │
              ▼
        Route Handler
        (userId disponível via
         request.getCurrentUserId())
```

### 3.3 Logout
- **Frontend:** Remove token do localStorage e limpa estado Zustand
- **Backend:** NÃO há endpoint de logout (stateless por design)
- ⚠️ Tokens permanecem válidos até expiração (1 hora)

### 3.4 Refresh Token
- ❌ **NÃO IMPLEMENTADO**
- Usuários precisam fazer login novamente após 1 hora
- Recomendação: Implementar refresh tokens com blacklist

---

## 4. Middlewares de Autenticação e Autorização

### 4.1 Middleware `auth` (Backend HTTP)

**Arquivo:** `/backend-boilerplate/src/middlewares/auth.ts`

```typescript
export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        return sub;
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
    };

    request.getCurrentUserRole = async () => {
      try {
        const decoded = await request.jwtVerify<{ sub: string; role?: string }>();
        return decoded.role || 'USER';  // Default role
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
    };
  });
});
```

**Uso:**
```typescript
app.register(auth)  // Registra o plugin
  .get('/protected-route', handler)  // Requer autenticação
```

### 4.2 Middleware `authenticate` (Socket.IO)

**Arquivo:** `/backend-boilerplate/src/middlewares/auth-socket.ts`

```typescript
export async function authenticate(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    (socket as any).user_id = decoded.sub;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}
```

**Uso:** `io.use(authenticate)` - aplicado globalmente a todas as conexões Socket.IO

### 4.3 Handlers `fastify.authenticate`
- Usado internamente pelo Fastify JWT: `preHandler: [fastify.authenticate]`
- Especialmente em rotas de filas BullMQ

---

## 5. Sistema de Roles e Permissões

### 5.1 Definição de Roles

**Prisma Schema:**
```prisma
enum UserRole {
  ADMIN
  USER
}
```

### 5.2 Matriz de Permissões por Role

| Endpoint | Método | Role Necessária | Middleware | Observações |
|----------|--------|----------------|------------|-------------|
| `/auth/login` | POST | Public | - | Credenciais válidas |
| `/auth/register` | * | - | - | **NÃO IMPLEMENTADO** |
| `/auth/me` | GET | Autenticado | `auth` | Retorna próprio usuário |
| `/users` | GET | Autenticado | `auth` | Lista todos (filtros opcionais) |
| `/users/:id` | GET | Autenticado | `auth` | Busca por ID |
| `/users` | POST | Autenticado | `auth` | Criar usuário (qualquer autenticado) |
| `/users/:id` | PUT | Autenticado | `auth` | Atualizar (inclui role) |
| `/users/:id` | DELETE | Autenticado | `auth` | Deletar (qualquer autenticado) |
| `/search` | GET | Public | - | Busca full-text pública |
| `/search/index` | POST | Autenticado | `auth` | Indexar documento |
| `/search/bulk` | POST | Autenticado | `auth` | Indexação em massa |
| `/search/:id` | DELETE | Autenticado | `auth` | Deletar documento |
| `/search/reindex` | POST | Autenticado | `auth` | Recriar índice |
| `/queues` | GET | Autenticado | `auth` + `fastify.authenticate` | Lista filas |
| `/queues/add` | POST | Autenticado | `auth` + `fastify.authenticate` | Adicionar job |

### 5.3 Vulnerabilidade de Autorização
- ❌ **NÃO HÁ CONTROLE DE ROLE BASEADO EM CONTEXT**
- Qualquer usuário autenticado pode:
  - Criar usuários com role ADMIN
  - Modificar qualquer usuário (inclusive mudar role)
  - Deletar qualquer usuário
  - Gerenciar índices de busca
  - Manter filas BullMQ

---

## 6. Proteção de Rotas

### 6.1 Backend (Fastify)

**Arquivo:** `/backend-boilerplate/src/server.ts`

```typescript
// JWT config
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

// Auth middleware registration
app.register(authenticate);  // /auth/login
app.register(getMe);          // /auth/me (redundante)
```

**Padrão de proteção:**
1. Rotas públicas: `/auth/login`, `/search` (GET)
2. Rotas protegidas: `.register(auth).METHOD(path, options, handler)`
3. Rotas com dupla proteção: `preHandler: [fastify.authenticate]` + plugin `auth`

### 6.2 Frontend (React + React Router)

**Arquivo:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/components/protected-route.tsx`

```tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, isHydrated } = useAuthStore();

  if (!isHydrated) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return children;
}
```

**Uso em rotas** (`/frontend-boilerplate/src/app/routes.tsx`):
```tsx
{
  path: '/dashboard',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
}
```

### 6.3 Token Envio

**Axios interceptor** (`/shared/lib/api-client.ts`):
```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

## 7. Headers de Segurança

### 7.1 Helmet Configuration

**Arquivo:** `/backend-boilerplate/src/server.ts` (linhas 113-129)

```typescript
app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // ⚠️ permissivo
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],    // ⚠️ permite https:任意
    },
  },
  hsts: {
    maxAge: 31536000,        // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },             // Proteção contra clickjacking
  dnsPrefetchControl: { allow: false },       // Desabilita DNS prefetch
});
```

### 7.2 Headers Configurados
| Header | Valor | Nota |
|--------|-------|------|
| `Content-Security-Policy` | Ver acima | Permite `unsafe-inline` em scripts via styleSrc |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ Bom |
| `X-Frame-Options` | `DENY` | ✅ Protege contra iframes maliciosos |
| `X-Content-Type-Options` | `nosniff` | ✅ Implícito via helmet |
| `Referrer-Policy` | padrão | Pode ser configurado |
| `Permissions-Policy` | não configurado | ❌ Falta |

### 7.3 CORS

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

- ✅ Default production: empty list (all origins blocked)
- ⚠️ Development: localhost:5173 e localhost:4000
- ⚠️ With `credentials: true`, `origin: true` should NOT be allowed (exists only if no origins configured)

---

## 8. Rate Limiting

### 8.1 Configuração Global

**Arquivo:** `/backend-boilerplate/src/server.ts` (linhas 132-140)

```typescript
app.register(fastifyRateLimit, {
  max: 100,                  // 100 requests por janela
  timeWindow: '1 minute',
  redis: redisAvailable ? app.redis : undefined,
  keyGenerator: (request) => {
    return request.ip;       // Rate limit por IP
  },
});
```

### 8.2 Limitações e Riscos
- ✅ Usa Redis se disponível (distribuído)
- ⚠️ Rate limit **sommente por IP**, não por usuário autenticado
- ⚠️ Sem rate limit diferenciado para endpoints críticos (/auth/login)
- ⚠️ Sem proteção contra credential stuffing

### 8.3 Recomendações
- Implementar rate limit por `userId` para endpoints autenticados
- Aplicar rate limit mais restritivo em `/auth/login` (ex: 5 fails/15min por IP)
- Considerar slow-down responses (RFC 6585)

---

## 9. Uploads — Validação e Segurança

### 9.1 Configuração Multipart

```typescript
app.register(fastifyMultipart, {
  limits: {
    fileSize: env.MAX_FILE_SIZE,  // 5MB default (do .env.example)
    files: 5,                     // Máximo 5 arquivos por request
    fields: 50,                   // Máximo 50 campos
  },
});
```

### 9.2 Serviço de Arquivos Estáticos

```typescript
const uploadDir = env.UPLOAD_DIR
  ? path.resolve(env.UPLOAD_DIR)
  : path.resolve('./uploads');

app.register(fastifyStatic, {
  root: uploadDir,
  prefix: '/uploads/',
  decorateReply: false,
});
```

### 9.3 Riscos Identificados
- ❌ Sem validação de tipo MIME
- ❌ Sem sanitização de nomes de arquivo
- ❌ Possibilidade de overwrite de arquivos existentes
- ❌ Sem scan de malware
- ❌ Sem controle de acesso por usuário (arquivos acessíveis diretamente pela URL)
- ⚠️ `/uploads/` pode ser indexado por motores de busca

---

## 10. Vulnerabilidades Conhecidas e Pontos de Atenção

### 10.1 Vulnerabilidades Críticas

| ID | Descrição | Severidade | Arquivos Afetados |
|----|-----------|------------|-------------------|
| SEC-001 |Ausência de refresh tokens | Alta |Backend: nenhum endpoint de refresh<br>Frontend: token expira em 1h sem renovação |
| SEC-002 | Armazenamento de token em localStorage | Alta | `/frontend-boilerplate/src/shared/lib/api-client.ts`<br>`/frontend-boilerplate/src/features/auth/store.ts` |
| SEC-003 | Nenhum controle de rate limit por login | Alta | `/backend-boilerplate/src/server.ts` |
| SEC-004 | Falta autorização por role (RBAC completo) | Crítica | Todas rotas admin/gerenciamento |
| SEC-005 | Token JWT não armazenado em cookie HttpOnly | Alta | Frontend usa localStorage |

### 10.2 Vulnerabilidades Médias

| ID | Descrição | Severidade |
|----|-----------|------------|
| SEC-006 | CSP permissivo (`unsafe-inline` em styleSrc) | Média |
| SEC-007 | Permissão `imgSrc` para `https:*` | Média (XSS via SVG) |
| SEC-008 | Uploads sem validação de tipo MIME/tamanho | Média |
| SEC-009 | Semantic Versioning desatualizada (jwt@9 → jwt@10 com vulnerabilidades fixadas) | Baixa |
| SEC-010 | Bull Board exposto na rota `/queues` (sem auth customizado) | Alta |
| SEC-011 | Hedgehog: No input validation for user-controlled role field on user creation/update | Alta |

### 10.3 Pontos de Melhoria (Boas Práticas)

- **Logout Server-Side:** Implementar blacklist de tokens revogados em Redis
- **CSRF Protection:** Aplicar proteção CSRF se cookies são usados no futuro
- **Audit Logging:** Logar eventos sensíveis (login, mudança de role, delete user)
- **Password Policy:** Forçar complexidade (min length, uppercase, numbers)
- **Account Lockout:** Bloquear após N tentativas falhas
- **JWT Configuration:** Adicionar Audience (`aud`), Issuer (`iss`)
- **Session Management:** Registrar IP/User-Agent no token para invalidar em caso de roubo
- **Input Validation:** Validação rigorosa em todos os endpoints
- **Security Headers:** Adicionar `Permissions-Policy`, `Referrer-Policy`
- **Dependency Scanning:** Atualizar dependências (bullmq, socket.io, etc)
- **OpenSearch Security:** Verificar credenciais e SSL config no `/lib/search/index.ts`
- **Swagger Protection:** Já possui basic-auth mas warning em produção se não configurado

---

## 11. Frontend — Armazenamento e Envio de Tokens

### 11.1 Armazenamento
- **Mecanismo:** `localStorage.setItem('token', token)`
- **Risco:** XSS pode acessar token diretamente
- **Recomendação:** Cookies `HttpOnly; Secure; SameSite=Strict`

### 11.2 Envio Automático

**Arquivo:** `/frontend-boilerplate/src/shared/lib/api-client.ts`

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

- ✅ Header `Authorization: Bearer <token>` padronizado
- ⚠️ Não valida expiração antes do envio (erro 401 manuseado no response interceptor)

### 11.3 Tratamento de Erro 401

```typescript
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

- ✅ Limpeza automática do localStorage
- ⚠️ Redirect forçado sem posibilidadade de refresh em background

### 11.4 Estado de Autenticação (Zustand Store)

**Arquivo:** `/frontend-boilerplate/src/features/auth/store.ts`

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
}
```

- ✅ Persistência via `zustand/middleware` (localStorage)
- ✅ Re-hydration detection com `isHydrated`
- ⚠️ Token salvo em localStorage também para persistência

---

## 12. Diagrama de Arquitetura de Segurança

```
                  ┌─────────────────────────────┐
                  │   Frontend (React/Vite)     │
                  │                             │
                  │ • LocalStorage (token)      │ ← XSS RISK
                  │ • Zustand Auth Store        │
                  │ • ProtectedRoute Wrapper   │
                  │ • API Client + Interceptor │
                  └──────────────┬──────────────┘
                                 │ Bearer Token
                                 ▼
                  ┌──────────────────────────────┐
                  │  Reverse Proxy / Load Balancer│
                  │  (optional)                  │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼────────────────────────────┐
                  │              Fastify Backend              │
                  │                                          │
                  │  Middleware Stack:                       │
                  │  ┌─────────────────────────────────────┐│
                  │  │ Helmet (security headers)          ││
                  │  │ CORS (allowed origins)             ││
                  │  │ Rate Limiter (100 req/min)         ││
                  │  │ JSON Schema Validation             ││
                  │  └─────────────────────────────────────┘│
                  │                                          │
                  │  ┌─────────────────────────────────────┐│
                  │  │ JWT Verify (fastify-jwt)           ││
                  │  │ → request.jwtVerify()              ││
                  │  └─────────────────────────────────────┘│
                  │                                          │
                  │  Route Handlers (preHandler: auth)     │
                  │  ┌ request.getCurrentUserId()         ││
                  │  └─────────────────────────────────────┘│
                  └──────────────┬───────────────────────────┘
                                 │ Prisma (PostgreSQL)
                                 ▼
                  ┌─────────────────────────────────────┐
                  │          PostgreSQL + Redis         │
                  │ • Users (id, email, passwordHash)  │
                  │ • BullMQ Queues                     │
                  │ • Cache (fastify-redis)             │
                  └─────────────────────────────────────┘
```

---

## 13. Checklist de Segurança Implementada

### 13.1 Autenticação

| Item | Status | Notas |
|------|--------|-------|
| JWT Stateless | ✅ Implementado | Expiração 1h |
| Password Hashing (bcrypt) | ✅ Implementado | 10 rounds |
| Login Rate Limit por IP | ⚠️ Parcial | Global rate limit apenas |
| Refresh Token | ❌ Ausente | Alta prioridade |
| Session Invalidation | ❌ Ausente | Sem blacklist |

### 13.2 Autorização

| Item | Status | Notas |
|------|--------|-------|
| Middleware de Autenticação | ✅ Implementado | `auth` plugin |
| RBAC por endpoint | ❌ Inexistente | Todos autenticados acessam tudo |
| Owner-based ACL | ❌ Ausente | Pode modificar qualquer usuário |
| Admin Role explícito | ⚠️ Parcial | Role existe mas sem uso |

### 13.3 HTTP Security

| Item | Status | Notas |
|------|--------|-------|
| Helmet | ✅ Implementado | Config restritivo |
| HSTS | ✅ Implementado | 1 ano + preload |
| CSP | ⚠️ Parcial | `unsafe-inline` em style |
| Frameguard | ✅ Implementado | DENY |
| XSS Protection | ⚠️ Parcial | `nosniff` implícito |
| CORS | ✅ Implementado | Origins configuráveis |

### 13.4 Frontend

| Item | Status | Notas |
|------|--------|-------|
| Protected Routes | ✅ Implementado | `ProtectedRoute` |
| Token Refresh Auto | ❌ Ausente | Necessário recarregar |
| Secure Cookie Option | ❌ Ausente | localStorage |
| CSRF Token | ❌ Ausente | Não aplicável a JWT stateless |

### 13.5 Data Validation

| Item | Status | Notas |
|------|--------|-------|
| Zod Validation | ✅ Implementado | Schema rigorosos |
| SQL Injection | ✅ Protegido | Prisma ORM (param queries) |
| File Upload | ⚠️ Parcial | Size limit mas sem tipo check |

---

## 14. Resumo de Riscos

### 14.1 Top 5 Vulnerabilidades

1. **Sem Controle de Roles (RBAC)** - Usuário comum pode criar/atualizar/admin outros usuários
2. **Token em localStorage** - Suscetível a XSS theft
3. **Sem Refresh Tokens** - UX ruim + força re-lógins
4. **Rate Limit por IP apenas** - Ataque distribuído por botnet ainda funciona
5. **Bull Board Exposto** - Mesmo com basic-auth, fica como attack surface

### 14.2 Recomendações de Prioridade

| Prioridade | Ação | Esforço |
|------------|------|---------|
| P0 | Implementar RBAC real (ADMIN-only endpoints) | 🔥 Alto |
| P0 | Mover token para HttpOnly cookies | 🔥 Alto |
| P0 | Rate limit por userId para endpoints autenticados | 🟡 Medio |
| P1 | Implementar refresh token flow com Redis blacklist | 🔥 Alto |
| P1 | Adicionar validação de role em createUser/updateUser | 🟡 Medio |
| P1 | hardening CSP (remover unsafe-inline) | 🟡 Medio |
| P2 | Implementar account lockout por falhas de login | 🟡 Medio |
| P2 | Audit log série (tabela audit_log) | 🟡 Medio |

---

## 15. Arquivos Relevantes

### 15.1 Backend
```
/backend-boilerplate/src/server.ts                     # Config principal
/backend-boilerplate/src/middlewares/auth.ts          # Auth plugin
/backend-boilerplate/src/middlewares/auth-socket.ts   # Socket auth
/backend-boilerplate/src/http/routes/auth/            # Auth endpoints
  ├── authenticate.ts                                 # Login
  └── get-me.ts                                       # Me endpoint
/backend-boilerplate/src/http/routes/user/            # User mgmt
  ├── create-user.ts
  ├── list-users.ts
  ├── update-user.ts
  └── delete-user.ts
/backend-boilerplate/prisma/schema.prisma             # Models e roles
```

### 15.2 Frontend
```
/frontend-boilerplate/src/shared/lib/api-client.ts   # Axios + token injection
/frontend-boilerplate/src/features/auth/
  ├── store.ts                                        # Zustand auth state
  ├── hooks/use-auth.ts                               # React Query hooks
  ├── api.ts                                          # Auth API client
  └── components/protected-route.tsx                  # Route guard
/frontend-boilerplate/src/app/routes.tsx              # Route definitions
```

---

## Conclusão

O boilerplate apresenta uma **base sólida** de segurança com:
- ✅ JWT stateless bem implementado
- ✅ Helmet + HSTS + CORS
- ✅ Rate limiting global
- ✅ bcrypt para senhas
- ✅ Middleware reutilizável

No entanto, apresenta **deficiências críticas** que precisam ser endereçadas antes de produção:
- ❌ Ausência de RBAC efetivo
- ❌ Token em localStorage (XSS vector)
- ❌ Sem refresh tokens
- ❌ Sem rate limit por usuário
- ⚠️ Upload inseguro
- ⚠️ CSP relaxado

**Recomendação final:** Antes de deploy em produção, implementar pelo menos as ações P0 (RBAC, cookie HttpOnly, rate limit por user). A arquitetura atual é propícia a refactoring; não é necessário reescrever, apenas ajustar camadas de autorização e session management.
