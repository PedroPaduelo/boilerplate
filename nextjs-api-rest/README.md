# 99Freela API REST com Next.js

API REST completa desenvolvida com Next.js API Routes, Prisma, Zod para validação, JWT para autenticação e documentação OpenAPI/Swagger.

## 📋 Funcionalidades

- **Autenticação JWT** - Login e registro de usuários
- **CRUD Completo de Usuários** - Listar, criar, atualizar e excluir
- **Validação de Dados** - Com Zod em todas as rotas
- **Documentação OpenAPI** - Swagger UI em `/api/docs`
- **Testes Automatizados** - Jest com testes unitários
- **TypeScript** - Tipagem completa
- **Prisma ORM** - Facilidade no banco de dados
- **Middlewares de Autenticação** - Proteção de rotas

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- PostgreSQL 16+
- npm ou yarn

### Configuração

1. Clone o projeto e acesse a pasta `nextjs-api-rest`

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (crie `.env.local`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/99freela"
JWT_SECRET="sua-chave-secreta-mudar-isso"
NEXTAUTH_SECRET="outra-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:4001"
PORT=4001
```

⚠️ **IMPORTANTE**: Use senhas fortes e únicas para `JWT_SECRET` e `NEXTAUTH_SECRET`.

4. Configure o banco de dados:

```bash
# Criar e executar migrações
npm run db:push

# Ou se preferir com migrações versionadas
npm run db:migrate
```

5. Seed de dados (usuários de teste):

```bash
npm run db:seed
```

6. Execute a aplicação:

```bash
npm run dev
```

A API estará disponível em: http://localhost:4001

## 📚 Documentação da API

### Autenticação

A API usa **JWT Bearer Tokens**. Após o login, inclua o token no header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Auth

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Autenticar usuário |
| GET | `/api/auth/me` | Obter dados do usuário logado |

#### Users

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/users` | Listar usuários com paginação e filtros |
| POST | `/api/users` | Criar novo usuário |
| GET | `/api/users/:id` | Obter usuário por ID |
| PUT | `/api/users/:id` | Atualizar usuário |
| DELETE | `/api/users/:id` | Excluir usuário |

#### Health

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check da API |

### Exemplos

#### Registrar usuário

```bash
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER"
  }'
```

#### Login

```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Listar usuários

```bash
curl -X GET http://localhost:4001/api/users \
  -H "Authorization: Bearer <token>"
```

#### Obter usuário por ID

```bash
curl -X GET http://localhost:4001/api/users/<user-id> \
  -H "Authorization: Bearer <token>"
```

#### Atualizar usuário

```bash
curl -X PUT http://localhost:4001/api/users/<user-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nome Atualizado",
    "email": "newemail@example.com"
  }'
```

#### Excluir usuário

```bash
curl -X DELETE http://localhost:4001/api/users/<user-id> \
  -H "Authorization: Bearer <token>"
```

### Parâmetros de Query (Listagem)

- `page` (número): Página atual (padrão: 1)
- `pageSize` (número): Itens por página (padrão: 10)
- `role` (string): Filtrar por papel (`ADMIN` ou `USER`)
- `isActive` (boolean): Filtrar por status ativo
- `search` (string): Buscar por nome ou email

## 🧪 Testes

### Executar testes unitários:

```bash
npm test
```

### Executar testes em modo watch:

```bash
npm run test:watch
```

### Cobertura de testes:

```bash
npm test -- --coverage
```

## 🗄️ Banco de Dados

### Modelo de Usuário

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String?
  password    String
  role        UserRole  @default(USER)
  isActive    Boolean   @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum UserRole {
  ADMIN
  USER
}
```

### Comandos úteis:

```bash
# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema (sem migrações)
npm run db:push

# Criar migração
npm run db:migrate

# Abrir Prisma Studio (interface gráfica)
npm run db:studio
```

## 📁 Estrutura do Projeto

```
nextjs-api-rest/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── users/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── health/route.ts
│   │   │   └── docs/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   ├── auth.ts
│   │   ├── auth-middleware.ts
│   │   ├── validators/
│   │   │   └── user.ts
│   │   └── services/
│   │       └── user-service.ts
│   └── tests/
│       ├── validators/
│       │   └── user.test.ts
│       ├── lib/
│       │   └── jwt.test.ts
│       └── api/
│           └── health.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── next.config.ts
└── README.md
```

## 🔒 Segurança

- Senhas são hash usando bcryptjs (10 rounds)
- JWT com expiração de 7 dias
- Validação de todos os inputs com Zod
- Middleware de autenticação em rotas protegidas
- Verificação de usuário ativo antes de operações

## 📝 Documentação OpenAPI

A documentação interativa está disponível em:

```
http://localhost:4001/api/docs
```

Formato JSON:

```
http://localhost:4001/api/docs?format=json
```

## 🧪 Usuários de Teste (seed)

Após rodar `npm run db:seed`:

- **Admin**: `admin@99freela.com` / `admin123`
- **Usuário**: `user@99freela.com` / `user123`

## 📄 Licença

MIT
