# Mapa do `frontend-boilerplate/` para aplicação do Design System shadcn

> **Escopo**: somente leitura. Stack Vite + React 19 + Tailwind v4 + react-router 7.
> Tema atual: `slate` (shadcn), já em **oklch** com `light/dark` via `.dark`.
> Tailwind v4 — tokens via `@theme inline` no CSS (sem `tailwind.config.*`).

---

## 1) Estilos / Tema (CSS global)

**Único arquivo CSS**: `src/app/index.css` (219 linhas).
**Importado em**: `src/app/main.tsx:3` (`import './index.css';`).

Estrutura do CSS:

| Bloco (linhas)                      | Conteúdo                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `@import 'tailwindcss';`            | Plugin do Tailwind v4                                                                 |
| `@import 'tw-animate-css';`         | Animações utilitárias (data-state do Radix etc.)                                      |
| `@custom-variant dark (&:is(.dark *))` | Permite usar `dark:bg-...` com a classe `.dark` na raiz                          |
| `:root { … }` (L13–47)              | Tokens **light** em `oklch` (slate-neutral)                                           |
| `.dark { … }` (L49–88)              | Tokens **dark** em `oklch` (slate-neutral invertido)                                  |
| `@theme inline { … }` (L90–132)     | Mapeia `--color-*` → `--*` (consumidos como `bg-background`, `text-foreground` etc.)  |
| `@layer base { * { @apply border-border outline-ring/50 } … }` (L134–) | Reset + body             |

**Tokens de cor atuais (light — `:root`)**:

| Token                              | Valor                            |
| ---------------------------------- | -------------------------------- |
| `--background`                     | `oklch(1 0 0)` (branco puro)     |
| `--foreground`                     | `oklch(0.145 0 0)` (quase preto) |
| `--card`                           | `oklch(1 0 0)`                   |
| `--card-foreground`                | `oklch(0.145 0 0)`               |
| `--popover` / `--popover-foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` |
| `--primary`                        | `oklch(0.205 0 0)`               |
| `--primary-foreground`             | `oklch(0.985 0 0)`               |
| `--secondary`                      | `oklch(0.97 0 0)`                |
| `--secondary-foreground`           | `oklch(0.205 0 0)`               |
| `--muted`                          | `oklch(0.97 0 0)`                |
| `--muted-foreground`               | `oklch(0.556 0 0)`               |
| `--accent` / `--accent-foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` |
| `--destructive`                    | `oklch(0.577 0.245 27.325)`      |
| `--destructive-foreground`         | `oklch(0.985 0 0)`               |
| `--border`                         | `oklch(0.922 0 0)`               |
| `--input`                          | `oklch(0.922 0 0)`               |
| `--ring`                           | `oklch(0.708 0 0)`               |
| `--chart-1`…`--chart-5`            | Tons diferenciados (laranja, ciano, azul, amarelo, vermelho) |
| `--sidebar*`                       | Mesma família slate-neutral; sidebar-primária usa accent no dark |

**Dark (`.dark`)** — Inverte os pares `background/foreground`, `card`, `popover`, etc.
Importante: `--border` vira `oklch(1 0 0 / 10%)` (overlay com alpha),
`--input` vira `oklch(1 0 0 / 15%)`, `--chart-1` é um **violeta-azulado**
(`oklch(0.488 0.243 264.376)`) — único token com chroma de cor real no dark.

**Raios** (L131–134 do `@theme inline`):
`--radius-sm/md/lg/xl` derivados de `--radius: 0.625rem`.

**Body font stack** (L135–141): sem `@font-face`, usa a **stack do sistema**
(`ui-sans-serif, system-ui, …`). Não há **nenhuma** fonte custom (sem Inter, Geist, etc.).
`src/assets/react.svg` é apenas o logo padrão do React — não é fonte.

---

## 2) `components.json`

`frontend-boilerplate/components.json` (449 B):

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/shared/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  }
}
```

> Observação: `tailwind.config` está **vazio** (`""`) — coerente com Tailwind v4, que não usa JS config. O `css` aponta para `src/app/index.css`. `baseColor: "slate"` bate com os tokens atuais. Sem prefixo.

---

## 3) Tailwind

- **Versão**: **v4** (`tailwindcss@^4.3.1`, `@tailwindcss/vite@^4.3.1`).
- **Plugin Vite**: `vite.config.ts:4` → `import tailwindcss from '@tailwindcss/vite';`, registrado em `plugins: [react(), tailwindcss()]`.
- **Config via CSS**: `@theme inline { … }` em `src/app/index.css:90–132`. **Não existe** `tailwind.config.{js,ts,cjs,mjs}` no repo (verificado por `find` e grep).
- **`postcss`**: está nas deps (`postcss@^8.5.6`) mas **não há `postcss.config.*`** — toda a config passa pelo plugin do Vite.
- **`autoprefixer`** está nas deps mas é redundante no v4 (Vite já injeta).
- **Plugins/animações**: `tw-animate-css@^1.4.0` (substituto moderno do `tailwindcss-animate`, que **também está nas deps mas é legado**). O CSS importa **só** `tw-animate-css`.
- **Aliases**: `vite.config.ts:43` (`'@': path.resolve(__dirname, './src')`) + `tsconfig.app.json` (`paths: { "@/*": ["./src/*"] }`).

---

## 4) Dark mode

**Toggle**: classe `.dark` em `document.documentElement` (`<html>`).

**Providers / arquivos** (`src/components/theme/`):

- `theme-context.ts` — `createContext` com `theme: 'dark' | 'light' | 'system'` + `resolvedTheme`.
- `theme-provider.tsx` — Provider React. Lê `localStorage.getItem('theme')` no init,
  persiste em `localStorage`, escuta `prefers-color-scheme` quando `theme === 'system'`,
  e faz `document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')`.
- `theme-toggle.tsx` — Botão sol/lua (lucide) que alterna entre `'light'` e `'dark'`
  (não passa por `'system'`).
- `use-theme.ts` — Hook que lê o context.

**Anti-flash (importante)** — `src/app/main.tsx:6–10` aplica o tema **antes do render**:

```ts
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = saved === 'dark' || (saved === 'system' && prefersDark);
document.documentElement.classList.toggle('dark', isDark);
```

**Onde é usado**:
- `src/app/App.tsx:14` — `<ThemeProvider defaultTheme="light">` envolvendo o app.
- `src/app/dashboard-layout.tsx:7, 50` — `<ThemeToggle />` exibido no topbar.
- `src/components/ui/tree.tsx:84, 132` — `useTheme()` injeta `resolvedTheme` no `data-theme`
  e `colorScheme` da `@pierre/trees` (FileTree lib).

---

## 5) Inventário de UI

> **Não existe `src/shared/ui`** — os primitivos vivem em `src/components/ui/` (31 arquivos, **divergência em relação a FSD canônico**, que os poria em `shared/ui`).
> Alias do shadcn `@/components/ui` aponta para essa pasta.

### Primitivos shadcn "puros" (instalados a partir do registry)

| Componente                | Arquivo                                        | Base / fonte                                  |
| ------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `Button` + variants       | `button.tsx`, `button-variants.ts`             | Slot (`@radix-ui/react-slot`) + CVA           |
| `Badge` + variants        | `badge.tsx`, `badge-variants.ts`               | Slot + CVA                                    |
| `Card` (`Card*` group)    | `card.tsx`                                     | HTML puro                                     |
| `Input`                   | `input.tsx`                                    | HTML puro                                     |
| `Avatar` (`Avatar*`)      | `avatar.tsx`                                   | `@radix-ui/react-avatar`                      |
| `Separator`               | `separator.tsx`                                | `@radix-ui/react-separator`                   |
| `Skeleton`                | `skeleton.tsx`                                 | HTML puro                                     |
| `DropdownMenu` (grupo completo) | `dropdown-menu.tsx`                       | `@radix-ui/react-dropdown-menu`               |
| `Tabs`                    | `tabs.tsx`                                     | `@radix-ui/react-tabs`                        |
| `Tooltip` (`Tooltip*`)    | `tooltip.tsx`                                  | `@radix-ui/react-tooltip`                     |
| `Toaster` (Sonner)        | `sonner.tsx`                                   | `sonner`                                      |

### "Composições" / blocos específicos (instalados provavelmente via registry da Vitrine UI)

| Componente                  | Arquivo                                          | Notas                                                          |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `KpiCard`                   | `kpi-card.tsx`                                   | Aceita `delta`, ícone, prefix/suffix. Tem cor hardcoded (ver §9). |
| `StatTile`                  | `stat-tile.tsx`                                  | Variação compacta do KpiCard. Mesmas cores hardcoded.          |
| `Section` / `SectionHeader` | `section.tsx`                                    | Animação motion com stagger por `index`.                       |
| `DashboardTopbar`           | `dashboard-topbar.tsx`                           | Topbar configurável (título + busca + ações + menu mobile).    |
| `DashboardSidebarNav`       | `dashboard-sidebar-nav.tsx`                      | Sidebar de navegação (items + brand + footer).                 |
| `ActivityFeed`              | `activity-feed.tsx`                              | Lista de eventos com Avatar + Badge + tempo relativo.          |
| `AnimatedNumber` / `AnimatedScore` | `animated-number.tsx`                      | Slot-machine number (motion). **`AnimatedScore` usa hex hardcoded.** |
| `AnimatedTooltip` (+ types) | `animated-tooltip.tsx`, `animated-tooltip-types.ts` | Avatares em fileira com tooltip. Tem `sky-500`/`emerald-500`/`black` hardcoded. |
| `GitHubContributions`       | `github-contributions.tsx`                       | Heatmap. Suporta 3 `colorScale`s — duas usam **`green-*`/`blue-*` Tailwind hardcoded**. |
| `TOCMinimap` (+ variants)   | `toc-minimap.tsx`, `toc-minimap-variants.ts`    | Índice de seção com progress bar + scroll-spy.                 |
| `Tree` (+ types + variants) | `tree.tsx`, `tree-types.ts`, `tree-variants.ts`  | Wrapper sobre `@pierre/trees` (lib third-party). Reage ao tema. |
| `TableFluid` (grupo)        | `table-fluid.tsx`                                | Tabela com hover background via `motion` + `use-proximity-hover`. |
| `UpgradeCard`               | `upgrade-card.tsx`                               | Card de CTA para upgrade.                                      |

### Barrel

`src/components/ui/index.ts` re-exporta **tudo** (incluindo os `*-variants.ts` e os arquivos de types). É o que `import { Button, Card, … } from '@/components/ui'` resolve.

### Dependências de Radix instaladas (disponíveis, **mas sem wrapper `ui/` próprio** ainda)

`accordion`, `alert-dialog`, `checkbox`, `dialog`, `label`, `popover`, `progress`,
`radio-group`, `scroll-area`, `select`, `slider`, `switch`. **Nenhum wrapper em
`components/ui/`** para esses — para usar, é preciso rodar `shadcn add`.

---

## 6) Páginas / rotas / features

Roteamento (`src/app/routes.tsx`) usa `createBrowserRouter` + `RouterProvider`.

| Path         | Componente                          | Loader                                  | Auth          |
| ------------ | ----------------------------------- | --------------------------------------- | ------------- |
| `/login`     | `LoginPage` (`features/auth/login`) | direto                                  | público       |
| `/register`  | `RegisterPage` (`features/auth/register`) | direto                            | público       |
| `/`          | `DashboardLayout` (`app/`)          | direto                                  | `<ProtectedRoute>` |
| `/` (index)  | `<Navigate to="/users" replace />`  | —                                       | herda         |
| `/overview`  | `SaasDashboard` (`compositions/`)   | `lazy()` + `<Suspense>`                 | herda         |
| `/users`     | `UsersPage` (`features/users/`)     | `lazy()` + `<Suspense>`                 | herda         |
| `*`          | `<Navigate to="/users" replace />`  | catch-all                              | —             |

### Camadas existentes (FS**D-like**, com divergências)

```
src/
├── app/           # entrypoint, layout shell, CSS, router, error boundary, sidebar do shell
│   ├── main.tsx, App.tsx, routes.tsx
│   ├── dashboard-layout.tsx, app-sidebar.tsx
│   ├── error-boundary.tsx
│   └── index.css                       # ÚNICO CSS do app
├── components/    # ⚠️ NÃO-canônico para FSD — usado aqui como "ui kit" global
│   ├── theme/      (theme-provider, theme-toggle, use-theme, theme-context)
│   └── ui/         (31 arquivos — ver §5)
├── compositions/  # Telas compostas (Vitrine UI)
│   └── saas-dashboard.tsx               # 600 linhas — dashboard "Vitrine UI" instalado via registry
├── features/      # Camada de feature (FSD-style)
│   ├── auth/       (login.tsx, register.tsx, store.ts, types.ts, api.ts,
│   │                components/{login-form,register-form,protected-route},
│   │                hooks/use-auth.ts)
│   └── users/      (index.tsx → UsersPage, types.ts, api.ts [mock!],
│                    hooks/use-users.ts)
├── shared/        # Utilitários compartilhados
│   ├── lib/        (utils.ts, constants.ts, env.ts, font-weight.ts,
│   │                springs.ts, api-client.ts)
│   ├── hooks/      (use-debounce, use-local-storage, use-proximity-hover)
│   ├── types/      (common.ts)
│   └── components/ (VAZIO — ver §9)
└── test/setup.ts
```

### `UsersPage` (`features/users/index.tsx`)

KPIs + tabela de usuários, busca debounced (300 ms), badges de role/status,
mock API local (`features/users/api.ts` — gera 20 usuários aleatórios em
memória, sem backend). Hooks TanStack Query.

### `SaasDashboard` (`compositions/saas-dashboard.tsx`)

Dashboard denso com `DashboardSidebarNav` próprio, `DashboardTopbar` próprio,
KPIs, **heatmap de contribuições do GitHub**, feed de atividade, tabelas com tabs
(clientes / canais). É uma "tela vitrine" — não usa o auth store.

---

## 7) Entrypoint & Router

### Cadeia

```
index.html
  └─ <script type="module" src="/src/app/main.tsx"></script>
       └─ src/app/main.tsx
            ├─ aplica tema pre-render (anti-flash)
            └─ createRoot → <StrictMode><App /></StrictMode>
                 └─ src/app/App.tsx
                      └─ <ErrorBoundary>
                           <ThemeProvider defaultTheme="light">
                             <QueryClientProvider client={queryClient}>
                               <RouterProvider router={router} />
                               <Toaster position="top-right" richColors />
                             </QueryClientProvider>
                           </ThemeProvider>
                        </ErrorBoundary>
                           └─ router (createBrowserRouter) → DashboardLayout | Login | Register
```

### Shell (`DashboardLayout` em `src/app/dashboard-layout.tsx`)

```
flex h-screen overflow-hidden bg-background text-foreground
├─ <AppSidebar collapsed onToggleCollapsed />     ← /src/app/app-sidebar.tsx (não usa @/components/ui/sidebar)
│   ├─ brand + TooltipProvider
│   ├─ nav (2 itens: /overview, /users) — Botões com lucide
│   └─ footer (Logout + recolher)
└─ coluna direita
    ├─ <DashboardTopbar title actions>
    │   └─ <ThemeToggle /> | user info + <Avatar />
    └─ <main><div max-w-1760><Outlet /></div></main>
```

`AppSidebar` (em `app/`, **não em `components/ui/`**) é um componente "shell" —
diferente do `DashboardSidebarNav` (em `components/ui/`) que é reutilizável.
Há **dois** componentes de sidebar no projeto — divergência a observar (ver §9).

---

## 8) `package.json` — deps relevantes

### Runtime (principais)

| Pacote                                  | Versão      | Uso                                              |
| --------------------------------------- | ----------- | ------------------------------------------------ |
| `react` / `react-dom`                   | `^19.2.4`   | React 19                                         |
| `react-router-dom`                      | `^7.12.0`   | Roteamento v7 (data router)                      |
| `@tanstack/react-query`                 | `^5.90.16`  | Cache de dados (auth + users)                    |
| `vite`                                  | `^8.0.0`    | Bundler                                          |
| `@vitejs/plugin-react`                  | `^6.0.1`    | React Refresh / JSX                              |
| `tailwindcss`                           | `^4.3.1`    | **v4**                                           |
| `@tailwindcss/vite`                     | `^4.3.1`    | Plugin v4 para Vite                              |
| `tw-animate-css`                        | `^1.4.0`    | Animações (substituto moderno do `tailwindcss-animate`) |
| `tailwindcss-animate`                   | `^1.0.7`    | **LEGADO** — ainda nas deps, mas não usado       |
| `class-variance-authority`              | `^0.7.1`    | Variantes (`cva`) — usado em 4 arquivos `*-variants.ts` |
| `tailwind-merge` + `clsx`               | `^3.4.0` / `^2.1.1` | `cn()` em `shared/lib/utils.ts`            |
| `lucide-react`                          | `^0.468.0`  | Ícones (`iconLibrary` no `components.json`)      |
| `framer-motion` **e** `motion`          | `^12.24.12` / `^12.40.0` | Animações (`motion/react` é o que está sendo usado no código) |
| `sonner`                                | `^2.0.7`    | Toasts                                           |
| `axios`                                 | `^1.13.2`   | HTTP client (com token-interceptor do auth store)|
| `socket.io-client`                      | `^4.8.3`    | **Instalado, mas sem uso no código atual**        |
| `zustand`                               | `^5.0.9`    | `useAuthStore` com middleware `persist`          |
| `react-hook-form` + `@hookform/resolvers` | `^7.70.0` / `^5.2.2` | Forms (login, register)              |
| `zod`                                   | `^4.3.6`    | Schemas (env + forms)                            |
| `date-fns`                              | `^4.1.0`    | **Instalado, mas `formatDate` usa `Intl`**       |
| `@pierre/trees`                         | `^1.0.0-beta.4` | Componente `Tree` (`FileTree` wrapper)        |
| `@radix-ui/react-*`                     | vários      | 16 pacotes Radix (ver §5)                        |
| `cmdk`                                  | `^1.1.1`    | **Instalado, sem uso**                           |
| `autoprefixer`, `postcss`, `esbuild`    | vários      | `autoprefixer` é redundante no TW v4             |

### Dev

`vitest@^4.1.0`, `@testing-library/{react,jest-dom,user-event}`,
`@playwright/test`, `eslint@^9.39.1`, `typescript@~5.9.3`, `prettier@^3.4.0`,
`husky@^9.1.7`, `commitlint@^19.6.0`, `lint-staged@^15.2.10`.

> **Não há `recharts`** nem `chart.js` — os gráficos da `SaasDashboard`
> (KPI, heatmap) são **todos custom** (motion + Tailwind), não há libs de chart.

---

## 9) Gotchas

### Cores hardcoded (fora dos tokens semânticos)

| Onde                                                          | O quê                                                                                              | Sugestão                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/components/ui/kpi-card.tsx:65–72`                        | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` / `bg-rose-500/10 text-rose-600 dark:text-rose-400` | Criar tokens semânticos `--success`, `--success-fg`, `--danger`, `--danger-fg` (oklch) |
| `src/components/ui/stat-tile.tsx:69–76`                       | **mesmas classes hardcoded** do KpiCard                                                             | Idem                                                                     |
| `src/components/ui/github-contributions.tsx:37–53`            | `bg-green-{200,400,500,700}` e `bg-blue-{200,400,500,700}` (paleta inteira Tailwind, sem tokens)   | Aceitável se for um widget "brand-github" deliberado. Caso contrário, criar `--heat-1..4` (oklch) |
| `src/components/ui/animated-tooltip.tsx:81, 83`               | `bg-black`, `from-emerald-500`, `via-sky-500` (efeito visual do tooltip)                           | Considerar `bg-popover-foreground` ou tokens próprios `--tooltip-*`      |
| `src/components/ui/animated-number.tsx:83–85`                 | `#fff`, `#37ff1a`, `#ff1a4b` (cores literais para `AnimatedScore`)                                | Mover para tokens `--score-neutral/-up/-down` em `oklch`                 |

### Divergências vs. FSD canônico

1. **`src/components/ui/` em vez de `src/shared/ui/`** — o `components.json`
   aponta `@/components/ui` e o barrel está aqui, não em `shared/`. A pasta
   `shared/components/` existe mas **está vazia**.
2. **`src/components/theme/` em vez de `src/shared/theme/`** — provider, hook,
   toggle e context. Mesmo motivo acima.
3. **Sidebar duplicada**:
   - `src/app/app-sidebar.tsx` — sidebar "shell" (colapsável, persistida, com TooltipProvider e botões).
   - `src/components/ui/dashboard-sidebar-nav.tsx` — sidebar "vitrine" (brand slot, footer slot).
     Ambos exportam algo tipo "sidebar"; nenhum reusa o outro. O `SaasDashboard` usa o segundo.
4. **Dois sistemas de cor coexistem**:
   - Tokens semânticos (`bg-background`, `text-foreground`, etc.) — maioria dos arquivos.
   - Paleta Tailwind crua (`emerald-*`, `rose-*`, `green-*`, `blue-*`, `sky-*`) — 4 arquivos de UI (ver tabela acima).
5. **`@radix-ui/react-*` packages instalados sem wrapper shadcn** para: `accordion`, `alert-dialog`, `checkbox`, `dialog`, `label`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `slider`, `switch`. Para usar, é preciso rodar `npx shadcn add <componente>`.
6. **`tailwindcss-animate` nas deps mas não usado** — substituído por `tw-animate-css`. Pode ser removido.
7. **`socket.io-client`, `cmdk`, `date-fns`** instalados mas não referenciados no código atual — pendentes de uso.
8. **`autoprefixer` redundante** com Tailwind v4 + Vite plugin.
9. **`postcss` instalado sem config** — funciona via plugin do Vite, mas ter `postcss.config.*` ausente pode confundir quem adicionar plugins PostCSS.
10. **Mock data hardcoded** em `features/users/api.ts` (gera 20 usuários aleatórios em memória). Backend real está fora deste app — `api-client.ts` aponta para `VITE_API_URL` (default `http://localhost:4000`).
11. **TS strict** com `noUnusedLocals` + `noUnusedParameters` + `verbatimModuleSyntax` — exige imports nomeados sem `import * as React` (embora o código use `import * as React` em vários arquivos; ver `card.tsx`, `kpi-card.tsx`, etc.).
12. **Tokens `slate` neutros** — `--primary` é `oklch(0.205 0 0)` (cinza escuro puro). O design system "oklch neutral" do enunciado quer **exatamente isso** (neutros sem chroma), então **basta confirmar e ajustar** se a paleta "neutral" desejada tiver lightness/delta diferente do `slate` do shadcn.
13. **`SaasDashboard` (600 linhas, 1 arquivo)** mistura dados mock + UI em um único lugar — não é problema para o DS, mas é candidato natural a decompor quando virar feature real.
14. **Sem testes para componentes UI** — `src/test/setup.ts` só importa `@testing-library/jest-dom`. Não há specs de UI no momento (apenas `utils.test.ts` e `use-local-storage.test.ts`).

---

## Onde mora — referência rápida

| O quê                            | Arquivo                                          |
| -------------------------------- | ------------------------------------------------ |
| CSS global / tokens / `@theme`   | `src/app/index.css`                              |
| Entrypoint HTML                  | `index.html`                                     |
| Entrypoint JS + anti-flash       | `src/app/main.tsx`                               |
| App composition                  | `src/app/App.tsx`                                |
| Router                           | `src/app/routes.tsx`                             |
| Layout shell                     | `src/app/dashboard-layout.tsx` + `app-sidebar.tsx` |
| Error boundary                   | `src/app/error-boundary.tsx`                     |
| shadcn `components.json`         | `components.json`                                |
| Vite config (TW v4 + alias `@`)  | `vite.config.ts`                                 |
| TS paths                         | `tsconfig.app.json`                              |
| Theme provider / context / hook  | `src/components/theme/`                          |
| `cn()` e formatadores            | `src/shared/lib/utils.ts`                        |
| `axios` + token interceptor      | `src/shared/lib/api-client.ts`                   |
| Env schema (`VITE_API_URL`)      | `src/shared/lib/env.ts`                          |
| `cn` ui barrel                   | `src/components/ui/index.ts`                     |
