# Catálogo de Endpoints da API REST

Este documento apresenta a documentação completa de todos os endpoints da API REST do projeto **boilerplate**. O projeto contém duas implementações de API:

1. **Backend Boilerplate** (Fastify) - `/backend-boilerplate`
2. **NextJS API REST** (Next.js) - `/nextjs-api-rest`

---

## Sumário

- [Diagrama de Árvore de Rotas](#diagrama-de-árvore-de-rotas)
- [Tabelas de Endpoints](#tabelas-de-endpoints)
- [Exemplos de Requisições (cURL)](#exemplos-de-requisições-curl)
- [DTOs e Schemas de Validação](#dtos-e-schemas-de-validação)
- [Fluxo de Erros](#fluxo-de-erros)
- [Configurações de Segurança](#configurações-de-segurança)

---

## Diagrama de Árvore de Rotas

### Backend Boilerplate (Fastify)

```
/
├── /health                                          [GET] - Health check
├── /auth/login                                      [POST] - Autenticação
├── /auth/me                                        [GET] - Usuário atual
├── /users                                          [GET, POST] - Listar/Criar usuários
├── /users/:id                                      [GET, PUT, DELETE] - Operações por ID
├── /queues                                         [GET] - Status das filas
├── /queues/add                                     [POST] - Adicionar job
├── /queues/add-bulk                                [POST] - Adicionar jobs em lote
├── /queues/:queue/jobs                             [GET] - Listar jobs
├── /queues/:queue/jobs/:jobId                      [GET] - Detalhes do job
├── /queues/:queue/jobs/:jobId/retry                [POST] - Retry job
├── /queues/:queue/jobs/:jobId                      [DELETE] - Remover job
├── /queues/:queue/clean                            [DELETE] - Limpar fila
├── /queues/:queue/empty                            [DELETE] - Esvaziar fila
├── /search                                         [GET] - Busca textual
├── /search/geo                                    [GET] - Busca geoespacial
├── /search/autocomplete                            [GET] - Sugestões autocomplete
├── /search/analytics                               [GET] - Agregações/analytics
├── /search/index                                   [POST] - Indexar documento
├── /search/bulk                                    [POST] - Indexar em lote
├── /search/:id                                     [DELETE] - Deletar documento
├── /search/reindex                                 [POST] - Recrear índice
└── /search/ensure-index                            [POST] - Garantir índice existe
```

### NextJS API REST (Next.js)

```
/api
├── /health                                         [GET] - Health check
├── /docs                                           [GET] - Documentação Swagger
├── /auth/login                                     [POST] - Autenticação
├── /auth/register                                  [POST] - Registro
├── /auth/me                                        [GET] - Usuário atual
└── /users                                          [GET, POST] - Listar/Criar usuários
    └── /users/:id                                  [GET, PUT, DELETE] - Operações por ID
```

---

## Tabelas de Endpoints

### 1. Health Check

| Método | Rota | Descrição | Auth | Body/Params | Response |
|--------|------|-----------|------|-------------|----------|
| GET | `/health` | Verifica status da API | Não | - | `200: { status, timestamp, service, version }` |

### 2. Autenticação

| Método | Rota | Descrição | Auth | Body/Params | Response |
|--------|------|-----------|------|-------------|----------|
| POST | `/auth/login` | Autentica usuário e retorna token JWT | Não | `{ email, password }` | `200: { token, user }` |
| POST | `/auth/register` | Registra novo usuário | Não | `{ name, email, password, role? }` | `201: { user, token }` |
| GET | `/auth/me` | Retorna dados do usuário atual | Bearer Token | Header: `Authorization: Bearer <token>` | `200: { id, name, email, role, ... }` |

### 3. Usuários

| Método | Rota | Descrição | Auth | Body/Params | Response |
|--------|------|-----------|------|-------------|----------|
| GET | `/users` | Lista usuários com paginação | Bearer Token | Query: `page, pageSize, role, isActive, search` | `200: { users[], total, page, pageSize, totalPages }` |
| POST | `/users` | Cria novo usuário | Bearer Token | `{ name, email, password, role? }` | `201: { id, name, email, role, ... }` |
| GET | `/users/:id` | Obtém usuário por ID | Bearer Token | Params: `id` | `200: { id, name, email, role, ... }` |
| PUT | `/users/:id` | Atualiza usuário | Bearer Token | Params: `id`, Body: `{ name?, email?, password?, role?, isActive? }` | `200: { id, name, email, role, ... }` |
| DELETE | `/users/:id` | Remove usuário | Bearer Token | Params: `id` | `204: (vazio)` |

### 4. Filas (Jobs/Queue)

| Método | Rota | Descrição | Auth | Body/Params | Response |
|--------|------|-----------|------|-------------|----------|
| GET | `/queues` | Lista status de todas as filas | Bearer Token | - | `200: { queues[] }` |
| POST | `/queues/add` | Adiciona job à fila | Bearer Token | `{ queue, name, data, options? }` | `201: { success, job }` |
| POST | `/queues/add-bulk` | Adiciona múltiplos jobs | Bearer Token | `{ queue, jobs[] }` | `201: { success, count, jobs[] }` |
| GET | `/queues/:queue/jobs` | Lista jobs de uma fila | Bearer Token | Params: `queue` | `200: { queue, waiting[], active[], failed[] }` |
| GET | `/queues/:queue/jobs/:jobId` | Detalhes de um job | Bearer Token | Params: `queue, jobId` | `200: { id, name, data, progress, state, ... }` |
| POST | `/queues/:queue/jobs/:jobId/retry` | Retry job falho | Bearer Token | Params: `queue, jobId` | `200: { success, message }` |
| DELETE | `/queues/:queue/jobs/:jobId` | Remove job | Bearer Token | Params: `queue, jobId` | `200: { success, message }` |
| DELETE | `/queues/:queue/clean` | Limpa jobs da fila | Bearer Token | Params: `queue` | `200: { success, cleaned }` |
| DELETE | `/queues/:queue/empty` | Esvazia fila completamente | Bearer Token | Params: `queue` | `200: { success, message }` |

### 5. Busca/Search

| Método | Rota | Descrição | Auth | Body/Params | Response |
|--------|------|-----------|------|-------------|----------|
| GET | `/search` | Busca textual completa | Não | Query: `query, type, status, tags, category, authorId, dateFrom, dateTo, fuzzy, fuzziness, page, size, sort` | `200: { results: { hits[], total, page, size, took } }` |
| GET | `/search/geo` | Busca geoespacial | Não | Query: `query, lat, lon, radius, unit, page, size` | `200: { results: { hits[], total, took } }` |
| GET | `/search/autocomplete` | Sugestões de autocomplete | Não | Query: `prefix, field, size` | `200: { suggestions: { text, score }[] }` |
| GET | `/search/analytics` | Agregações e analytics | Não | - | `200: { types[], statuses[], tags[], categories[], authors[], dateHistogram[] }` |
| POST | `/search/index` | Indexa documento | Bearer Token | Body: `{ id, title, content, type, status?, tags?, category?, author, location? }` | `201: { success, id }` |
| POST | `/search/bulk` | Indexa múltiplos documentos | Bearer Token | Body: `{ documents[] }` | `201: { success, indexed }` |
| DELETE | `/search/:id` | Remove documento do índice | Bearer Token | Params: `id` | `200: { success, deleted }` |
| POST | `/search/reindex` | Recrear índice | Bearer Token | - | `200: { success, message }` |
| POST | `/search/ensure-index` | Garantir índice existe | Bearer Token | - | `200: { success, message }` |

---

## Exemplos de Requisições (cURL)

### Health Check

```bash
curl -X GET http://localhost:4000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-11T19:40:00.000Z",
  "service": "backend-boilerplate",
  "version": "1.0.0"
}
```

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

### Criar Usuário (Autenticado)

```bash
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER"
  }'
```

**Response (201):**
```json
{
  "id": "user-456",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "isActive": true,
  "createdAt": "2024-03-11T19:40:00.000Z"
}
```

### Listar Usuários (Autenticado)

```bash
curl -X GET "http://localhost:4000/users?page=1&pageSize=10&role=USER" \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```

**Response:**
```json
{
  "users": [
    {
      "id": "user-123",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "isActive": true,
      "lastLoginAt": "2024-03-11T19:30:00.000Z",
      "createdAt": "2024-03-01T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

### Buscar Usuário por ID (Autenticado)

```bash
curl -X GET http://localhost:4000/users/user-123 \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```

### Atualizar Usuário (Autenticado)

```bash
curl -X PUT http://localhost:4000/users/user-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \
  -d '{
    "name": "John Updated",
    "isActive": false
  }'
```

### Deletar Usuário (Autenticado)

```bash
curl -X DELETE http://localhost:4000/users/user-123 \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```

### Adicionar Job à Fila

```bash
curl -X POST http://localhost:4000/queues/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \
  -d '{
    "queue": "email-queue",
    "name": "send-welcome-email",
    "data": {
      "to": "user@example.com",
      "template": "welcome"
    },
    "options": {
      "priority": 5,
      "delay": 0,
      "attempts": 3
    }
  }'
```

### Busca Textual

```bash
curl -X GET "http://localhost:4000/search?query=project&type=task&status=active&page=1&size=20"
```

**Response:**
```json
{
  "results": {
    "hits": [
      {
        "id": "doc-123",
        "title": "New Project",
        "content": "Project description...",
        "type": "task",
        "status": "active",
        "tags": ["urgent", "backend"],
        "score": 12.5,
        "createdAt": "2024-03-01T00:00:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "size": 20,
    "took": 45
  }
}
```

### Busca Geoespacial

```bash
curl -X GET "http://localhost:4000/search/geo?lat=-23.5505&lon=-46.6333&radius=50&unit=km"
```

### Autocomplete

```bash
curl -X GET "http://localhost:4000/search/autocomplete?prefix=proj&field=title&size=5"
```

**Response:**
```json
{
  "suggestions": [
    { "text": "Project Alpha", "score": 10.5 },
    { "text": "Project Beta", "score": 8.2 }
  ]
}
```

### Indexar Documento

```bash
curl -X POST http://localhost:4000/search/index \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>" \
  -d '{
    "id": "doc-001",
    "title": "My Document",
    "content": "Document content here",
    "type": "document",
    "status": "active",
    "tags": ["important", "draft"],
    "category": "reports",
    "author": {
      "id": "user-123",
      "name": "Author Name",
      "email": "author@example.com"
    }
  }'
```

---

## DTOs e Schemas de Validação

### 1. User Schemas

#### CreateUserSchema (Zod)

```typescript
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});
```

#### UpdateUserSchema (Zod)

```typescript
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
});
```

#### LoginSchema (Zod)

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

#### UserQuerySchema (Zod)

```typescript
const userQuerySchema = z.object({
  page: z.coerce.number().default(1).min(1),
  pageSize: z.coerce.number().default(10).min(1).max(100),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
```

### 2. Queue Schemas

#### AddJobSchema (Zod)

```typescript
const addJobSchema = z.object({
  queue: z.enum([
    'email-queue',
    'notification-queue',
    'processing-queue',
    'webhook-queue',
    'background-queue',
  ]),
  name: z.string().min(1),
  data: z.record(z.any()),
  options: z.object({
    priority: z.number().min(1).max(10).optional(),
    delay: z.number().min(0).optional(),
    attempts: z.number().min(1).max(10).optional(),
    jobId: z.string().optional(),
  }).optional(),
});
```

#### AddBulkJobsSchema (Zod)

```typescript
const addBulkJobsSchema = z.object({
  queue: z.enum([...]),
  jobs: z.array(z.object({
    name: z.string().min(1),
    data: z.record(z.any()),
    options: z.object({...}).optional(),
  })),
});
```

### 3. Search Schemas

#### SearchQuerySchema (Zod)

```typescript
const searchQuerySchema = z.object({
  query: z.string().optional(),
  type: z.enum(['project', 'task', 'user', 'document', 'comment']).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  authorId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  fuzzy: z.coerce.boolean().default(true),
  fuzziness: z.coerce.number().min(0).max(2).default(1),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'date_desc', 'date_asc']).default('relevance'),
});
```

#### GeoSearchSchema (Zod)

```typescript
const geoSearchSchema = z.object({
  query: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().default(50),
  unit: z.enum(['km', 'miles']).default('km'),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(20),
});
```

#### AutocompleteSchema (Zod)

```typescript
const autocompleteSchema = z.object({
  prefix: z.string().min(1),
  field: z.enum(['title', 'content', 'tags']).default('title'),
  size: z.coerce.number().min(1).max(20).default(10),
});
```

---

## Fluxo de Erros

### Arquitetura de Error Handling

O projeto utiliza uma estratégia centralizada de tratamento de erros definida em `/backend-boilerplate/src/http/error-handler.ts`.

### Tipos de Erros Customizados

| Classe | Status Code | Descrição |
|--------|-------------|-----------|
| `BadRequestError` | 400 | Requisição inválida |
| `UnauthorizedError` | 401 | Não autenticado ou token inválido |
| `ForbiddenError` | 403 | Acesso negado (privilégios insuficientes) |
| `NotFoundError` | 404 | Recurso não encontrado |

### Fluxo de Tratamento de Erros

```
Requisição HTTP
       |
       v
Middleware de Autenticação (se aplicável)
       |
       v
Validação Zod (Schema)
       |
       +-- Erro de Validação --> 400 Bad Request
       |                           { message, errors[] }
       v
Lógica de Negócio (Service)
       |
       +-- Erro Customizado --> Status Code Específico
       |                        { message }
       v
Resposta JSON
```

### Formato de Respostas de Erro

#### Erro de Validação Zod (Fastify)

```json
{
  "message": "Validation error",
  "errors": [
    {
      "message": "Invalid email format",
      "path": "body.email"
    }
  ]
}
```

#### Erro Zod (422 Unprocessable Entity)

```json
{
  "error": {
    "code": "unprocessable_entity",
    "message": "email: Invalid email"
  }
}
```

#### Erros Customizados

```json
// Bad Request (400)
{ "message": "Email already in use" }

// Unauthorized (401)
{ "message": "Invalid or expired token" }

// Forbidden (403)
{ "message": "Access denied. Admin privileges required" }

// Not Found (404)
{ "message": "User not found" }

// Conflict (409 - NextJS API)
{ "message": "Usuário com este email já existe" }

// Internal Server Error (500)
{ "message": "Internal server error" }
```

### Exemplo de Implementação do Error Handler

```typescript
// /backend-boilerplate/src/http/error-handler.ts
export const errorHandler = (error, request, reply) => {
  // Erros de validação Zod do Fastify
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.validation.map((e) => ({
        message: e.message,
        path: e.params.issue.path.join('.'),
      })),
    });
  }

  // Erros Zod
  if (error instanceof ZodError) {
    return reply.status(422).send(fromZodError(error));
  }

  // Erros customizados
  if (error instanceof BadRequestError) {
    return reply.status(400).send({ message: error.message });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({ message: error.message });
  }

  // Erro genérico
  return reply.status(500).send({
    message: 'Internal server error',
  });
};
```

### Middleware de Autenticação

O middleware de autenticação (`/backend-boilerplate/src/middlewares/auth.ts`) adiciona os métodos:

- `request.getCurrentUserId()` - Retorna o ID do usuário autenticado
- `request.getCurrentUserRole()` - Retorna a role do usuário autenticado

Estes métodos lançam `UnauthorizedError` se o token for inválido ou expirado.

---

## Configurações de Segurança

### Rate Limiting

- **Backend Boilerplate**: 100 requests por minuto (global)
- **Redis**: Usado para armazenar contadores se disponível
- **Fallback**: Memória local se Redis indisponível

### CORS

- **Desenvolvimento**: `http://localhost:5173`, `http://localhost:4000`
- **Produção**: Configurável via variável `CORS_ORIGINS`

### JWT

- **Algoritmo**: HS256
- **Expiração (Backend)**: 1 hora
- **Expiração (NextJS)**: 7 dias

### Headers de Segurança (Helmet)

- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- Frameguard (proteção contra clickjacking)
- DNS Prefetch Control

### Autenticação de Rotas

| Rota | Requer Auth | Role Necessária |
|------|-------------|-----------------|
| `/health` | Não | - |
| `/auth/login` | Não | - |
| `/auth/register` (NextJS) | Não | - |
| `/auth/me` | Sim | qualquer |
| `/users` (GET) | Sim | qualquer |
| `/users` (POST) | Sim | qualquer |
| `/users/:id` | Sim | qualquer |
| `/queues/*` | Sim | qualquer |
| `/search` | Não | - |
| `/search/*` (admin) | Sim | qualquer |

---

## Documentação Swagger/OpenAPI

### Backend Boilerplate

A documentação Swagger está disponível em:
- **URL**: `http://localhost:4000/docs`
- **JSON**: `http://localhost:4000/docs/json`

### NextJS API REST

A documentação Swagger está disponível em:
- **URL**: `http://localhost:4001/api/docs`

---

## Variáveis de Ambiente

### Backend Boilerplate

| Variável | Descrição | Default |
|----------|------------|---------|
| `PORT` | Porta do servidor | 4000 |
| `NODE_ENV` | Ambiente | development |
| `DATABASE_URL` | URL do banco PostgreSQL | - |
| `REDIS_URL` | Host do Redis | localhost |
| `REDIS_PORT` | Porta do Redis | 6379 |
| `JWT_SECRET` | Chave secreta do JWT | - |
| `CORS_ORIGINS` | Origins permitidas (separadas por vírgula) | - |
| `SWAGGER_USER` | Usuário para documentação Swagger | - |
| `SWAGGER_PASSWORD` | Senha para documentação Swagger | - |

### NextJS API REST

| Variável | Descrição |
|-----------|------------|
| `DATABASE_URL` | URL do banco PostgreSQL |
| `JWT_SECRET` | Chave secreta do JWT |
| `NEXTAUTH_SECRET` | Secret do NextAuth |
| `NEXTAUTH_URL` | URL da aplicação |

---

*Documento gerado automaticamente em: 2024-03-14*
