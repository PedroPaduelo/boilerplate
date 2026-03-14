# Relatrio completo das Features do Frontend

## Estrutura Geral

O projeto utiliza a arquitetura **Feature-based** (baseada em domnio), onde cada feature  autnoma e contm todos os arquivos necessrios:
- Componentes de UI
- Hooks customizados
- API calls
- Types/Tipos
- State Management (stores)

**Localizao:** `/frontend-boilerplate/src/features/`

**Features identificadas:**
1. `auth` - Sistema de autenticao
2. `dashboard` - Painel principal com grficos e estatsticas

---

## 1. Feature Auth

**Propsito:** Gesto completa de autenticao de usurios, incluindo login, registro e proteo de rotas.

**Localizao:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/auth/`

### 1.1. Tipos e Interfaces

**Arquivo:** `types.ts`

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

### 1.2. API Calls

**Arquivo:** `api.ts`

Retorna um objeto com funes de API usando `apiClient` configurado:

- `login(input: LoginInput)` - POST `/sessions/password`
- `register(input: RegisterInput)` - POST `/auth/register`
- `getMe()` - GET `/me`

### 1.3. State Management (Zustand)

**Arquivo:** `store.ts`

Store usando Zustand com persistncia no localStorage:

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setHydrated: () => void
}
```

**Caractersticas:**
- Persistncia com nome `auth` no localStorage
- `isHydrated` para evitar problemas de hidratao com SSR
- Token salvo diretamente no localStorage e no store

### 1.4. Hooks Customizados

**Arquivo:** `hooks/use-auth.ts`

#### `useLogin()`
- Retorna `useMutation` do React Query
- Realiza login e atualiza o store de auth
- Navega para `/dashboard` no sucesso
- Exibe toast de erro/sucesso com `sonner`

#### `useRegister()`
-Similar ao `useLogin` mas para registro

#### `useCurrentUser()`
- `useQuery` para buscar dados do usurio atual
- Dependncia: `!!token`
- Atualiza o store com `setUser`
- Configuraes: `retry: false`, `staleTime: 5min`

### 1.5. Componentes

#### Pginas

**`login.tsx`** - Pgina de login com animao Framer Motion
- Utiliza `LoginForm`
- Link para registro

**`register.tsx`** - Pgina de registro
- Utiliza `RegisterForm`
- Link para login

#### Componentes de Formulrio

**`components/login-form.tsx`**
- Form com `react-hook-form` + `zod` para validao
- Schema: email (vido) + password (mnimo 6 caracteres)
- Campos: email, password
- Loading state com disabled no submit

**`components/register-form.tsx`**
- Schema: name (mnimo 2), email (vido), password (mnimo 6)
- Campos: nome, email, senha

#### Componentes Auxiliares

**`components/protected-route.tsx`**
- Wrapper que protege rotas autenticadas
- Verifica `token`, `isHydrated` e `error` do `useAuthStore`
- Mostra skeleton durante carregamento
- Redireciona para `/login` se no autenticado ou erro

### 1.6. Fluxo de Dados

```
Leitura das Pginas (login/register)
  V
Requisio ao API (authApi)
  V
Response (authApi response)
  V
Hook Mutation (useLogin/useRegister.onSuccess)
  V
Atualizao do Store (useAuthStore.setAuth)
  V
Redirecionamento (useNavigate to /dashboard)
  V
useCurrentUser carrega dados completa


```

### 1.7. Tecnologias Utilizadas

- **Zustand** - State management com persistncia
- **TanStack Query** - Cache e server state
- **React Hook Form** - Formulrios performticos
- **Zod** - Validao de schemas
- **Sonner** - Toast notifications
- **Framer Motion** - Animaes

---

## 2. Feature Dashboard

**Propsito:** Exibio de statisticas, grficos e tabela de atividade do sistema.

**Localizao:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src/features/dashboard/`

### 2.1. Tipos e Interfaces

**Arquivo:** `types.ts`

```typescript
export interface DashboardStats {
  totalUsers: number
  totalAgents: number
  totalConversations: number
  totalTokens: number
  activeUsers: number
  avgSessionDuration: number
  conversionRate: number
}

export interface TimeSeriesData {
  date: string
  value: number
  users?: number
  conversations?: number
  tokens?: number
}

export interface ChartData {
  name: string
  value: number
  fill?: string
}

export interface DataTableItem {
  id: string
  user: string
  email: string
  agent: string
  status: 'active' | 'inactive' | 'pending'
  lastActivity: string
  tokens: number
}

export interface FilterOptions {
  dateRange: '7d' | '30d' | '90d' | '1y'
  status: string[]
  agent?: string
  search?: string
}
```

### 2.2. API Calls

**Arquivo:** `api.ts` - Dados mockados com timeouts simulados:

```typescript
export const dashboardApi = {
  getStats: Promise<DashboardStats>                    // 800ms delay
  getTimeSeriesData: (range) => Promise<TimeSeriesData[]>  // 600ms, gera dados baseado no range
  getAgentDistribution: Promise<ChartData[]>           // 400ms
  getActivityByHour: Promise<ChartData[]>              // 400ms, 24 horas
  getTableData: Promise<DataTableItem[]>               // 700ms, 50 itens
  getTopAgents: Promise<ChartData[]>                   // 300ms
}
```

### 2.3. Componentes Principais

**`index.tsx`** - Pgina principal do dashboard

#### Componentes Internos:

**`StatCard`** - Card de KPI com:
- Ttulo, value, cone
- Trend (up/down) com valor
- Animaao com Framer Motion
- Animao de entrada atrasada pelo `delay`

**`TimeSeriesChart`** - Grfico de rea (Area Chart) com:
- Grfico responsivo com `ResponsiveContainer`
- Dados otimizados (max 15 pontos via downsampling)
- Gradiente customizado
- Tooltip customizado
- Formatao pt-BR

**`DonutChart`** - Grfico de pizza com buraco (Pie Chart innerRadius)
- Cores customizadas via props
- Tooltip e Legend

**`BarChartComponent`** - Grfico de barras
- Cores por barra via `fill`
- Tooltip customizado

**`DataTable`** - Tabela completa com:
- Filtros: busca por texto, filtro de status
- Ordenao por colunas (clique no header)
- Paginao (10 itens/pgina)
- Exportao CSV
- Dropdown menu por linha
- Skeleton loading

**`StatusBadge`** - Badge com cores condicionais:
- `active` - verde (Ativo)
- `inactive` - cinza (Inativo)
- `pending` - ambar (Pendente)

**`ChartSkeleton`** - Skeleton de carregamento para grficos

**`CustomTooltip`** - Tooltip reutilizvel para todos os grficos
- Formatao pt-BR
- Design glassmorphism

### 2.4. Principais Hooks e Consultas

**React Query Queries** (todas na pgina principal):

| Query Key | Funo | Finalidade |
|-----------|------|------------|
| `['dashboard','stats']` | getStats | KPIs principais |
| `['dashboard','timeSeries', dateRange]` | getTimeSeriesData | Grfico de uso no tempo |
| `['dashboard','agentDistribution']` | getAgentDistribution | Grfico de distribuio |
| `['dashboard','activityByHour']` | getActivityByHour | Atividade por hora |
| `['dashboard','topAgents']` | getTopAgents | Top agents |
| `['dashboard','tableData']` | getTableData | Tabela detalhada |

**Estados locais:**
- `dateRange` - controla o perodo dos grficos
- `darkMode` - toggle de tema (s visual, no persistido)

### 2.5. Fluxo de Dados

```
DashboardPage renderiza
  V
Monta queries do React Query
  V
Cada query chama dashboardApi correspondente
  V
Dados mockados retornados
  V
StatCards preenchidos com stats
  V
Grficos renderizados com dados correspondentes
  V
Tabela renderizada com dados e funcionalidades de UI
```

### 2.6. Tecnologias Utilizadas

- **Recharts** - Grficos (Area, Pie, Bar)
- **React Query** - Gerenciamento de server state
- **Framer Motion** - Animaes
- **Shadcn/ui** - Componentes base (Card, Button, Input, Select, Skeleton, etc.)
- **Lucide React** - cones

---

## 3. Resumo da Arquitetura

### Features vs. Global

| Feature | State Local | API | Components | Types |
|---------|-------------|-----|------------|-------|
| auth | Zustand store (persist) | authApi | Login/Register pages + forms | Login/Register/User/AuthResponse |
| dashboard | React Query cache | dashboardApi | Charts + Table + Cards | Stats/TimeSeries/ChartData/DataTableItem |

### Padro Implementado

Cada feature segue este padro:
1. `types.ts` - interfaces TypeScript
2. `api.ts` - funes de chamada de API
3. `store.ts` (opcional) - Zustand store
4. `hooks/` - hooks customizados com React Query mutations/queries
5. `components/` - componentes reutilizveis
6. Pginas principais em `index.tsx` ou nome da feature

### Shared Layer

A feature usa componentes compartilhados de:
- `@/shared/components/ui/*` - Shadcn UI components
- `@/shared/lib/api-client` - Cliente HTTP configurado

---

## 4. Observaes de Segurana

- Token armazenado no localStorage (vulnervel a XSS)
- Falta de refresh token
- Requer implementao real de API (atualmente mockado)

---

## Arquivos Relevantes

| Feature | Arquivos |
|---------|----------|
| auth | `/features/auth/types.ts`, `/features/auth/store.ts`, `/features/auth/hooks/use-auth.ts`, `/features/auth/api.ts`, `/features/auth/login.tsx`, `/features/auth/register.tsx`, `/features/auth/components/` |
| dashboard | `/features/dashboard/types.ts`, `/features/dashboard/api.ts`, `/features/dashboard/index.tsx` |
