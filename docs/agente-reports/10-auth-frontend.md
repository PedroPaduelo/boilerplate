# Relatório: Módulo de Autenticação do Frontend

## Visão Geral

O módulo de autenticação do frontend está localizado em `frontend-boilerplate/src/features/auth/` e implementa login, registro e proteção de rotas usando React Router, Zustand para estado global, React Query para cache de dados, Zod para validação e Tailwind CSS para estilização.

---

## Estrutura de Arquivos

```
src/features/auth/
├── components/
│   ├── login-form.tsx      # Formulário de login
│   ├── register-form.tsx   # Formulário de registro
│   └── protected-route.tsx # Componente de proteção de rotas
├── hooks/
│   └── use-auth.ts         # Hooks personalizados (useLogin, useRegister, useCurrentUser)
├── pages/
│   ├── login.tsx           # Página de login
│   └── register.tsx        # Página de registro
├── api.ts                  # Funções de API
├── store.ts                # Zustand store para estado de autenticação
├── types.ts                # Definições de tipos TypeScript
```

---

## Páginas

### 1. Login (`pages/login.tsx`)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/login.tsx`

**Características:**
- Layout centralizado com fundo `bg-muted/50`
- Card com título "Entrar" e descrição
- Integração com componente `LoginForm`
- Link para página de registro
- Animações com Framer Motion (`fade-in-up`)

```tsx
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>Entre com seu email e senha</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Nao tem conta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
```

### 2. Register (`pages/register.tsx`)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/register.tsx`

**Características:**
- Layout idêntico ao login
- Card com título "Criar Conta"
- Integração com componente `RegisterForm`
- Link para página de login
- Animações com Framer Motion

---

## Componentes

### 1. LoginForm (`components/login-form.tsx`)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/components/login-form.tsx`

**Tecnologias:**
- `react-hook-form` para gerenciamento de formulário
- `zod` + `@hookform/resolvers/zod` para validação
- Componentes UI: `Button`, `Input`, `Label`

**Validação Zod:**
```typescript
const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
})
```

**Campos:**
| Campo | Tipo | Placeholder | Validação |
|-------|------|-------------|-----------|
| email | email | "seu@email.com" | deve ser email válido |
| password | password | "••••••••" | mínimo 6 caracteres |

**Comportamento:**
- Usa o hook `useLogin()` para submissão
- Mostra estado `isPending` no botão
- Exibe erros de validação abaixo de cada campo
- Estilo responsivo com `className="w-full"`

---

### 2. RegisterForm (`components/register-form.tsx`)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/components/register-form.tsx`

**Validação Zod:**
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
})
```

**Campos:**
| Campo | Tipo | Placeholder | Validação |
|-------|------|-------------|-----------|
| name | text | "Seu nome" | mínimo 2 caracteres |
| email | email | "seu@email.com" | email válido |
| password | password | "••••••••" | mínimo 6 caracteres |

**Nota:** O componente tem struktura idêntica ao `LoginForm` porém com campo adicional de nome.

---

### 3. ProtectedRoute (`components/protected-route.tsx`)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/components/protected-route.tsx`

**Função:** Protege rotas que exigem autenticação.

**Lógica de Proteção:**
1. **Hidratação:** Aguarda o Zustand terminar de hidratar do localStorage
2. **Token ausente:** Redireciona para `/login` salvando localização original
3. **Carregando usuário:** Mostra skeleton de carregamento
4. **Erro na consulta:** Redireciona para login (token inválido/expirado)
5. **Sucesso:** Renderiza os children

**Implementação:**
```tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, isHydrated } = useAuthStore()
  const { isLoading, error } = useCurrentUser()

  if (!isHydrated) {
    return <Skeleton loading />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isLoading) {
    return <Skeleton loading />
  }

  if (error) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

---

## Hooks (`hooks/use-auth.ts`)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/hooks/use-auth.ts`

### useLogin

```typescript
export function useLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    },
    onError: () => {
      toast.error('Email ou senha invalidos')
    },
  })
}
```

**OnSuccess:**
- Salva usuário e token no Zustand store
- Mostra toast de sucesso
- Navega para `/dashboard`
- **Nota:** Não faz redirect para localização salva (`state.from`)

**OnError:**
- Mostra toast de erro genérico (não expõe detalhes de segurança)

---

### useRegister

```typescript
export function useRegister() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Conta criada com sucesso!')
      navigate('/dashboard')
    },
    onError: () => {
      toast.error('Erro ao criar conta')
    },
  })
}
```

**Comportamento idêntico ao `useLogin`**

---

### useCurrentUser

```typescript
export function useCurrentUser() {
  const { token, setUser } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApi.getMe()
      setUser(user)
      return user
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
```

**Configuração:**
- Só executa quando há token (`enabled: !!token`)
- Sem retry automático (`retry: false`) - evita chamadas em caso de token expirado
- Cache por 5 minutos (`staleTime: 5min`)
- Atualiza o store com dados do usuário

---

## Estado Global (Zustand Store)

**Localização:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/store.ts`

### Interface do Estado

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
}
```

### Ações

| Ação | Descrição |
|------|-----------|
| `setAuth(user, token)` | Define usuário e token, marca como autenticado |
| `setUser(user)` | Atualiza apenas o usuário |
| `logout()` | Remove token e reseta estado |
| `setLoading(loading)` | Controla loading state |
| `setHydrated()` | Marca hidratação como concluída |

### Persistência

```tsx
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'auth',                    // localStorage key: "auth"
      partialize: (state) => ({ token: state.token }), // Apenas token persiste
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
```

**Detalhes da Persistência:**
- **Key:** `auth` no localStorage
- **Partialize:** Apenas `token` é persistido. `user` é recarregado via API (uso de `useCurrentUser`)
- **onRehydrate:** Callback que define `isHydrated = true` após carregar

### Armazenamento Duplicado de Token

**Observação Crítica:** O token é armazenado em DOIS locais:

1. **Zustand persist:** No localStorage via nome `auth`
2. **Direto no localStorage:** Via `localStorage.setItem('token', token)` na ação `setAuth`

Isto é redundante. O Zustand `partialize` já persiste o token no localStorage. O armazenamento manual em `store.ts`:

```typescript
setAuth: (user, token) => {
  localStorage.setItem('token', token)  // ← TOKEN ARMAZENADO AQUI TAMBÉM
  set({ user, token, isAuthenticated: true, isLoading: false })
}
```

---

## Integração com API

### Cliente HTTP (`src/shared/lib/api-client.ts`)

**Base URL:** `import.meta.env.VITE_API_URL` ou `http://localhost:4001`

**Interceptors:**

**Request:**
```ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```
Lê token diretamente do localStorage (chave `token`).

**Response:**
```ts
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
Remove token e redirecion para login em caso de 401 Unauthorized.

---

### Funções de API (`api.ts`)

```typescript
export const authApi = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/sessions/password', input)
    return data
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', input)
    return data
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/me')
    return data
  },
}
```

**Endpoints:**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/sessions/password` | Login com email/senha |
| POST | `/auth/register` | Criar nova conta |
| GET | `/me` | Obter dados do usuário autenticado |

---

## Tipos (`types.ts`)

```typescript
export interface User {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}
```

---

## Validação de Formulários

### Abordagem
- **Library:** Zod + react-hook-form
- **Schema:** Validação estrita com mensagens customizadas em português
- **Feedback visual:** Mensagens de erro exibidas abaixo de cada campo

### Regras de Validação

| Campo | Schema | Mensagem de Erro |
|-------|--------|------------------|
| Login Email | `z.string().email()` | "Email invalido" |
| Login Password | `z.string().min(6)` | "Minimo 6 caracteres" |
| Register Name | `z.string().min(2)` | "Nome deve ter no minimo 2 caracteres" |
| Register Email | `z.string().email()` | "Email invalido" |
| Register Password | `z.string().min(6)` | "Minimo 6 caracteres" |

---

## Fluxo Completo de Autenticação

### Login
1. Usuário acessa `/login`
2. Preenche formulário com email e senha
3. Validação Zod no submit
4. `useLogin` mutation executa POST `/sessions/password`
5. Sucesso:
   - Token e user salvos no Zustand
   - `localStorage` recebe token (linha 29 do `store.ts`)
   - Toast "Login realizado com sucesso!"
   - Navegação para `/dashboard`
6. Erro: Toast "Email ou senha invalidos"

### Registro
1. Usuário acessa `/register`
2. Preenche nome, email e senha
3. Validação Zod
4. `useRegister` mutation executa POST `/auth/register`
5. Sucesso/erro idêntico ao login

### Proteção de Rotas
1. Usuário acessa rota protegida (ex: `/dashboard`)
2. `ProtectedRoute` é renderizado
3. Verifica `isHydrated` do Zustand
4. Se não houver token → redirect para login
5. Se houver token, dispara `useCurrentUser()` para buscar dados
6. Enquanto carrega → mostra skeleton
7. Se erro (401) → logout e redirect para login
8. Sucesso → renderiza conteúdo protegido

---

## Pontos de Atenção / Possíveis Melhorias

### 1. Armazenamento Duplicado de Token
O token é salvo tanto no Zustand persist quanto manualmente via `localStorage.setItem('token', token)`. O código poderia ser simplificado confiando apenas no Zustand `partialize`.

**Localização:** `store.ts` linha 29

### 2. Nenhum Refresh Automático de Token
O sistema não implementa renovação automática de token (refresh tokens). Quando o token expira, o usuário é redirecionado para login sem aviso prévio.

### 3. Mensagens de Erro Genéricas
As mensagens de erro nos mutations são genéricas e não diferenciam entre:
- Credenciais inválidas
- Email já cadastrado
- Erro de servidor
- Timeout de rede

### 4. Falta de Redirect para Localização Original
O hook `useLogin` sempre navega para `/dashboard` após login. Se o usuário tentou acessar uma rota protegida, seria ideal redirecionar de volta usando `navigate(location.state?.from?.pathname || '/dashboard')`.

### 5. Loading State Global Não Utilizado
O estado `isLoading` no store é definido mas não é utilizado nos formulários. Os formulários usam `isPending` do mutation, mas não há loading global para outros cenários.

### 6. Logout Não Expõe Action no Hook
A ação `logout` existe no store mas não é exportada via hook. Seria útil ter `useAuth()` que retorne `{ user, token, logout, isAuthenticated }`.

### 7. Discussão: Token no localStorage vs Cookies
Usar localStorage para tokens tem implicações de segurança (vulnerabilidade a XSS). Considerar HttpOnly cookies em produção.

---

## Dependências Principais

| Pacote | Uso |
|--------|-----|
| `zustand` | Estado global |
| `@tanstack/react-query` | Cache e mutations |
| `react-hook-form` | Gerenciamento de formulários |
| `zod` | Validação de schemas |
| `@hookform/resolvers` | Integração Zod + RHF |
| `framer-motion` | Animações de entrada |
| `react-router-dom` | Roteamento e navegação |
| `sonner` | Toasts/notificações |
| `axios` | Cliente HTTP |
| `tailwindcss` | Estilização |
| `@shared/components/ui/*` | Componentes UI do shadcn/ui |

---

## Conclusão

O módulo de autenticação está bem estruturado, seguindo boas práticas:
- Separação clara de responsabilidades (pages, components, hooks, store, api)
- Tipagem completa com TypeScript
- Validação robusta com Zod
- Gerenciamento de estado eficiente com Zustand + React Query
- UI consistente com componentes shadcn/ui

As principais áreas de oportunidade são:
1. Consolidação do armazenamento de token
2. Melhor tratamento de erros (mensagens específicas)
3. Implementação de redirect inteligente pós-login
4. Considerar refresh tokens e storage mais seguro (cookies)
