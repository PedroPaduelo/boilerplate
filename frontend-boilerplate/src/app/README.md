# `src/app/` — App shell & pontos de composição (F0.5)

> **Território FECHADO da Fase 0.** As trilhas FE (T-E..T-J) **não editam**
> `providers.tsx` nem `routes.tsx`. Elas plugam features via convenção (abaixo).

## 1. Providers — `providers.tsx`

`AppProviders` é o ÚNICO ponto de composição de providers globais:

```
ErrorBoundary → ThemeProvider → QueryClientProvider → AuthProvider →
SocketProvider → children (+ Toaster)
```

Consuma via hooks, nunca re-montando providers:

- **TanStack Query**: `useQuery`/`useMutation`/`useQueryClient`. O client único
  está em `@/shared/lib/query-client` (`queryClient`) — útil também fora de
  componentes (ex.: `queryClient.setQueryData(...)` em handler de socket).
- **Auth**: `useAuthStore` (`@/features/auth/store`). O `AuthProvider`
  re-hidrata o `user` via `GET /auth/me` quando há token persistido.
- **Socket**: `useSocket()` (`@/shared/socket`). Ver seção 3.
- **Theme**: `useTheme()` (`@/components/theme/use-theme`).

## 2. Rotas por feature — `routes.tsx` + `@/shared/lib/feature-routes`

`routes.tsx` só define a casca (auth + `DashboardLayout` protegido + fallback) e
**agrega automaticamente** as rotas declaradas por cada feature via
`import.meta.glob('../../features/*/routes.tsx')`. **Sem índice central.**

Para adicionar telas, crie `src/features/<feature>/routes.tsx`:

```tsx
import type { FeatureRoutes } from '@/shared/lib/feature-routes';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

export const featureRoutes: FeatureRoutes = {
  // Filhas de "/" (dentro do DashboardLayout, atrás do ProtectedRoute):
  protected: [{ path: 'minha-tela', element: <MinhaTela /> }],
  // Nível raiz, SEM auth (ex.: share público):
  public: [{ path: '/public/:token', element: <PublicView /> }],
};
```

- `path` das protegidas é **relativo** (`dashboards`, `dashboards/:id`).
- `path` das públicas é **absoluto** (`/public/:token`).
- Use **`React.lazy` + `<Suspense fallback={<PageLoader />}>`** para telas
  pesadas (ver `features/users/routes.tsx` como exemplo canônico).
- Proteção por papel: embrulhe com
  `<ProtectedRoute requiredRole="ADMIN">...</ProtectedRoute>`.
- Navegação no menu: ajuste `NAV_GROUPS` em `app/nav-items.ts` (seção 2.1).

As rotas-esqueleto atuais (`connections`, `dashboards`, `charts`, `chat`,
`share`) renderizam `PlaceholderPage` — cada trilha substitui o
`features/<x>/routes.tsx` correspondente pela tela real.

## 2.1 Navegação lateral — `nav-items.ts` + `app-sidebar.tsx`

O menu é **dado** (`nav-items.ts`) + **tradução** (`app-sidebar.tsx`). A barra em
si é a réplica do AuditorIA, em `@/shared/ui/nav-section` (`NavSidebar`) — o
porquê de não ser o `SideNav` do Astryx está em
`docs/design-system/sidebar/CONTRATO.md` §1.

Para acrescentar uma tela ao menu, mexa **só** em `nav-items.ts`:

```ts
{
  subheader: 'Dados',
  items: [
    { href: '/minha-tela', label: 'Minha tela', icon: CatalogIcon,
      permission: 'artifacts:view' },   // ou `roles: ['ADMIN']`
  ],
}
```

- **Grupos, não lista corrida.** Hoje são três — "Visão geral" (consumo),
  "Dados" (origem) e "Gerenciamento" (o que exige poder além de olhar). A
  justificativa completa está no comentário do próprio arquivo.
- **Ícones**: sempre de `@/shared/ui/icons` (SVG real do sistema, 24×24 em
  `currentColor`). Guarde o **componente**, não o elemento — `nav-items.ts` é
  `.ts` puro.
- **RBAC**: `canSeeNavItem` filtra item a item e `visibleNavGroups` **descarta o
  grupo que ficou vazio** — senão sobra um rótulo anunciando uma seção que a
  pessoa não tem. Continua sendo defesa em profundidade: o backend é a
  autoridade e a rota ainda passa pelo `RequireRole`.
- **Rota ativa** é calculada em `app-sidebar.tsx` por **segmento**
  (`=== href` ou `href + '/'`), nunca por `startsWith` puro — `/chartsomething`
  não pode acender "Gráficos".
- **Recolhida (88px)** o rodapé mostra só o avatar; o nome do usuário continua
  sendo o nome acessível do gatilho (`UserMenu isCompact`).
- **No celular** a barra vira gaveta, e a gaveta leva as MESMAS zonas da coluna
  (topo, lista e rodapé) — o que ela não desenha é a caixa. Ou seja, o menu da
  conta e o "Sair" continuam no rodapé em qualquer largura; não há cópia no
  `TopNav`.
- **Enquadramento do rodapé** (margem, linha, centragem na forma mini) é da
  barra, em `nav-section.css`. O `UserMenu` devolve só o gatilho — se ele
  precisar de respiro diferente, o ajuste é lá, não aqui.

## 3. Socket.IO — `@/shared/socket`

`SocketProvider` (em `AppProviders`) conecta quando autenticado; o token JWT vai
no handshake (lido do store). Use `useSocket()`:

```tsx
const { getSocket, joinDashboard, leaveDashboard, connected } = useSocket();

useEffect(() => {
  joinDashboard(dashboardId);
  return () => leaveDashboard(dashboardId);
}, [dashboardId]);

useEffect(() => {
  const s = getSocket();
  if (!s) return;
  s.on(SOCKET_EVENTS.BLOCK_DATA, (p) => {
    queryClient.setQueryData(['block-data', p.blockId, filtersHash], p.result);
  });
  return () => {
    s.off(SOCKET_EVENTS.BLOCK_DATA);
  };
}, [connected]);
```

- `SOCKET_EVENTS` e os tipos de payload vêm de `@dashboards/contracts` (fonte
  única). As salas são `dashboard:{id}` (o BE deriva de `dashboardRoom(id)`).
- **Nunca** acesse `getSocket()` durante o render — só em effects/handlers.

## O que NÃO mexer

- `app/providers.tsx`, `app/routes.tsx` — fechados na Fase 0.
- `shared/socket/*`, `shared/lib/query-client.ts`, `features/auth/auth-provider.tsx`
  — infra de provider. Consuma via hooks.
