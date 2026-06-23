# Plano — Sistema de Dashboards/Relatórios gerados por IA (front de banco)

> **Status:** RASCUNHO em construção. Documento vivo, atualizado a cada rodada de
> conversa com o usuário. **Nenhuma task foi criada ainda** — primeiro fechamos o
> plano módulo a módulo aqui nos `.md`.
> **Última atualização:** registro inicial a partir da 1ª leva de gravações.

## 1. O que é (visão em uma frase)

Uma plataforma onde um **agente de IA** (via **MCP**) constrói dashboards/relatórios
interativos consultando bancos de dados reais (conexões cadastradas), escolhe a
visualização adequada, e salva tudo como **configuração** no banco. O front-end
**hidrata** a tela a partir dessa config: filtros no topo, seções (linhas) e
gráficos, cada um com suas props, TTL de cache e queries — executadas em fila e
atualizadas via socket.

Diferente de um dashboard tradicional "tabelão": é um **relatório/dashboard
narrativo e interativo** — o agente pode escrever texto (markdown), títulos,
seções, além de gráficos e filtros. Exportável em PDF.

Contexto de uso: **dentro de uma prefeitura** — múltiplos departamentos e níveis
de acesso.

## 2. Stack existente no boilerplate (reaproveitar)

**Backend** (`backend-boilerplate`): Fastify v5, Prisma + PostgreSQL, **Redis +
BullMQ** (fila), **Socket.IO**, JWT + bcrypt, Swagger, Zod v3, rate-limit,
multipart, static, Bull Board.

**Frontend** (`frontend-boilerplate`): Vite 8, React 19, TailwindCSS 3,
shadcn/ui (Radix), **TanStack Query 5**, Zustand 5, react-hook-form + Zod 4,
react-router 7, socket.io-client, framer-motion, sonner.

**Já cobre nativamente:** fila de execução (BullMQ), realtime (Socket.IO),
camada de cache (Redis), cache de dados no front (TanStack Query), RBAC simples.

**Falta acrescentar (a decidir):** lib de gráficos, lib/serviço de PDF,
servidor MCP, drivers de conexão a bancos externos.

> ⚠️ Inconsistência conhecida: Zod v3 (BE) vs Zod v4 (FE). Se formos compartilhar
> schemas, precisa alinhar.

## 3. Glossário (alinhar vocabulário)

- **Conexão**: credencial/string de um banco externo da prefeitura, cadastrada e
  disponibilizada para a IA usar (executar queries).
- **Config (de dashboard/gráfico)**: o JSON que descreve a tela. É o que o agente
  escreve no banco via MCP e o que o front lê para renderizar.
- **Catálogo**: conjunto de blocos disponíveis — gráficos, composições de layout,
  seções de escrita, títulos, etc. — que o agente combina.
- **MCP**: interface por onde a IA lê o catálogo, executa queries e grava config.
- **Owner**: usuário que criou o dashboard/gráfico/relatório.
- **Publish**: estado publicado (com cache) vs. estado dev (sem cache, sempre fresco).

## 4. Fluxo de uso (do chat) — como o usuário descreveu

1. Usuário abre o chat: "quero um relatório sobre dívida ativa".
2. Agente pergunta **qual(is) conexão(ões)** usar.
3. Agente pergunta **o que** ele quer (expectativa, qual gráfico).
4. Agente **executa query** na conexão escolhida (função: recebe conexão + query,
   devolve resultado).
5. Agente **analisa o resultado** e **escolhe a visualização** (ou o usuário pede
   uma do catálogo).
6. O resultado tem que ser **conciliado** com o que o gráfico consegue renderizar
   (contrato de dados de cada gráfico — daí a documentação rígida do MCP).
7. O gráfico aparece **no próprio chat**, com botão **"adicionar a um dashboard"**.
8. Durante o desenho, o agente pergunta a **frequência de atualização** do dado →
   define o **TTL de cache por gráfico**.

## 5. Módulos identificados (cada um vira um `.md` próprio)

| #  | Módulo | Arquivo | Status |
|----|--------|---------|--------|
| 01 | Fundação: Multi-tenancy (org/departamentos) + RBAC (admin/usuário/analista/creator/viewer) + ownership/visibilidade | `01-fundacao-rbac-tenancy.md` | esqueleto |
| 02 | Conexões de banco (cadastro, listagem, visualização de banco/tabelas, executar query) | `02-conexoes-banco.md` | esqueleto |
| 03 | Catálogo de blocos + motor de render por config (gráficos, seções, texto, títulos) + contrato de dados | `03-catalogo-render-config.md` | esqueleto |
| 04 | Dashboard (filtros globais seletivos, seções/linhas, TTL por gráfico, execução em fila + socket) | `04-dashboard.md` | esqueleto |
| 05 | MCP Server (tools, catálogo, documentação, gravação de config) | `05-mcp-server.md` | esqueleto |
| 06 | Chat / Agente (fluxo de criação, gráfico no chat, add ao dashboard) | `06-chat-agente.md` | esqueleto |
| 07 | Cache (TanStack no FE + Redis no BE, dev vs publish, fila) | `07-cache.md` | esqueleto |
| 08 | Publish & versionamento (gráfico e dashboard) | `08-publish-versionamento.md` | esqueleto |
| 09 | Compartilhamento por link com TTL temporal (tempo conta a partir da 1ª abertura) | `09-share-link-temporal.md` | esqueleto |
| 10 | Export PDF | `10-export-pdf.md` | esqueleto |
| 11 | Telas de listagem (dashboards e gráficos) por usuário/org/departamento | `11-telas-listagem.md` | esqueleto |

## 6. Grandes decisões em aberto (a resolver na conversa)

- [ ] **Escopo de tenant**: mono-prefeitura (só departamentos) ou multi-prefeitura?
- [ ] **SGBDs das conexões externas**: quais precisam ser suportados? Read-only?
- [ ] **Onde roda o loop do agente de IA**: backend chamando LLM? Qual provider?
      Como o MCP se conecta a esse runtime?
- [ ] **Lib de gráficos**: Recharts / ECharts / visx / outra?
- [ ] **Estratégia de PDF**: server-side (headless) vs client-side?
- [ ] **Modelo de filtros**: tipos de filtro, como mapeiam para parâmetros de query
      por gráfico.
- [ ] **Segurança de execução de query**: como impedir queries destrutivas, timeout,
      limite de linhas, sandbox.
- [ ] **Estrutura da config** (schema do JSON do dashboard/gráfico).

## 7. Próximos passos do planejamento

1. Confirmar se há mais gravações a registrar.
2. Rodada de questionamentos por módulo (começando pela Fundação e Conexões).
3. Fechar cada `.md` de módulo com escopo, decisões e critérios.
4. Só então transformar em requisito + tasks.

---

## 8. Estrutura de execução em CAMADAS (ordem definida pelo usuário)

O usuário definiu que o plano deve ser detalhado **exaustivamente** e nesta ordem
de implementação, de ponta a ponta, para "programar de uma vez sem ficar se
debatendo":

| Fase | Camada | O que entra | Cobre os módulos |
|------|--------|-------------|------------------|
| F1 | **Banco de dados** (Prisma/Postgres da app) | Modelagem completa: Org/Dept/User/Role, Connection, Dashboard, Block/Chart, Config (JSON), versões/publish, ShareLink, metadados de cache | 01, 02, 03, 04, 08, 09, 11 |
| F2 | **Backend** | Rotas, serviços, camadas, **cache (Redis)**, **fila (BullMQ)**, **socket**, MCP server, execução de query, publish, share-link | 02, 04, 05, 07, 08, 09, 10 |
| F3 | **Frontend** | App shell, data layer (TanStack Query + socket), telas de listagem, tela de dashboard (render por config), chat, PDF, **boas práticas de cache no front** | 04, 06, 10, 11 |
| F4 | **Biblioteca de componentes/gráficos** (a mais chata) | Catálogo + contrato de dados por bloco; inserir os componentes/gráficos **um a um**, dinâmicos e integráveis ao dashboard | 03 |

> Os "módulos" (01–11) continuam sendo a decomposição **funcional**. As "fases"
> (F1–F4) são a ordem **de implementação** transversal. O documento de **contrato
> ponta a ponta** (`20-contrato-dashboard.md`) é o que amarra F1↔F2↔F3↔F4.

## 9. Eixo de paralelização (requisito do usuário)

Requisito explícito: poder **soltar vários agentes em paralelo** sem que se choquem.
Princípio: **fixar os contratos/tipos compartilhados primeiro** (eles viram a
fronteira entre as trilhas); depois dividir o trabalho em arquivos/módulos
**disjuntos**. Cada gráfico do catálogo é uma unidade isolada (1 arquivo + 1 entrada
no registry) — daí o paralelismo natural de "inserir um a um". Detalhe em
`21-estrategia-paralelizacao.md`.

## 10. Documentos transversais

- `20-contrato-dashboard.md` — **o coração**: contrato de LAYOUT (config) × contrato
  de DADOS (query→render), cache de cada um, ponta a ponta BE↔FE.
- `21-estrategia-paralelizacao.md` — como dividir o trabalho entre agentes sem colisão.

> Última atualização: 2ª diretriz do usuário (estruturar por camadas + contrato + paralelização).

---
## 11. Decisões consolidadas (até rodada 5)
- Tenant: mono-prefeitura (sem tabela Organization). Conexões: Postgres-only, read-only, cifradas.
- RBAC role global (matriz proposta no 01, a confirmar). Sem AuditLog no MVP.
- Versionamento: só draft+published (sem histórico). Cache de dados compartilhado.
- Agente EXTERNO (nuvem ok) consome nosso MCP; chat embutido no nosso FE via API externa
  (spec pendente). Endpoint de dados batch por dashboard.
- UI: **Vitrine UI** (registry shadcn); gráficos dependency-free (sem Recharts/ECharts).
- Transform: query aliasa p/ campos do contrato (+ map opcional). Manifestos: JSON Schema neutro.
- Editor de dashboard: enxuto (sem drag-and-drop) no MVP.
- Contrato 20: CONFIRMADO. RBAC: matriz aprovada. PDF: **server-side headless** (rota /print + Chromium + fila).
- Catálogo é VIVO/aberto (plug-and-play de código, auto-registro). Base inicial pequena; cresce com o tempo.
- Chat: construído MOCKADO (experiência visual), por último; integração real com a API externa vira task separada no fim.
