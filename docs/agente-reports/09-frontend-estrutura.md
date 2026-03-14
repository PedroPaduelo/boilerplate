# Relatório de Estrutura do Frontend

> Projeto analisado: `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/frontend-boilerplate/src`

## 1) Estrutura de Pastas

### 1.1) `features/`
- **`features/auth/`**: implementação de autenticação com tela de login, registro, formulários, hooks e estado.
  - `login.tsx`, `register.tsx`, `components/login-form.tsx`, `components/register-form.tsx`, `hooks/use-auth.ts`, `api.ts`, `store.ts`, `types.ts`, `components/protected-route.tsx`
- **`features/dashboard/`**: tela principal do dashboard, com gráficos, tabelas e chamadas de API mock.
  - `index.tsx`, `api.ts`, `types.ts`

### 1.2) `shared/`
- **`shared/components/ui/`**: componentes de UI estilo shadcn (Button, Input, Card, Select, DropdownMenu, Switch, Avatar, Label, Skeleton, Sonner, etc.).
- **`shared/components/layout/`**: `header.tsx`, `sidebar.tsx`, `index.ts`.
- **`shared/hooks/`**: hooks utilitários (`use-debounce.ts`, `use-local-storage.ts`).
- **`shared/lib/`**: utilitários (`utils.ts`, `constants.ts`) e cliente de API (`api-client.ts`).
- **`shared/types/`**: tipos globais (`common.ts`).

### 1.3) `app/`
- `main.tsx`: entrypoint React e import `App`.
- `App.tsx`: provedor `QueryClientProvider` do TanStack React Query + `RouterProvider`.
- `routes.tsx`: define rotas com `createBrowserRouter` e `ProtectedRoute`.
- `app-layout.tsx`: layout principal com `Sidebar` + `Header` + `<Outlet />`.
- `index.css`: estilos base Tailwind + variáveis CSS para tema claro/escuro.

## 2) Rotas (React Router)

### Arquivo central: `src/app/routes.tsx`
- Rotas públicas:
  - `/login` → `LoginPage`
  - `/register` → `RegisterPage`
- Rotas privadas (Wrapper `ProtectedRoute`):
  - `/` → redireciona para `/dashboard`
  - `/dashboard` → dashboard lazy loaded (`React.lazy` + `Suspense` com `Skeleton` loader)
- 404 fallback: qualquer `*` redireciona para `/dashboard`.
- Usa `ProtectedRoute` para validar token/hidratação/usuario carregado antes de renderizar.

### `ProtectedRoute` behavior
- Lê `token` e `isHydrated` do Zustand (`useAuthStore`), e `useCurrentUser` com React Query.
- Mostra skeleton enquanto não hidratado/carregando.
- Redireciona para `/login` quando token ausente ou erro de fetch.

## 3) Estado Global

### 3.1) Zustand
- Arquivo: `src/features/auth/store.ts`
- Estado persistido com `zustand/middleware`:
  - `user`, `token`, `isAuthenticated`, `isLoading`, `isHydrated`
  - Ações: `setAuth`, `setUser`, `logout`, `setLoading`, `setHydrated`
- Persistência: `name: 'auth'`, `partialize: (state)=>({token:state.token})`, `onRehydrateStorage` marca `setHydrated()`.
- `token` é sincronizado localStorage (`localStorage.setItem('token', token)` no `setAuth`).

### 3.2) TanStack Query
- Instância em `src/app/App.tsx` com `QueryClient`:
  - defaults: staleTime 30s, gcTime 5m, retry 1, refetchOnWindowFocus true; mutações retry 0.
- Uso em `src/features/auth/hooks/use-auth.ts` (
  - `useMutation` para login/register
  - `useQuery` para `auth/me`
- Uso em `src/features/dashboard/index.tsx` para múltiplas queries de métricas e tabelas.
- Query keys paramétricos (eg `['dashboard','timeSeries',dateRange]`).

## 4) API Client (axios)

### Arquivo: `src/shared/lib/api-client.ts`
- Cria `apiClient` com `baseURL` de `import.meta.env.VITE_API_URL || 'http://localhost:4001'`.
- Headers padrão: `Content-Type: application/json`.
- Interceptor request: adiciona `Authorization: Bearer ${token}` se houver token no localStorage.
- Interceptor response: ao status 401 limpa token e redireciona para `/login`.

### Consumo
- Arquivo `src/features/auth/api.ts` usa `apiClient.post('/sessions/password')`, `apiClient.post('/auth/register')`, `apiClient.get('/me')`.
- `features/dashboard/api.ts` atualmente retorna mock in-memory, sem axios.

## 5) Componentes UI (shadcn/ui, Tailwind)

### Componente padrão shadcn
- Comportamento típico de biblioteca shadcn (componentes `Button`, `Card`, `Input`, etc.) usando `cva`, `class-variance-authority`, `Slot`, `cn`.
- Componentes são reutilizados em páginas de Auth e Dashboard.

### Tailwind + CSS custom
- Arquivo: `src/app/index.css` injeta `@tailwind` e define variáveis CSS com suporte `.dark`.
- Tailwind config: `darkMode: ['class']`, `content` nos arquivos TSX, extension de cores usando CSS variables.
- Estilos de layout e Avatares, LAYOUT (header/sidebar) usam Tailwind classes utilitárias.

### UI extras
- `sonner` usado para toast notifications (`Toaster` em App, `toast.success/error` em hooks.
- Framer Motion para animações de entrada na tela de login/register e cards.
- Recharts para charts responsivos no dashboard.

## 6) Dark mode

- Suporte dark mode via CSS custom `.dark` no `index.css` com variáveis CSS.
- Tailwind `darkMode: ['class']` configurado no `tailwind.config.js`.
- O código do dashboad tem switch local `darkMode` (estado local) apenas para toggling visual; contudo, não aplica classe `.dark` no `documentElement` — a troca `darkMode` no dashboard ainda não altera o tema global (não há efeito `document.documentElement.classList.toggle('dark', darkMode)` implementado).
- Uso de classes de cor para `bg-background`, `text-foreground`, `bg-card`, etc. já são compatíveis com variáveis de tema claro/escuro.

## 7) Performance

### Otimizações existentes
- Rotas lazy-loading com `React.lazy` e `Suspense` para dashboard (reduz bundle inicial).
- React Query para cache, staleTime/gcTime controlado, evitando fetchs desnecessários.
- Skeleton placeholders para UX durante carregamento.
- Uso de `useMemo` no dashboard para filtrar/sort/paginar tabelas e reduzir recalculos.
- Chart data reduzido com amostragem condicional (se `data.length > 15`) e `useMemo`.

### Potenciais melhorias
- **Dark mode**: implementar toggle real de classe global para aproveitar variáveis CSS.
- **Cache autoManaged**: adicionar `queryClient.setDefaultOptions` mais agressivo e `keepPreviousData` para mudanças de `dateRange`.
- **Memoização de componentes**: `DataTable`, `StatCard`, `CustomTooltip`, etc. podem ser extraídos e memorizados com `React.memo` para evitar re-renders.
- **Suspense + Error Boundary**: adicionar ErrorBoundary para fallback robusto (atualmente apenas `Suspense` loader).
- **Client-side route prefetch**: `react-router` não prefetch por padrão; poderia prefetch dashboard no login.
- **API**: adicionar paginação server-side e `useInfiniteQuery` para tabelas grandes.

## 8) Arquivos mais relevantes
- `src/app/routes.tsx`
- `src/app/App.tsx`
- `src/shared/lib/api-client.ts`
- `src/features/auth/store.ts`
- `src/features/auth/hooks/use-auth.ts`
- `src/features/auth/api.ts`
- `src/features/dashboard/index.tsx`
- `src/features/dashboard/api.ts`
- `src/shared/components/ui/button.tsx`
- `src/app/index.css`
- `tailwind.config.js`
- `vite.config.ts`

---

### Conclusão
A arquitetura do frontend está organizada em features/pasta compartilhada/app e usa padrões modernos de React + Vite + Tailwind + React Query + Zustand. O fluxo de autenticação e proteção de rota está implementado, e o dashboard usa componentes customizados shadcn com gráficos e tabela interativa. O dark mode está parcialmente suportado (variáveis CSS + Tailwind), mas não há persistência global do toggle. A camada de API usa axios com interceptors e trata 401 globalmente.
