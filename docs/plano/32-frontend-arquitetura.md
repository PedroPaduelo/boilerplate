# 32 — Fase 3: Frontend (app shell, data layer, telas, chat)

> Status: PROPOSTA v1 (exaustivo). Premissas: chat embutido no FE falando com API
> externa do agente; render engine compartilhado (dashboard + preview + chat);
> Vite+React19+shadcn+TanStack Query+Zustand+socket.io-client.

## 1. Estrutura (FSD, já no boilerplate)
```
src/
  app/         # router, providers (QueryClient, SocketProvider, AuthProvider)
  features/
    connections/  charts/  dashboards/  chat/  share/
  shared/
    components/ui/        # shadcn
    render-engine/        # BlockRenderer + registry do catálogo (compartilhado)  [F4]
    lib/ (api-client, socket-client, query-keys, utils)
    hooks/
```

## 2. Rotas (react-router 7)
- `/login` (existe)
- `/connections` — lista + formulário (cadastro/teste/schema)
- `/dashboards` — listagem · `/dashboards/:id` — view (render) · `/dashboards/:id/edit`
- `/charts` — listagem · `/charts/:id` — view/preview
- `/chat` — chat embutido (ou painel lateral acoplável)
- `/public/:token` — share público (SEM auth, read-only)

## 3. Data layer (boas práticas de cache no front)
- **api-client** (axios) com interceptors JWT (já há base no boilerplate).
- **TanStack Query**:
  - `query-keys` centralizadas: `['dashboard', id, mode]`, `['block-data', blockId, filtersHash]`,
    `['connections']`, `['charts', filters]`, `['catalog']`.
  - **modo dev**: `staleTime: 0` + refetch sempre (espelha "dev não cacheia").
  - **modo published**: `staleTime` alto (alinhado ao TTL do bloco).
  - Invalidação no publish/edição; **prefetch** do dashboard ao hover na listagem.
- **Socket**: ao abrir dashboard, entra na room `dashboard:{id}`; `on('block:data')`
  → `queryClient.setQueryData(['block-data', blockId, filtersHash], data)`; skeleton
  até chegar. `block:error` → estado de erro do bloco.
- **Zustand**: estado de UI (filtros ativos, modo edit/view, painel do chat).
  Filtros podem espelhar em URL (deep-link/compartilhável).

## 4. Tela de dashboard — render por config (T-G)
- Carrega layout (`GET /dashboards/:id?mode=`) → desenha **FilterBar** (topo) + **grid**
  de rows/blocks (grid 12 colunas, `span` por bloco, responsivo).
- Dispara `POST /dashboards/:id/data` (batch) com filtros → hidrata via cache/socket.
- **BlockRenderer**: lê `catalogType` → resolve no **registry** → renderiza `Component`
  com `props` + `data`. Estados: `skeleton | loading | success | error | empty`.
- Mudar filtro → recomputa só blocos que escutam aquele filtro (binding do contrato 20).
- Modos **view** e **edit**.

## 5. Editor de dashboard (T-G) — MVP enxuto
Como o **agente** monta o grosso, o editor humano no MVP cobre: reordenar/remover bloco,
editar texto/título, ajustar filtros e binding, **publicar/despublicar**. Drag-and-drop
de layout = decisão (pode ficar fora do MVP).

## 6. Telas de listagem (T-F)
- `/dashboards` e `/charts`: cards/tabela com **busca + filtros** (departamento, owner,
  status publish), e **ações por RBAC**: abrir, editar, publicar, compartilhar, exportar,
  duplicar.

## 7. Chat embutido (T-H) — fala com API externa
- UI de chat (mensagens + streaming).
- **Conexão**: decisão FE→API externa **direto** vs **proxy fino no nosso BE**
  (recomendado: proxy, p/ esconder credenciais e padronizar auth — não gerencia agente).
- **Gráfico no chat**: quando a resposta traz `chartId`, renderiza com o **BlockRenderer**
  + botão **"Adicionar a um dashboard"** (escolhe dashboard/seção → chama API/MCP).
- **Bloqueado por**: spec da API externa (endpoints, auth, formato de streaming/eventos).

## 8. Share público
- `/public/:token` sem auth → `GET /public/:token` (seta expiração na 1ª abertura) →
  renderiza dashboard read-only com o mesmo render engine → trata expirado/revogado.

## 9. PDF (T-J)
- Ver módulo 10 (decisão server-side headless vs client-side ainda aberta).

## 10. Decisões em aberto (F3)
- [ ] Chat: FE direto vs proxy fino no BE (recomendo proxy).
- [ ] Editor: nível de edição manual / drag-and-drop no MVP?
- [ ] Filtros: estado em URL (deep-link) vs só Zustand.
- [ ] Formato de streaming da API externa (depende da spec).

## ✅ Reuso de UI (Vitrine) — rodada 5
- Shells: `dashboard-panel` (wrapper de bloco), `dashboard-topbar`, `dashboard-sidebar-nav`,
  `dashboard-user-menu`, `collapsible-section`.
- Charts/render: ver `33-catalogo-componentes.md` (catálogo mapeado p/ slugs reais).
- Pré-requisito: `npx shadcn@latest init` + Tailwind v4 + alias `@/` (a skill cobre).
