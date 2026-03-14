# Guia de Contribuição

Bem-vindo ao Boilerplate Fullstack! Este documento contém tudo o que você precisa para começar a contribuir com o projeto. Leia com atenção e qualquer dúvida, abra uma issue.

## Como Comecar

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Depois, clone seu fork
git clone https://github.com/SEU_USUARIO/boilerplate.git
cd boilerplate

# Adicione o repositório original como upstream
git remote add upstream https://github.com/PedroPaduelo/boilerplate.git
```

### 2. Branches

Seguimos o padrão Git Flow simplificado:

- `main` - Branch principal de produção
- `feature/*` - Novas funcionalidades (ex: `feature/user-auth`)
- `fix/*` - Correções de bugs (ex: `fix/login-validation`)
- `docs/*` - Documentação
- `refactor/*` - Refatoração de código

```bash
# Criar uma nova branch para sua feature
git checkout -b feature/minha-nova-feature

# Criar branch baseada na main
git checkout -b fix/correcao-bug origin/main
```

### 3. Mantendo sua Branch Atualizada

```bash
# Buscar alterações do upstream
git fetch upstream

# Rebase sua branch sobre a main
git rebase upstream/main

# OU merge (se preferir)
git merge upstream/main
```

## Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js 20+ (use nvm para gerenciar versões)
- Docker e Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Setup Completo

```bash
# 1. Instale as dependências
make install

# 2. Configure as variáveis de ambiente
cp .env.example backend-boilerplate/.env
cp .env.example frontend-boilerplate/.env

# 3. Edite os arquivos .env com suas configurações
# Principais variáveis:
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL, REDIS_PORT, REDIS_PASSWORD
# - JWT_SECRET
# - NODE_ENV=development

# 4. Suba os serviços Docker (PostgreSQL, Redis, OpenSearch)
make services-up

# 5. Execute as migrações do banco
make db-push

# 6. (Opcional) Popule o banco com dados de teste
make db-seed

# 7. Inicie o ambiente de desenvolvimento
make dev
```

Após executar `make dev`, você terá:

| Servico | URL |
|---------|-----|
| Backend (Fastify) | http://localhost:4001 |
| Frontend (Vite) | http://localhost:5173 |
| Documentacao API | http://localhost:4001/docs |
| Dashboard Filas | http://localhost:4001/queues |
| Adminer (DB) | http://localhost:8080 |

### Comandos Úteis do Makefile

```bash
make dev              # Inicia backend + frontend em paralelo
make dev-backend      # Apenas backend
make dev-frontend      # Apenas frontend
make services-up       # Sobe Docker
make services-down     # Para Docker
make db-push          # Sincroniza schema Prisma
make db-studio        # Abre Prisma Studio
make test             # Roda todos os testes
make test-backend     # Testes backend
make test-frontend    # Testes frontend
make lint             # Verifica código
make lint-fix         # Corrige erros de lint
make build            # Build completo
make clean            # Limpa build/node_modules
```

## Fluxo de Trabalho

### 1. Desenvolva sua Feature

```bash
# Crie a branch
git checkout -b feature/minha-feature

# Faça suas alterações
# ... codifique ...

# Commit das alterações (siga Conventional Commits)
git add .
git commit -m "feat(auth): adiciona validação de email"
```

### 2. Conventional Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descricao>

[corpo opcional]

[footer opcional]
```

**Tipos:**

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (não affecta código) |
| `refactor` | Refatoração |
| `perf` | Melhoria de performance |
| `test` | Adição/correção de testes |
| `build` | Mudanças em build/dependências |
| `ci` | Mudanças em CI/CD |
| `chore` | Tarefas de manutenção |

**Exemplos:**

```bash
# Feature simples
git commit -m "feat(user): adiciona endpoint de perfil"

# Com escopo e corpo
git commit -m "feat(auth):
adiciona autenticação por OAuth2 com Google
- implementa fluxo OAuth2
- adiciona validação de tokens
- cria middleware de proteção"

# Correção de bug
git commit -m "fix(api): corrige validação de senha vazia"

# Breaking change
git commit -m "feat(auth)!: remove suporte a autenticação básica
BREAKING CHANGE: autenticação básica foi removida, use OAuth2"
```

### 3. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/minha-feature

# No GitHub, crie o Pull Request
```

### 4. Template de Pull Request

```markdown
## Descrição
[Descreva brevemente o que foi feito]

## Tipo de Mudança
- [ ] Feature nova
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Mudança de configuração

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commits seguem Conventional Commits

## Screenshots (se aplicável)
[Adicione screenshots se houver mudanças visuais]
```

## Testes

### Como Rodar

```bash
# Todos os testes (backend + frontend)
make test

# Apenas backend
make test-backend

# Apenas frontend
make test-frontend

# Em modo watch (frontend)
cd frontend-boilerplate && npm run test:watch

# Coverage
cd backend-boilerplate && npm test -- --coverage
```

### Coverage Esperado

- **Meta mínima: 80% de coverage**
- Priorize testes de:
  - Regras de negócio (services)
  - Validações (Zod schemas)
  - Autenticação e autorização
  - Integrações críticas com banco

### Como Escrever Testes

**Backend (Jest + Supertest):**

```typescript
// tests/backend/auth.test.ts
import request from 'supertest';
import { app } from '../../src/server';

describe('POST /auth/login', () => {
  it('deve retornar 401 com credenciais inválidas', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'invalido@teste.com', password: 'errada' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });

  it('deve retornar token com credenciais válidas', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@teste.com', password: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

**Frontend (Vitest + Testing Library):**

```tsx
// tests/frontend/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '@/features/auth/components/LoginForm';

describe('LoginForm', () => {
  it('deve renderizar campos de email e senha', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('deve chamar onSubmit com dados válidos', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });
});
```

### Boas Práticas de Testes

1. **Nomeie bem os testes**: Use o padrão `deve [ação]` em português
2. **Arrange-Act-Assert**: Organize seu teste nessas três partes
3. **Teste comportamento, não implementação**: Foque no resultado, não em como chegou lá
4. **Evite testes frágeis**: Não teste implementação interna ou seletores CSS
5. **Mocks estratégicos**: Mock apenas dependências externas

## Padrões de Código

### TypeScript Strict

O projeto usa TypeScript em modo strict. Não desabilite checking types!

```typescript
// BOM - use tipos corretamente
function createUser(data: CreateUserDTO): Promise<User> {
  return prisma.user.create({ data });
}

// RUIM - any ou @ts-ignore
function createUser(data: any): Promise<any> { // NÃO FAÇA ISSO
  return prisma.user.create({ data });
}
```

### ESLint + Prettier

```bash
# Verificar erros
make lint

# Auto-correção
make lint-fix
```

**Regras importantes:**

- camelCase para variáveis e funções
- PascalCase para componentes e classes
- UPPER_SNAKE_CASE para constantes
- Não use `any`, use `unknown` ou genéricos
- Sempre defina tipos de retorno
- Use `const` ao invés de `let`

### Formatação

O Prettier formata automaticamente. Configure seu editor:

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Estrutura do Projeto

```
boilerplate/
├── backend-boilerplate/     # API REST (Fastify)
│   ├── prisma/              # Schema e migrações
│   ├── src/
│   │   ├── http/
│   │   │   ├── routes/      # Endpoints da API
│   │   │   ├── middlewares/ # Middlewares (auth, etc)
│   │   │   └── error-handler.ts
│   │   ├── lib/             # Utilitários (Redis, env, etc)
│   │   ├── services/        # Regras de negócio
│   │   │   └── jobs/       # Filas BullMQ
│   │   └── socket/          # WebSockets Socket.IO
│   └── tests/               # Testes backend
│
├── frontend-boilerplate/    # Frontend (React + Vite)
│   ├── src/
│   │   ├── app/             # Rotas e layout principal
│   │   ├── features/        # Organização por feature
│   │   │   └── auth/        # Ex: feature de auth
│   │   │       ├── api/     # Chamadas API
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       ├── store/   # Zustand store
│   │   │       └── types/
│   │   └── shared/
│   │       ├── components/  # Componentes compartilhados (shadcn/ui)
│   │       ├── hooks/
│   │       ├── lib/         # Utils
│   │       └── types/
│   └── tests/               # Testes frontend
│
├── docs/                    # Documentação
├── scripts/                 # Scripts utilitários
├── tests/                   # Testes globais (performance)
├── docker-compose.yml       # Serviços Docker
└── Makefile                 # Comandos utilitários
```

## Convenções

### Naming

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Variável | camelCase | `userName`, `isActive` |
| Função | camelCase | `getUserById`, `calculateTotal` |
| Componente React | PascalCase | `UserCard`, `LoginForm` |
| Type/Interface | PascalCase | `UserDTO`, `AuthResponse` |
| Constante | UPPER_SNAKE | `MAX_RETRY`, `API_BASE_URL` |
| Arquivo | kebab-case | `user-service.ts`, `login-form.tsx` |
| Branch | feature/fix/docs + description | `feature/user-authentication` |

### Camadas (Backend)

Siga esta hierarquia:

1. **Routes** - Recebem request, chamam validator → service
2. **Services** - Regras de negócio, chamam repository
3. **Repositories** - Acesso ao banco de dados (Prisma)
4. **Libs** - Utilitários (Redis, JWT, etc)

```typescript
// 1. Route (entry point)
import { createUserSchema } from '@/lib/validators/user';
import { createUser } from '@/services/user-service';

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  // Validação já feita pelo Fastify com Zod
  const data = createUserSchema.parse(request.body);

  // Chama service
  const user = await createUser(data);

  return reply.status(201).send(user);
}

// 2. Service (regras de negócio)
import { userRepository } from '@/repositories/user-repository';
import { hashPassword } from '@/lib/crypto';

export async function createUser(data: CreateUserDTO) {
  // Regra de negócio: verificar se email já existe
  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    throw new Error('Email já cadastrado');
  }

  // Hashear senha
  const hashedPassword = await hashPassword(data.password);

  // Criar usuário
  return userRepository.create({
    ...data,
    password: hashedPassword,
  });
}

// 3. Repository (acesso a dados)
import { prisma } from '@/lib/prisma';

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data: CreateUserInput) {
    return prisma.user.create({ data });
  },
};
```

### Error Handling

Sempre use o error handler centralizado. Lance erros com `AppError`:

```typescript
// Lançando erro
import { AppError } from '@/lib/errors';

throw new AppError('Mensagem clara', 400);

// No handler, será convertido para:
{
  "message": "Mensagem clara",
  "statusCode": 400
}
```

## Revisão de Código

### O que Revisar

1. **Funcionalidade**: O código faz o que deveria?
2. **Testes**: Tem testes? Cobrem os casos importantes?
3. **Segurança**: Não expõe dados sensíveis? Valida input?
4. **Performance**: Queries N+1? Cache apropriado?
5. **Legibilidade**: Código é claro e manutenível?

### Checklist do Reviewer

- [ ] Código compila sem erros
- [ ] Testes passam
- [ ] Não há vulnerabilidades de segurança
- [ ]命名ação está consistente
- [ ] Documentação foi atualizada (se necessário)
- [ ] Commits seguem Conventional Commits
- [ ] Não há console.log ou código de debug
- [ ] Error handling está adequado

### Comentários Construtivos

```markdown
# Bom:
"Sugestão: poderíamos usar memoization aqui para evitar re-renders
desnecessários. O que você acha?"

# Ruim:
"Isso está errado."
```

## Issue Labeling

### Tipos de Issues

| Label | Descrição |
|-------|-----------|
| `bug` | Problema existente que precisa ser corrigido |
| `feature` | Nova funcionalidade |
| `enhancement` | Melhoria em funcionalidade existente |
| `docs` | Documentação |
| `question` | Dúvida ou pergunta |
| `refactor` | Refatoração de código |
| `security` | Problema de segurança |
| `performance` | Melhoria de performance |

### Criando uma Issue

```markdown
## Descrição
[Descrição clara do problema ou funcionalidade]

## Passos para Reproduzir (bugs)
1. Vá para...
2. Clique em...
3. See error

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Screenshots
[Se aplicável]

## Ambiente
- OS: [ex: Ubuntu 22.04]
- Navegador: [ex: Chrome 120]
- Node: [ex: v20.10.0]
```

## Documentação

### Como Atualizar Docs

1. Documente novas APIs em JSDoc/TSDoc
2. Atualize README se houver mudanças de setup
3. Adicione examples em comments quando complexo

### Gerar Documentação HTML

A documentação da API é gerada automaticamente via Swagger/OpenAPI:

```bash
# Acesse em desenvolvimento
http://localhost:4001/docs

# Em produção, a API expõe /docs
```

### Boas Práticas de Documentação

```typescript
/**
 * Cria um novo usuário no sistema.
 *
 * @param data - Dados do usuário a ser criado
 * @returns O usuário criado (sem a senha)
 * @throws {AppError} Se o email já estiver em uso
 * @throws {AppError} Se a senha não atender aos requisitos
 *
 * @example
 * ```ts
 * const user = await createUser({
 *   email: 'usuario@exemplo.com',
 *   password: 'senha123',
 *   name: 'João Silva'
 * });
 * ```
 */
export async function createUser(data: CreateUserDTO) {
  // ...
}
```

---

Obrigado por contribuir! Em caso de dúvidas, abra uma issue ou procure no Discord da comunidade.

**Happy coding!**
