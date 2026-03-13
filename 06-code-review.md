# Code Review - Boilerplate Project

**Data da Revisao:** 2026-03-11
**Revisor:** Staff Engineer
**Projeto:** Backend + Frontend Boilerplate (Fullstack)

---

## Resumo Executivo

O projeto e um boilerplate fullstack bem estruturado, utilizando tecnologias modernas como Fastify, Prisma, React, TypeScript, Socket.IO e BullMQ. A arquitetura segue padroes solids com separacao clara de responsabilidades.

**Avaliacao Geral:** 7.5/10

**Pontos Fortes:**
- Boas praticas de TypeScript com strict mode
- Validacao de dados com Zod em todas as rotas
- Autenticacao JWT implementada corretamente
- Arquitetura modular e bem organizada
- Frontend com state management (Zustand) e React Query
- Modo degradado para Redis (resiliencia)

**Areas Críticas:**
- Ausencia completa de testes
- Vulnerabilidades de seguranca em CORS e Socket.IO
- Ausencia de rate limiting
- Falta de sanitizacao em algumas operacoes

---

## 1. Seguranca

### 1.1 Vulnerabilidades Criticas

#### CORS Configurado de Forma Insegura (server.ts:95-98)
```typescript
app.register(fastifyCors, {
  origin: true,  // ❌ Permite qualquer origem
  credentials: true,
});
```

**Problema:** `origin: true` permite requisicoes de qualquer dominio, expondo a API a ataques CSRF e acesso nao autorizado.

**Correcao Sugerida:**
```typescript
app.register(fastifyCors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
});
```

#### Socket.IO CORS Aberto (socket.ts:12-15)
```typescript
const io = new Server(app.server, {
  cors: {
    origin: '*',  // ❌ Permite qualquer origem
    methods: ['GET', 'POST'],
  },
});
```

**Problema:** Mesma vulnerabilidade que o CORS HTTP.

**Correcao Sugerida:**
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
const io = new Server(app.server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

### 1.2 Ausencia de Rate Limiting

Nao ha protecao contra ataques de forca bruta ou DDoS. Isso e especialmente critico para:
- `/auth/login` - pode ser usado para forca bruta
- `/users` - listagem pode ser abusada
- `/users/:id` - atualizacoes excessivas

**Recomendacao:** Implementar rate limiting com `@fastify/rate-limit`:
```typescript
import rateLimit from '@fastify/rate-limit';

app.register(rateLimit, {
  max: 100, // 100 requisicoes
  timeWindow: '1 minute',
  redis: app.redis, // usar Redis para distribuicao
});
```

### 1.3 Falta de Sanitizacao em Upload

O endpoint de upload (presumido pelo uso de `fastifyMultipart`) deve sanitizar nomes de arquivos para prevenir:
- Path traversal attacks
- Sobrescrita de arquivos do sistema

**Recomendacao:**
```typescript
import { sanitizeFilename } from '@fastify/sanitize-filename-async';

// No handler de upload
const sanitizedFilename = sanitizeFilename(file.filename);
```

### 1.4 Autorizacao Insuficiente

Em `update-user.ts` e `delete-user.ts`, qualquer usuario autenticado pode modificar ou excluir qualquer outro usuario. Nao ha verificacao de permissao.

**Problema (update-user.ts:43-86):**
```typescript
async (request, reply) => {
  const { id } = request.params;
  // ❌ Qualquer usuario pode atualizar qualquer usuario
  const existingUser = await prisma.user.findUnique({ where: { id } });
```

**Correcao Sugerida:**
```typescript
async (request, reply) => {
  const currentUserId = await request.getCurrentUserId();
  const { id } = request.params;

  // Verificar se e admin OU o proprio usuario
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true }
  });

  if (currentUser?.role !== 'ADMIN' && currentUserId !== id) {
    throw new ForbiddenError('You can only update your own profile');
  }
```

### 1.5 Token JWT com Tempo de Expiracao Longo

Em `authenticate.ts:66-69`:
```typescript
const token = await reply.jwtSign(
  { sub: user.id },
  { expiresIn: '7d' }  // ⚠️ 7 dias e muito longo
);
```

**Recomendacao:** Reduzir para 1-4 horas e implementar refresh tokens.

---

## 2. Performance

### 2.1 Consultas de Banco de Dados

#### Falta de Index no Prisma Schema (schema.prisma)

O schema nao define indices para campos frequentemente consultados.

**Recomendacao:**
```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique  // ✅ Ja tem unique
  name        String?
  password    String
  role        UserRole  @default(USER)
  isActive    Boolean   @default(true) @map("is_active")
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Indices faltando
  @@index([role])
  @@index([isActive])
  @@index([createdAt])
  @@map("users")
}
```

#### Paginacao sem Limite Maximo (list-users.ts:21)
```typescript
pageSize: z.coerce.number().default(10),  // ❌ Sem limite maximo
```

**Problema:** Usuario pode requestar `pageSize: 1000000` causando lentidao.

**Correcao:**
```typescript
pageSize: z.coerce.number().min(1).max(100).default(10),
```

### 2.2 Cache e Redis

#### Modo Degradado Bem Implementado (server.ts:41-79, 154-188)

O fallback para modo degradado quando Redis nao esta disponivel e uma boa pratica de resiliencia. Porem, ha oportunidades de melhoria:

**Recomendacao:** Adicionar cache em queries frequentes:
```typescript
// Exemplo em list-users.ts
async (request, reply) => {
  const cacheKey = `users:list:${JSON.stringify(request.query)}`;

  // Tentar cache primeiro
  const cached = await redisInstance.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // ... query normal

  // Salvar no cache com TTL
  await redisInstance.setex(cacheKey, 300, JSON.stringify(result));
}
```

### 2.3 Bundle do Frontend

O frontend nao tem code splitting otimizado alem do lazy loading basico.

**Recomendacao em vite.config.ts:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

---

## 3. Legibilidade e Manutenibilidade

### 3.1 Codigo Bem Estruturado

**Pontos Positivos:**
- Separacao clara de rotas, services e middlewares
- Nomenclatura consistente
- Uso de Zod para validacao em todas as rotas
- Tipagem TypeScript rigorosa

### 3.2 Problemas de Legibilidade

#### Tipos Genericos `any` (list-users.ts:50)
```typescript
const where: any = {};  // ❌ Usar tipo correto
```

**Correcao:**
```typescript
import { Prisma } from '@prisma/client';
const where: Prisma.UserWhereInput = {};
```

#### Mensagens de Erro Genericas

Algumas mensagens de erro sao faceis de entender, mas poderiam ser mais descritivas em ambientes de producao.

### 3.3 Inconsistencias

#### Duplicacao em Store (store.ts:29, 36)
```typescript
setAuth: (user, token) => {
  localStorage.setItem('token', token)  // ✅ Boa pratica
  set({ user, token, isAuthenticated: true, isLoading: false })
},

logout: () => {
  localStorage.removeItem('token')  // ✅ Boa pratica
  set({ user: null, token: null, isAuthenticated: false })
},
```

O token e gerenciado tanto no store quanto no apiClient. Considere centralizar.

---

## 4. Best Practices

### 4.1 Boas Praticas Implementadas

| Pratica | Status | Arquivo |
|---------|--------|---------|
| Strict TypeScript | ✅ | tsconfig.json |
| Zod validation | ✅ | Todas as rotas |
| JWT auth | ✅ | auth.ts |
| HTTP status codes corretos | ✅ | error-handler.ts |
| Health check | ✅ | health-check.ts |
| Swagger/OpenAPI | ✅ | server.ts |
| Rate limiting | ❌ | Ausente |
| Input sanitization | ⚠️ | Parcial |
| Error logging | ⚠️ | Precisa melhorar |

### 4.2 Areas de Melhoria

#### Error Logging (server.ts:38)
```typescript
catch (error) {
  console.error('Error in socket connection:', error);  // ❌ Usar logger estruturado
}
```

**Recomendacao:** Usar Pino (ja dependencias do Fastify):
```typescript
import pino from 'pino';

const logger = pino({ level: 'info' });

// Substituir todos os console.error por logger.error
```

#### Configuracao de Ambiente

O `.env.example` deve incluir TODAS as variaveis necessarias com exemplos.

### 4.3 Seguranca de Dependencias

**Recomendacao:** Adicionar `npm audit` ao CI/CD.

---

## 5. Arquitetura

### 5.1 Estrutura de Pastas

```
src/
├── http/
│   ├── routes/         # ✅ Bem organizado
│   │   ├── auth/
│   │   ├── user/
│   │   └── _errors/
│   └── error-handler.ts
├── middlewares/        # ✅ Separado
├── lib/               # ✅ Configuracoes
├── services/          # ✅ Business logic
│   ├── jobs/
│   └── notification/
└── socket/            # ✅ WebSocket
```

### 5.2 DDD Patterns

O projeto segue uma estrutura proxima de DDD com:
- Routes (interface/adapters)
- Services (application/domain)
- Lib (infraestrutura)

### 5.3 Divisao Backend/Frontend

A separacao em pastas distintas (backend-boilerplate e frontend-boilerplate) e boa para deploy independente.

---

## 6. Cobertura de Testes

### 6.1 Situacao Atual

**Cobertura: 0%**

Nenhum teste foi implementado no projeto.

### 6.2 Testes Recomendados

#### Backend - Testes Unitarios

```typescript
// tests/unit/auth/authenticate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '@/http/routes/auth/authenticate';

describe('authenticate', () => {
  it('should return 401 for invalid credentials', async () => {
    // Mock do Prisma
    // Testar validacao Zod
    // Verificar resposta 401
  });

  it('should return token for valid credentials', async () => {
    // Mock do Prisma com usuario valido
    // Verificar token retornado
  });
});
```

#### Backend - Testes de Integracao

```typescript
// tests/integration/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './helpers/app';

describe('Users API', () => {
  it('should list users with pagination', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/users?page=1&pageSize=10',
      headers: { authorization: 'Bearer valid-token' }
    });
    expect(response.statusCode).toBe(200);
  });
});
```

#### Frontend - Testes de Componentes

```typescript
// tests/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/features/auth/components/login-form';

describe('LoginForm', () => {
  it('should show validation errors', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByText('Entrar'));
    await waitFor(() => {
      expect(screen.getByText('Email invalido')).toBeInTheDocument();
    });
  });
});
```

### 6.3 Ferramentas Sugeridas

| Tipo | Backend | Frontend |
|------|---------|----------|
| Unit | Vitest | Vitest |
| E2E | Supertest | Playwright |
| Coverage | c8 | Vitest coverage |
| Mock | MSW | MSW |

---

## 7. Prioridades de Correcao

### Prioridade Alta (Corrigir Imediatamente)

1. **CORS inseguro** - Vulnerabilidade critica
2. **Socket.IO CORS aberto** - Vulnerabilidade critica
3. **Falta de rate limiting** - Exposto a ataques
4. **Autorizacao ausente** - Qualquer usuario pode editar outros

### Prioridade Media (Corrigir em 1-2 Sprints)

5. **Sem testes** - Risco de regresao
6. **Indices faltando no banco** - Performance
7. **Token JWT longo** - Seguranca
8. **Paginas sem limite** - DoS

### Prioridade Baixa (Melhorias)

9. **Cache em queries** - Performance
10. **Code splitting** - Bundle size
11. **Logger estruturado** - Observabilidade

---

## 8. Conclusao

O projeto boilerplate demonstra uma base solida com boas praticas de desenvolvimento. A arquitetura e bem pensada e a estrutura de codigo e limpa. Porem, existem lacunas importantes em seguranca que precisam ser enderecadas antes de producao.

A ausencia completa de testes e uma preocupacao significativa que deve ser resolvida para garantir a qualidade e manutenibilidade do projeto a longo prazo.

**Acao Recomendada:** Corrigir os itens de prioridade alta antes de qualquer deploy para producao.

---

# Code Review - Frontend (Adendo)

**Data da Revisao:** 2026-03-11
**Revisor:** Staff Engineer
**Projeto:** Frontend Boilerplate

---

## Resumo Executivo - Frontend

O frontend e um projeto React 19 bem estruturado utilizando Vite, TypeScript, Tailwind CSS e Radix UI. A arquitetura segue padroes modernos com separation of concerns.

**Avaliacao Geral:** 8.0/10

**Pontos Fortes:**
- Boas praticas de TypeScript com strict mode
- State management com Zustand bem implementado
- React Query para data fetching
- Componentes UI com Radix UI acessiveis
- Validacao de formularios com React Hook Form + Zod
- Dark mode ready com design tokens CSS
- Lazy loading de paginas implementado

**Areas de Atencao:**
- Ausencia completa de testes
- Alguns problemas de accessibility
- SEO deficiente (sem meta tags)
- Codigo mock em producao
- Gerenciamento de localStorage duplicado

---

## 1. Accessibility (a11y)

### 1.1 Problemas Criticos

#### Editor Rico - Toolbar sem Acessibilidade
**Arquivo:** `src/shared/components/editor/rich-text-editor.tsx:43-83`

```tsx
// ❌ Botoes sem aria-label
<button
  type="button"
  onClick={() => editor.chain().focus().toggleBold().run()}
  className={cn('rounded p-2 hover:bg-muted', editor.isActive('bold') && 'bg-muted')}
>
  <strong>B</strong>
</button>
```

**Problema:** Leitores de tela nao conseguem identificar a funcao de cada botao.

**Correcao Sugerida:**
```tsx
<button
  type="button"
  onClick={() => editor.chain().focus().toggleBold().run()}
  aria-label="Negrito"
  aria-pressed={editor.isActive('bold')}
  className={cn('rounded p-2 hover:bg-muted', editor.isActive('bold') && 'bg-muted')}
>
  <strong>B</strong>
</button>
```

#### Formularios sem Associacao de Erros
**Arquivo:** `src/features/auth/components/login-form.tsx:32-63`

```tsx
// ❌ Erros nao associados aos inputs
{errors.email && (
  <p className="text-sm text-destructive">{errors.email.message}</p>
)}
```

**Correcao Sugerida:**
```tsx
<Input
  id="email"
  type="email"
  aria-describedby={errors.email ? "email-error" : undefined}
  {...register('email')}
/>
{errors.email && (
  <p id="email-error" className="text-sm text-destructive" role="alert">
    {errors.email.message}
  </p>
)}
```

#### Sidebar - navegacao sem aria-current
**Arquivo:** `src/shared/components/layout/sidebar.tsx:31-44`

```tsx
// ❌ Link ativo nao indica visualmente
<Link key={item.href} to={item.href}>
  <motion.div
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
```

**Correcao Sugerida:**
```tsx
<Link
  key={item.href}
  to={item.href}
  aria-current={isActive ? 'page' : undefined}
>
```

#### Botao de Logout sem Aria-Label
**Arquivo:** `src/shared/components/layout/sidebar.tsx:51-57`

```tsx
// ❌ Botao sem descricao para leitores de tela
<button
  onClick={logout}
  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
>
```

**Correcao Sugerida:**
```tsx
<button
  onClick={logout}
  aria-label="Sair da conta"
  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
>
```

### 1.2 Melhorias Recomendadas

| Componente | Problema | Impacto |
|------------|----------|---------|
| CardTitle | Usar heading hierarquico correto | Medio |
| LoginPage | Falta skip link | Baixo |
| Todas as paginas | Contraste de cores ok | N/A |

---

## 2. SEO

### 2.1 Problemas Identificados

#### Ausencia de Meta Tags
**Arquivo:** `frontend-boilerplate/index.html`

O arquivo index.html nao possui meta tags essenciais para SEO.

**Correcao Sugerida:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Aplicacao fullstack com React, Fastify e Prisma" />
    <meta name="theme-color" content="#ffffff" />
    <title>App - Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

#### Titulo Dinamico por Pagina
O titulo da pagina e estatico. Para SPA, recomenda-se usar um hook para atualizar o titulo baseado na rota.

**Recomendacao:**
```tsx
// src/app/hooks/use-page-title.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/login': 'Entrar',
  '/register': 'Criar Conta',
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = routeTitles[location.pathname] || 'App';
    document.title = `${title} - App`;
  }, [location]);
}
```

### 2.2 Semantic HTML

O projeto usa semantic HTML de forma geral, mas ha oportunidades de melhoria:

```tsx
// Header - usar <header>
<header className="flex h-16 items-center justify-between border-b bg-card px-6">
```

```tsx
// Sidebar - usar <nav>
<nav className="flex-1 space-y-1 p-4" aria-label="Menu principal">
```

```tsx
// Main content - ja usa <main>, bom
<main className="flex-1 overflow-auto">
```

---

## 3. Performance

### 3.1 Code Splitting

**Situacao Atual:** Lazy loading basico implementado em `routes.tsx:12-14`

**Melhoria Recomendada:**
```tsx
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          radix: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
          editor: ['@tiptap/react', '@tiptap/starter-kit'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
```

### 3.2 Componentes Nao Utilizados

#### Editor Tiptap Importado mas Nao Usado
**Arquivo:** `src/shared/components/editor/rich-text-editor.tsx`

O editor esta implementado mas nao e utilizado em nenhuma pagina. Isso aumenta o bundle com ~200KB desnecessarios.

**Recomendacao:** Remover o arquivo ou implementar uma pagina que o utilize.

#### Hook useLocalStorage Nao Utilizado
**Arquivo:** `src/shared/hooks/use-local-storage.ts`

O hook foi criado mas nunca e usado no projeto.

**Recomendacao:** Remover se nao for utilizado ou documentar para uso futuro.

### 3.3 Fetching Ineficiente

#### Protected Route Faz Fetch Desnecessario
**Arquivo:** `src/features/auth/components/protected-route.tsx`

```tsx
// ❌ Fetch /me toda vez que a pagina e acessada
const { isLoading, error } = useCurrentUser()
```

**Problema:** Se o usuario ja tem token valido no store, nao ha necessidade de refetch.

**Correcao Sugerida:**
```tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, isHydrated, user } = useAuthStore()
  const { isLoading, error } = useCurrentUser()

  if (!isHydrated) {
    return <Skeleton />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // So faz fetch se nao tiver usuario em cache
  if (!user && !isLoading) {
    return <Skeleton />
  }

  if (error) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

---

## 4. Code Smells

### 4.1 Gerenciamento Duplicado de Token

**Arquivo:** `src/features/auth/store.ts:29,36` e `src/shared/lib/api-client.ts:14`

O token e manipulado em dois lugares diferentes:
1. `store.ts` - localStorage.setItem/removeItem
2. `api-client.ts` - localStorage.getItem

**Problema:** Manutencao dificultada e potencial de bugs.

**Correcao Sugerida:**
Remover manipulacao de localStorage do store.ts e usar apenas o interceptor:

```tsx
// store.ts - remover localStorage
setAuth: (user, token) => {
  set({ user, token, isAuthenticated: true, isLoading: false })
},

logout: () => {
  set({ user: null, token: null, isAuthenticated: false })
},
```

### 4.2 Mock Data em Producao

**Arquivo:** `src/features/dashboard/api.ts:4-28`

```tsx
// ❌ Dados mock em codigo de producao
const generateTimeSeriesData = (days: number): TimeSeriesData[] => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)...
```

**Recomendacao:** Mover mocks para arquivo separado ou remover em producao.

### 4.3 Strings Hardcoded

**Arquivo:** `src/shared/components/layout/sidebar.tsx:22`

```tsx
// ❌ Nome da app hardcoded
<Link to="/" className="text-xl font-bold text-primary">
  App
</Link>
```

**Correcao:** Usar constante de `constants.ts`
```tsx
import { APP_NAME } from '@/shared/lib/constants'

<Link to="/" className="text-xl font-bold text-primary">
  {APP_NAME}
</Link>
```

### 4.4 Navigate Forcado em API Client

**Arquivo:** `src/shared/lib/api-client.ts:27`

```tsx
// ❌ Redirecionamento em interceptor de API
if (error.response?.status === 401) {
  localStorage.removeItem('token')
  window.location.href = '/login'  // ❌ Usar React Router
}
```

**Problema:** Causa full page reload desnecessario.

**Correcao Sugerida:**
```tsx
// Usar window.location so se nao houver router disponivel
// Ou implementar um event emitter para logout
if (error.response?.status === 401) {
  localStorage.removeItem('token')
  window.dispatchEvent(new CustomEvent('auth:logout'))
}
```

### 4.5 Falta de Tipagem no Componente Lazy

**Arquivo:** `src/app/routes.tsx:24-26`

```tsx
// ⚠️ children sem tipagem
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)
```

**Correcao:** Ja esta correto, apenas documentar.

---

## 5. Testes

### 5.1 Situacao Atual

**Cobertura: 0%**

Nenhum teste foi implementado no frontend. O Playwright esta configurado como dependencia mas nao ha testes.

### 5.2 Testes Recomendados

#### Testes de Componente - LoginForm
```tsx
// src/features/auth/components/__tests__/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'

describe('LoginForm', () => {
  it('deve mostrar erro com email invalido', async () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await userEvent.type(emailInput, 'email-invalido')

    const submitButton = screen.getByRole('button', { name: /entrar/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email invalido/i)).toBeInTheDocument()
    })
  })

  it('deve desabilitar botao durante submit', async () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    await userEvent.type(emailInput, 'teste@exemplo.com')
    await userEvent.type(passwordInput, '123456')
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/entrando/i)
  })
})
```

#### Testes de Hook - useAuth
```tsx
// src/features/auth/hooks/__tests__/use-auth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLogin } from '../use-auth'

// Mock do React Query
// Mock do authApi
// Mock do store

describe('useLogin', () => {
  it('deve fazer login com sucesso', async () => {
    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.mutateAsync({
        email: 'teste@exemplo.com',
        password: '123456'
      })
    })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    expect(mockToast.success).toHaveBeenCalled()
  })
})
```

### 5.3 Configuracao de Testes

O projeto ja tem as dependencias necessarias. Criar arquivos de configuracao:

```tsx
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

```tsx
// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock de React Router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}))
```

---

## 6. Best Practices

### 6.1 Boas Praticas Implementadas

| Pratica | Status | Arquivo |
|---------|--------|---------|
| Strict TypeScript | ✅ | tsconfig.json |
| React Hook Form + Zod | ✅ | Formularios |
| React Query | ✅ | Data fetching |
| Zustand | ✅ | State management |
| Radix UI | ✅ | Componentes UI |
| Tailwind CSS | ✅ | Estilizacao |
| Lazy Loading | ✅ | routes.tsx |
| Error Boundaries | ❌ | Ausente |
| Loading States | ✅ | Skeletons |
| Dark Mode Tokens | ✅ | index.css |

### 6.2 Melhorias de Arquitetura

#### Error Boundary Global
```tsx
// src/app/error-boundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="text-muted-foreground">Tente recarregar a pagina</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### Suspense com Error Boundary
```tsx
// src/app/App.tsx
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
```

---

## 7. Prioridades de Correcao - Frontend

### Prioridade Alta (Corrigir Imediatamente)

1. **Accessibility do Editor** - Aria labels nos botoes
2. **Formularios com aria-describedby** - Associar erros aos inputs
3. **Remover mock data** - Dados de demo em producao
4. **Meta tags SEO** - index.html incompleto

### Prioridade Media (Corrigir em 1-2 Sprints)

5. **Implementar testes** - Cobertura minima de 60%
6. **Code splitting otimizado** - Manual chunks no Vite
7. **Corrigir localStorage duplicado** - Manutencao
8. **Error Boundary global** - Resiliencia

### Prioridade Baixa (Melhorias)

9. **Titulo dinamico por pagina** - SEO
10. **Hook useLocalStorage** - Remover ou documentar
11. **Sidebar aria-current** - Acessibilidade
12. **Botao logout aria-label** - Acessibilidade

---

## 8. Conclusao - Frontend

O frontend demonstra uma base solida com tecnologias modernas bem escolhidas. A estrutura de codigo e limpa e as praticas de desenvolvimento estao alinhadas com o estado da arte.

Os principais pontos de atencao sao:
1. **Acessibilidade** - Precisa de Atencao especial no editor e formularios
2. **Testes** - Ausencia total
3. **SEO** - Basico demais para producao
4. **Code Smells** -Alguns problemas de arquitetura

**Acao Recomendada:** Implementar as correcoes de prioridade alta antes do deploy para producao, com foco especial em accessibility.
