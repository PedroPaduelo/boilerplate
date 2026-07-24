# auditorIA

**Plataforma de auditoria de dados conversacional.** Conecte um banco, pergunte
em português e transforme a resposta em gráficos e dashboards auditáveis.

O produto existe para encurtar o caminho entre uma **dúvida de auditoria**
("quais lançamentos fogem do padrão neste trimestre?") e uma **evidência
compartilhável** (um gráfico salvo, publicado num dashboard e exportado em PDF)
— sem que quem pergunta precise escrever SQL.

---

## Sumário

- [O que a plataforma faz](#o-que-a-plataforma-faz)
- [Arquitetura](#arquitetura)
- [Como rodar](#como-rodar)
- [Papéis e permissões (RBAC)](#papéis-e-permissões-rbac)
- [Identidade visual](#identidade-visual)
- [Testes](#testes)
- [Roadmap](#roadmap)

---

## O que a plataforma faz

| Área | O que resolve |
| --- | --- |
| **Conexões** | Cadastra bancos PostgreSQL, testa conectividade e introspecta o schema (tabelas, colunas, índices, FKs). Inclui um *workbench* com query runner read-only. |
| **Agente (Chat)** | Um agente de IA com acesso às conexões via **MCP**. Ele explora o schema, escreve o SQL, executa e devolve a resposta já renderizada como gráfico — com os passos de ferramenta visíveis em streaming (SSE). |
| **Gráficos** | Artefatos versionados em `draft`/`published`. Nascem de uma pergunta ao agente ou de um bloco do catálogo. |
| **Dashboards** | Composição de gráficos em linhas/blocos, com filtros. Também em `draft`/`published`, com hidratação de dados em lote e atualização por Socket.IO. |
| **Catálogo** | Galeria viva de todos os blocos do render-engine, renderizados com dados de exemplo. É o mesmo catálogo que o agente enxerga via MCP. |
| **Compartilhamento** | Links públicos por token para dashboards/gráficos, sem exigir login do destinatário. |
| **Exportação** | Geração de PDF via Playwright, processada em fila (BullMQ). |
| **Departamentos & RBAC** | Visibilidade por `PRIVATE` / `DEPARTMENT` / `ORG` e uma matriz de papéis aplicada no backend e espelhada na UI. |

### O fluxo principal

```
Conectar banco → Perguntar ao agente → Salvar como gráfico
      → Montar dashboard → Publicar → Compartilhar / Exportar
```

A tela **Início** (`/home`) reflete esse fluxo: em uma conta nova ela vira um
checklist de três passos; depois, um resumo do ambiente com os artefatos
recentes.

---

## Arquitetura

Monorepo com três pacotes:

```
.
├── backend-boilerplate/   # API Fastify + Prisma + BullMQ + Socket.IO + MCP
├── frontend-boilerplate/  # SPA React 19 + Vite + Tailwind v4 (Feature-Sliced)
└── shared/contracts/      # Contratos de layout/dados compartilhados (fonte da verdade)
```

> **Nota sobre os nomes:** os diretórios ainda carregam o sufixo
> `-boilerplate` de quando o projeto nasceu de um template. Hoje eles contêm o
> produto completo — o nome é histórico, não descritivo.

### Backend (`backend-boilerplate`)

Fastify v5 + Prisma (PostgreSQL) + Redis/BullMQ + Socket.IO. Os módulos de
domínio ficam em `src/modules/` e são carregados por autoload:

`agent` (loop do agente, SSE, skills) · `catalog` · `channels` (WhatsApp via
Evolution API) · `charts` · `connections` · `dashboards` · `data` (executor de
queries, cache e workers) · `departments` · `export` (PDF) · `mcp` (servidor
MCP que expõe as ferramentas ao agente) · `share`

### Frontend (`frontend-boilerplate`)

React 19 + Vite + TailwindCSS v4 + shadcn/ui, organizado em **Feature-Sliced
Design**. Cada feature declara suas próprias rotas em
`src/features/<feature>/routes.tsx` e o agregador `collectFeatureRoutes()` as
descobre por glob — **não existe um arquivo central de rotas para editar**.

Dados via TanStack Query com query-keys centralizadas (`shared/lib/query-keys`).

---

## Como rodar

### Pré-requisitos

PostgreSQL, Redis e Node 20+.

### Backend

```bash
cd backend-boilerplate
npm install
cp .env.example .env        # ajuste DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:4000
```

| Serviço | URL |
| --- | --- |
| API | http://localhost:4000 |
| Swagger | http://localhost:4000/docs |
| Bull Board | http://localhost:4000/queues |
| Health | http://localhost:4000/health |

### Frontend

```bash
cd frontend-boilerplate
npm install
cp .env.example .env        # VITE_API_URL aponta para o backend
npm run dev                 # http://localhost:5173
```

### Usuários do seed

| Email | Senha | Papel |
| --- | --- | --- |
| admin@prefeitura.local | admin1234 | ADMIN |
| analyst@prefeitura.local | user1234 | ANALYST |
| creator@prefeitura.local | user1234 | CREATOR |
| viewer@prefeitura.local | user1234 | VIEWER |
| user@prefeitura.local | user1234 | USER |

---

## Papéis e permissões (RBAC)

O backend é a autoridade (`requirePermission` nas rotas). O frontend espelha a
mesma matriz em `shared/lib/rbac.ts` apenas para esconder o que o usuário não
pode fazer — defesa em profundidade, nunca substituto.

| Papel | Pode |
| --- | --- |
| **ADMIN** | Tudo, incluindo departamentos e usuários. |
| **ANALYST** | Gerencia conexões e artefatos, publica e compartilha. |
| **CREATOR** | Usa conexões, gerencia/publica artefatos, compartilha. |
| **VIEWER** | Apenas visualiza e exporta. |
| **USER** | Nenhuma permissão de domínio. |

Ao adicionar uma permissão, atualize **os dois lados**.

---

## Identidade visual

Tokens em `frontend-boilerplate/src/app/index.css` (light + dark).

**Personalidade:** instrumento profissional — denso, calmo e preciso. A
referência são ferramentas como Linear, Vercel e Raycast, não páginas de
marketing. Na prática isso significa: *chrome* mínimo, cor com significado,
tipografia com tracking apertado e profundidade por borda em vez de sombra.

**Dark-first.** O tema escuro é o padrão (`ThemeProvider defaultTheme="dark"`),
com um script bloqueante em `index.html` que aplica a classe antes do primeiro
paint — sem o flash branco típico de dark mode mal implementado. O toggle
continua disponível e a escolha do usuário persiste em `localStorage.theme`.
Justificativa: o escuro dá mais contraste às visualizações e cansa menos em
sessões longas de análise.

**Cor.** A marca é o teal `#00a1b0` ≈ `oklch(0.648 0.111 206.5)`. Ele ancora
`--primary`, o anel de foco (`--ring`) e a primeira cor de série.

| Token | Claro | Escuro |
| --- | --- | --- |
| `--primary` | `oklch(0.54 0.098 207)` | `oklch(0.7 0.105 205)` |
| `--ring` | `oklch(0.648 0.111 206.5)` | idem |

No tema escuro o primary é **claro** e o texto do botão escuro — o inverso do
claro — para manter contraste alto sobre o fundo escuro.

**Séries de dados.** `--chart-1..5` formam uma paleta **categórica** (teal,
verde, âmbar, violeta, rosa), não uma rampa monocromática: séries vizinhas
precisam ser distinguíveis. `--chart-2` é verde por contrato — o `KpiCard` o usa
como cor de variação positiva.

**Contraste.** Todos os pares verificados contra WCAG 2.1: texto ≥ 4.5:1 e
elementos gráficos ≥ 3:1, nos dois temas.

**Tipografia.** Inter (interface) e JetBrains Mono (SQL/código), carregadas em
`index.html` com fallback completo para fontes de sistema. Títulos de seção
usam tracking negativo (`-0.02em`) e `text-balance` — o traço que dá o ar de
produto premium. Números (datas, contagens, células de tabela) são sempre
tabulares e, em metadados, monoespaçados, para alinharem entre linhas.

**Elevação.** Sombras curtas e de baixa opacidade; a hierarquia vem do
contraste de borda. No escuro a sidebar fica no mesmo plano do conteúdo,
separada por uma hairline — quem se eleva é o cartão, não a navegação.

### Command palette (⌘K)

`features/command-palette` — busca e navegação por teclado sobre dashboards,
gráficos, conexões e ações (criar dashboard, abrir o agente, trocar tema).
Construída com `cmdk`, reaproveita as queries já em cache do TanStack Query.
O gatilho visível na topbar existe para ensinar o atalho passivamente.

---

## Testes

```bash
# Frontend — Vitest + Testing Library (jsdom)
cd frontend-boilerplate && npm test

# Backend — Jest (usa o PostgreSQL real do DATABASE_URL)
cd backend-boilerplate && npm test
```

---

## Roadmap

As ideias avaliadas e ainda não implementadas estão em
[`docs/ROADMAP.md`](docs/ROADMAP.md), priorizadas e com a justificativa de cada
uma.
