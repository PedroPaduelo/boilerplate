# Frontend Boilerplate

Frontend boilerplate com Vite + React 19 + TypeScript, focado em servir como base enxuta e consistente com o `backend-boilerplate`. Inclui o exemplo mínimo de auth + CRUD de users (com RBAC `ADMIN`/`USER`).

## Stack

- **Build/dev**: Vite 8
- **UI**: React 19 + TailwindCSS 3 + shadcn/ui (Radix)
- **State/data**: TanStack Query 5, Zustand 5
- **Forms/validação**: react-hook-form + Zod 4
- **Roteamento**: react-router-dom 7
- **Real-time**: socket.io-client
- **Testes**: Vitest 4 + Testing Library + jsdom
- **Lint/format**: ESLint 9 (flat config) + Prettier 3
- **Commits**: Husky 9 + lint-staged 15 + commitlint 19 (Conventional Commits)
- **CI**: GitHub Actions

## Quick Start

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

Edite `.env` se quiser apontar para outro backend (o padrão é `http://localhost:4000`).

### 3. Rodar

```bash
npm run dev
```

Abre em `http://localhost:5173`.

## Scripts

| Script                 | Descrição                                                 |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Inicia o Vite em modo dev (porta 5173)                    |
| `npm run build`        | Faz `tsc -b` e builda para produção                       |
| `npm run preview`      | Serve o build localmente (porta 5173)                     |
| `npm run lint`         | Roda o ESLint                                             |
| `npm run lint:fix`     | Roda o ESLint com `--fix`                                 |
| `npm run typecheck`    | Roda `tsc -b --noEmit` (typecheck dedicado)               |
| `npm run test`         | Roda Vitest em modo single-run                            |
| `npm run test:watch`   | Roda Vitest em watch mode                                 |
| `npm run format`       | Formata com Prettier (`**/*.{ts,tsx,js,cjs,mjs,json,md}`) |
| `npm run format:check` | Verifica formatação sem alterar                           |

## Tooling

### Prettier

Configurado em `.prettierrc.json` (singleQuote, semi, 90 cols, LF) e `.prettierignore` (exclui `dist`, `node_modules`, `coverage`, `package-lock.json`, `*.tsbuildinfo`, `.vite`).

`npm run format` aplica; `npm run format:check` só valida (usado no CI).

### ESLint

Flat config (`eslint.config.js`):

- `js.configs.recommended` + `tseslint.configs.recommended` para JS/TS
- `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` para componentes
- `eslint-config-prettier` **por último** (desativa regras de formatação para Prettier assumir)

> **Baseline**: o lint emite ~8 erros pré-existentes em componentes shadcn/ui
> (`@typescript-eslint/no-empty-object-type` em interfaces vazias e
> `react-refresh/only-export-components` em `button.tsx`). Esses erros são
> parte do shadcn/ui gerado e não devem ser corrigidos no boilerplate.

### Husky + lint-staged + commitlint

- **`.husky/pre-commit`** → roda `lint-staged`, que aplica `eslint --fix` + `prettier --write` nos arquivos `*.{ts,tsx,js,cjs,mjs}` e `prettier --write` em `*.{json,md}` staged.
- **`.husky/commit-msg`** → roda `commitlint --edit` contra a mensagem do commit.
- **`commitlint.config.mjs`** → Conventional Commits; `type-enum` restrito a `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert`, `type-case: lower-case`, `header-max-length: 100`.

Exemplos:

- `feat: add user avatar upload` ✅
- `fix(auth): handle expired token in interceptor` ✅
- `bad commit` ❌ (sem `type:`)
- `FEAT: uppercase` ❌ (uppercase / fora do enum)

### Vite

`vite.config.ts`:

- **Porta 5173** (dev + preview) — alinhado com o runtime que expõe o frontend em
  `https://boilerplate-fe-...cloud.serendiped.com` e localmente em
  `http://localhost:5173`. Antes estava 4051, o que quebrava o par FE 5173 ↔ BE 4000.
- **`allowedHosts`** — `true` por padrão (permissivo, para previews cloud com hostnames
  dinâmicos). Para setups locais mais restritos, defina
  `VITE_ALLOWED_HOSTS=host1.com,host2.com` em `.env` e o Vite restringe à lista
  separada por vírgula. Ver
  [docs](https://vite.dev/config/server-options.html#server-allowedhosts).
- **`cors: true`** — habilita CORS no dev server, útil quando o backend roda
  em outra porta sem proxy configurado.
- **Vitest config embutido** — `environment: 'jsdom'`, `globals: true`,
  `setupFiles: ['./src/test/setup.ts']`, `css: false`. O `npm test` reusa este
  arquivo (`vitest run --config vite.config.ts`).

### CI

GitHub Actions em `.github/workflows/frontend-ci.yml`:

- Aciona em push/PR que alteram `frontend-boilerplate/**` ou o próprio workflow
- `npm ci` → `lint` → `typecheck` → `test --ci` → `build`
- Mesma forma do `backend-ci.yml` (cancel-in-progress por ref, Node 20, cache de npm)

## Testes

Testes ficam colocalizados com o código (`*.test.ts` ao lado de `*.ts`).

```bash
npm test
```

Exemplos do boilerplate:

- `src/shared/hooks/use-local-storage.test.ts` — hook `useLocalStorage` (jsdom + renderHook)
- `src/shared/lib/utils.test.ts` — `cn` (twMerge) e `formatDate`/`formatDateTime` (puros)

## Inconsistência de versão do zod (frontend × backend)

> **Atenção**: este frontend usa **zod v4** (`zod@^4.3.6`) enquanto o
> `backend-boilerplate` usa **zod v3** (`zod@^3.25.76`). As APIs são próximas
> mas **não idênticas** — em particular:
>
> - Mensagens de erro em validações encadeadas diferem de forma
> - Alguns helpers (`z.string().email()`, `z.string().url()`) têm pequenas
>   variações de validação e tipagem
> - O backend importa `zod-error` (compatível só com v3) e serializa erros no
>   formato v3
>
> **Implicação**: se você for compartilhar schemas Zod entre FE e BE (ex.: um
> pacote `shared/`), padronize a versão primeiro. Para projetos novos que
> ficam isolados em cada boilerplate, isso não é bloqueante — o FE usa
> `@hookform/resolvers` e valida client-side, o BE usa
> `fastify-type-provider-zod` e valida server-side, e cada um está consistente
> com a sua própria versão.
>
> **Plano**: alinhar para a mesma versão em uma task dedicada
> (provavelmente zod v4 + atualizar `fastify-type-provider-zod` para a versão
> que suporta v4, ou regredir o FE para v3). Fora do escopo de FE-3.

## Estrutura de Pastas

```
src/
├── app/                    # Bootstrap (App, routes, layout, error boundary, main)
├── features/               # Funcionalidades (FSD slices)
│   ├── auth/               #   login/register/store/hooks/components
│   └── users/              #   CRUD de users
└── shared/                 # Compartilhado
    ├── components/
    │   ├── layout/         #   Header, Sidebar
    │   └── ui/             #   shadcn/ui
    ├── hooks/              # useLocalStorage, useDebounce
    ├── lib/                # api-client, env, utils, constants
    └── types/              # Tipos compartilhados
```

## URL

| Serviço                  | URL                                                  |
| ------------------------ | ---------------------------------------------------- |
| Frontend (dev)           | http://localhost:5173                                |
| Frontend (preview cloud) | https://boilerplate-fe-cmqg5udk.cloud.serendiped.com |
| Backend esperado         | http://localhost:4000                                |

## Usuários de Teste (após seed do backend)

| Email             | Senha     | Role  |
| ----------------- | --------- | ----- |
| admin@example.com | admin1234 | ADMIN |
| user@example.com  | user1234  | USER  |
