# Exploração: Chat de IA do boilerplate (frontend-boilerplate)

> Pergunta: mapear o chat de IA (path principal, sub-componentes, render do ToolCall, container/página, controle de tamanho, botão de fechar, decisão "tool em cima/embaixo da mensagem").
> Data: 2026-06-25 00:45 · Stack: React + Vite + React Router + TanStack Query + shadcn/ui + Lucide. SSE via fetch+ReadableStream (não EventSource). Contrato de bloco via `@dashboards/contracts`.

## Resposta direta

O chat vive em `frontend-boilerplate/src/features/chat/` como uma feature isolada, montada em **página dedicada** na rota `/chat` (dentro do shell `DashboardLayout`, lado-a-lado com dashboards/charts/catalog/etc.). É composto por **sidebar de conversas** (esquerda, 256px) + **área de chat** (direita) com header fixo, scroll interno de mensagens e input embaixo. O **efeito de tool NÃO é "collapsible/closable"** — quando uma tool está em execução, ela aparece como **linha animada numa lista posicionada ABAIXO das mensagens e ACIMA da bolha de "thinking"**, dentro do mesmo scroll; quando a tool termina (`phase: 'result'`), a linha fica verde com check + "concluído" e **permanece visível** até a próxima `send()` (que reseta `toolSteps`). **NÃO existe botão de fechar/colapsar o painel de tools** — a visibilidade é controlada só pelo estado `toolSteps.length > 0 && isStreaming` em `chat-page.tsx:130-132`. Não há painel lateral de tool; tudo é inline vertical no fluxo de mensagens.

## Onde está (paths com linha e papel)

### Componentes de UI (o que renderiza, em ordem de uso)

- `frontend-boilerplate/src/features/chat/components/chat-page.tsx:30-180` — **`ChatArea`**: dona do estado da conversa ativa. `messages`, `isStreaming`, `error`, `toolSteps: Array<{ toolName; phase: 'call'|'result'; args?; output? }>`. Consome o transport (`new HttpChatTransport({ conversationId })`) num `for await (const ev of transport.sendMessage(...))` e mapeia cada `ChatEvent` → setState (linhas 80-115). Renderiza `ChatMessageList` + (condicional) `ToolStepsList` + (condicional) `ThinkingBubble` + erro + `ChatInput`. **O layout é `flex min-h-0 flex-1 flex-col` (linha 122) com scroll interno (`overflow-y-auto` na linha 125)**.
- `frontend-boilerplate/src/features/chat/components/chat-page.tsx:182-218` — **`ChatSidebar`**: lista de conversas (largura fixa `w-64`, 256px) com botão "Nova conversa" no topo e item-por-item com hover mostrando lixeira. Não tem toggle de fechar/recolher.
- `frontend-boilerplate/src/features/chat/components/chat-page.tsx:221-300` — **`ChatPage`**: orquestra sidebar + área. Wrapper externo é `flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-border bg-card` (linha 260) — **altura 100vh-7rem (112px)** deixando 7rem de respiro (4rem do topbar + paddings). `DashboardLayout` (ver abaixo) é que segura o overflow global.
- `frontend-boilerplate/src/features/chat/components/chat-message-list.tsx:14-46` — **`ChatMessageList`**: lista vertical de `ChatMessageBubble`. Faz `scrollIntoView({ behavior: 'smooth' })` num ref âncora quando `messages` muda (linhas 19-21). Estado vazio com placeholder ("Peça um relatório ou gráfico...").
- `frontend-boilerplate/src/features/chat/components/chat-message-bubble.tsx:40-83` — **`ChatMessageBubble`**: bolha user (direita, primária) ou assistant (esquerda, muted). Conteúdo do user é texto puro (`whitespace-pre-wrap`); do assistant é markdown (marked + DOMPurify, linhas 24-37). **`message.chart` é renderizado ABAIXO da bolha de texto, dentro do mesmo flex-col** (linhas 75-79: `<div className="mt-2 w-full min-w-[18rem]"><InlineChart ... /></div>`). Sem menção a tools aqui — tools nunca entram na bolha.
- `frontend-boilerplate/src/features/chat/components/inline-chart.tsx:20-60` — **`InlineChart`**: renderiza o `ChatChartPayload` via `BlockRenderer` (mesmo render-engine do dashboard) dentro de um card com borda. Botão "Adicionar a um dashboard" (gated por `artifacts:manage`) abre `AddToDashboardDialog`.
- `frontend-boilerplate/src/features/chat/components/add-to-dashboard-dialog.tsx` — **`AddToDashboardDialog`**: modal (shadcn Dialog) que materializa o chart mock em Chart real (POST /charts) + adiciona ao dashboard (POST /dashboards/:id/blocks) via hook `useAddGeneratedChartToDashboard` em `features/chat/hooks.ts:30-66`.
- `frontend-boilerplate/src/features/chat/components/tool-steps-list.tsx:33-71` — **`ToolStepsList`**: a **lista de efeito de tool**. Cada step vira uma linha horizontal: `Loader2 animate-spin` + label (em fase `'call'`, cor primária) → `CheckCircle2` verde + label + "concluído" (em fase `'result'`, verde com fade-in slide-in-from-left-2). Animação de entrada por linha (`animate-in fade-in slide-in-from-left-2 duration-300`). **Sem X, sem chevron, sem nada pra fechar**.
- `frontend-boilerplate/src/features/chat/components/thinking-indicator.tsx:18-80` — **`ThinkingBubble`**: bolha do assistant vazia com 3 bolinhas pulsantes (default) OU ícone+label da tool ativa (`{ToolIcon} {label}...` em muted-foreground). Mostra o step `phase === 'call'` mais recente (linhas 39-40). Aparece **só enquanto a última mensagem do assistant está vazia** (decisão em `chat-page.tsx:119`).
- `frontend-boilerplate/src/features/chat/components/chat-input.tsx:21-69` — **`ChatInput`**: textarea (max-h-40, Enter envia, Shift+Enter quebra) + botão "Parar" (separado do "Enviar", comentário linhas 53-55 explica por quê) + botão "Enviar". Disabled enquanto `isStreaming`.

### Container / página onde o chat vive

- `frontend-boilerplate/src/features/chat/routes.tsx:1-31` — rota `/chat` (path relativo ao shell), exigindo `artifacts:manage` via `RequireRole`. `ChatPage` é lazy-loaded com `Suspense`.
- `frontend-boilerplate/src/app/routes.tsx:21-33` — `/` envolve o `DashboardLayout` com `ProtectedRoute`; as features registram filhos via `collectFeatureRoutes()` (autodescoberta por glob). `/chat` é uma das features protegidas.
- `frontend-boilerplate/src/app/dashboard-layout.tsx:33-65` — **shell autenticado**: `flex h-screen overflow-hidden` (linha 36) com `AppSidebar` (esquerda) + coluna com `DashboardTopbar` (h-14, sticky) + `<main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">` (linha 53) envolvendo o `Outlet`. **Quem limita a altura do chat é o `DashboardLayout` (h-screen) + o `h-[calc(100vh-7rem)]` no `ChatPage` wrapper (chat-page.tsx:260) — scroll do chat é INTERNO, não rola a página toda**.
- `frontend-boilerplate/src/app/app-sidebar.tsx` — navegação lateral (Dashboards / Gráficos / Catálogo / Conexões / **Chat** / Usuários).

### Camada de transporte (o que alimenta o chat)

- `frontend-boilerplate/src/features/chat/transport/types.ts:1-114` — **contrato público** (a "seam" trocável). `ChatTransport` interface (`sendMessage` → `AsyncIterable<ChatEvent>`); `ChatEvent` união com `message_start | text_delta | chart | message_end | error | tool_step | usage`. `ChatMessage` (id, role, content, chart?, createdAt). `ChatChartPayload` (chartId?, title, catalogType, props?, result, dataBinding?). Comentário linhas 1-15 deixa claro que **a UI NÃO muda** quando trocar a implementação (T-H2 é o marco que liga a API real).
- `frontend-boilerplate/src/features/chat/transport/http-transport.ts:52-159` — **`HttpChatTransport`** (implementação real): faz `POST /agent/chat/:conversationId` com `fetch`+`ReadableStream`, parseando SSE manualmente (parser próprio `parseSseStream`, linhas 24-50). **JÁ emite `tool_step` events** (linhas 117-123) — o backend real está plugado e a UI já consome.
- `frontend-boilerplate/src/features/chat/transport/mock-transport.ts:42-77` — **`MockChatTransport`** (default em dev, hoje usado como fallback se o provider não for montado). **NÃO emite `tool_step` events** — só `message_start`, `text_delta` (token a token), `chart` opcional, `message_end`. Por isso, **em mock, a `ToolStepsList` nunca aparece** (porque `toolSteps` fica vazia).
- `frontend-boilerplate/src/features/chat/transport/context.tsx:14-26` — `ChatTransportProvider` injetando no `ChatTransportContext`.
- `frontend-boilerplate/src/features/chat/transport/transport-context.ts:9-12` — `ChatTransportContext = createContext<ChatTransport>(defaultMockTransport)`.
- `frontend-boilerplate/src/features/chat/transport/use-chat-transport.ts:9-12` — `useChatTransport()` lê do contexto.
- `frontend-boilerplate/src/features/chat/use-chat.ts:1-141` — hook `useChat` alternativo (estado de mensagens + send + stop + reset). **NÃO É USADO pelo `ChatPage` atual** — o `ChatPage` reimplementa a mesma lógica inline (chat-page.tsx:33-180). É um hook "preparado" pra T-H2 / pra componentizar.

### Demais

- `frontend-boilerplate/src/features/chat/api.ts:1-58` — `agentApi`: CRUD de conversas (`/agent/conversations`, `/agent/conversations/:id`) + `checkHealth` (`/agent/health`).
- `frontend-boilerplate/src/features/chat/hooks.ts:30-66` — `useAddGeneratedChartToDashboard`: ponte chat→dashboard, materializa Chart real via `chartsApi.create` e adiciona via `dashboardsApi.addChart`.
- `frontend-boilerplate/src/features/chat/transport/mock-data.ts` — gerador de `ChatChartPayload` mockados (kpi/bar/line/donut/table) + heurística `pickChartKind` (regex no texto do user) e `wantsChart` (regex pra detectar pedido de gráfico).
- `frontend-boilerplate/src/features/chat/__tests__/{chat-page,add-to-dashboard,mock-transport}.test.tsx` — testes da feature.

## Como funciona / fluxo

### Onde mora a decisão "tool em cima/embaixo da mensagem"

A decisão está em **`chat-page.tsx:127-139`** (dentro do `ChatArea`):

```tsx
<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
  <ChatMessageList messages={messages} isStreaming={isStreaming} />
  {/* Tool steps em tempo real (dentro do scroll) */}
  {toolSteps.length > 0 && isStreaming ? (
    <ToolStepsList steps={toolSteps} />
  ) : null}
  {/* Bolha de pensamento quando assistant não tem texto ainda */}
  {isThinking ? <ThinkingBubble toolSteps={toolSteps} /> : null}
  {error ? (...) : null}
</div>
```

**Ordem vertical no DOM (de cima pra baixo, dentro do scroll)**:
1. `ChatMessageList` (todas as mensagens, incluindo a do assistant em streaming)
2. `ToolStepsList` (só se `toolSteps.length > 0 && isStreaming`) — `mt-2`
3. `ThinkingBubble` (só se `isThinking`) — aparece enquanto a última msg assistant está vazia
4. Erro (se houver)

Ou seja: **a ToolStepsList aparece DEPOIS de todas as mensagens e ANTES da bolha de "thinking"** — ou seja, ABAIXO da última mensagem do assistant, e o thinking bubble é a última coisa visível (anexa visualmente à tool ativa). Não é painel lateral; é uma lista inline vertical no fluxo do scroll.

### Quando a IA chama uma tool (em progresso / loading) e quando dá sucesso

- **Loading**: o `HttpChatTransport` recebe SSE `event: tool_step` com `phase: 'call'`, pusha no array de eventos; o `for await` no `ChatArea` (chat-page.tsx:103-107) faz `setToolSteps(prev => [...prev, { toolName, phase: 'call', args, output }])`. A `ToolStepsList` renderiza a linha com `Loader2 animate-spin` + label colorido (azul/primário) — ver tool-steps-list.tsx:48-65.
- **Sucesso**: o SSE `event: tool_step` chega com `phase: 'result'` e `output` preenchido; o `setToolSteps` ACRESCENTA um novo item (não atualiza o anterior — chat-page.tsx:104). A linha correspondente fica verde (`CheckCircle2` + "concluído"). O ÍNDICE no array é a chave (tool-steps-list.tsx:46 `key={idx}`) — então o item de "result" e o de "call" da mesma tool têm chaves diferentes e ambos aparecem (um com Loader2+call, outro com CheckCircle2+result). **Possível duplicação visual** se o backend mandar `call` e `result` como entradas separadas.
- **Ícones/label por tool** vivem em `tool-steps-list.tsx:12-27` (`TOOL_META`: list_connections, get_connection_schema, run_query, list_catalog, create_chart, update_chart, publish_chart, preview_chart_data, create_dashboard, update_dashboard, add_chart_to_dashboard, publish_dashboard, activate_skill). Tool desconhecida cai no fallback `step.toolName`.
- O `ThinkingBubble` (thinking-indicator.tsx:39-50) só conhece 5 tools (lista menor em `TOOL_ICONS`/`TOOL_LABELS` linhas 8-21). Tools fora dessa lista (ex.: `publish_dashboard`) não ganham ícone próprio no thinking — cai no `Loader2` default.

### Props/estado que controlam posição e visibilidade do efeito de tool

- **`toolSteps`**: estado local do `ChatArea` (chat-page.tsx:33-36). Tipo `Array<{ toolName: string; phase: 'call'|'result'; args?; output? }>`. **Resetado em dois lugares**: troca de `conversationId` (chat-page.tsx:45) e a cada novo `send()` (chat-page.tsx:66).
- **`isStreaming`**: `boolean` local. Liga em `send()` (chat-page.tsx:68), desliga no `finally` (chat-page.tsx:114). É o portão da visibilidade: `toolSteps.length > 0 && isStreaming` (chat-page.tsx:131). **Quando o stream termina (`isStreaming=false`), a ToolStepsList SOME inteira** — não há histórico persistente de tool calls. As tools só aparecem ENQUANTO o agente está respondendo.
- **`isThinking`**: derivado (chat-page.tsx:118-119): `isStreaming && lastMsg.role === 'assistant' && lastMsg.content.length === 0 && !lastMsg.chart`. Controla só a `ThinkingBubble`, não as tools.
- **Layout/posição**: controlado pelo `flex flex-col` do `ChatArea` (chat-page.tsx:122) — tools vêm após `ChatMessageList` e antes de `ThinkingBubble`. A `ToolStepsList` em si é `flex flex-col gap-1 mt-2` (tool-steps-list.tsx:37).

### O que controla o "closepanel" (botão de fechar?)

**NÃO EXISTE** "closepanel" / botão de fechar / chevron / collapse na feature chat. Confirmei por busca (sem matches pra `closepanel|closePanel|close_panel|Collapse|isOpen|setOpen` no diretório da feature). A visibilidade da `ToolStepsList` é TOTALMENTE derivada:

```
visible = toolSteps.length > 0 && isStreaming
```

Quando `isStreaming` vira `false` (fim do stream OU `stop()`), a lista desaparece de uma vez — sem transição, sem estado intermediário. Cada nova `send()` também zera (`setToolSteps([])` em chat-page.tsx:66). **Se você quiser um painel "fechável manualmente" pra mostrar histórico de tool calls, isso é um acréscimo novo** (ex.: um `useState<boolean>` tipo `showToolHistory`, um botão X no header da `ToolStepsList`).

## Pontos de atenção (armadilhas e detalhes)

1. **Mock NÃO emite `tool_step`** — só `HttpChatTransport` emite (mock-transport.ts vs http-transport.ts:117-123). Se o `ChatTransportProvider` injetar mock, a `ToolStepsList` NUNCA aparece, mesmo com tools rodando. Hoje, o `defaultMockTransport` é o default do `createContext` (transport-context.ts:11) — o que significa que **a feature visível em dev sem o `ChatTransportProvider` montado no topo da árvore é o mock e a ToolStepsList não aparece**. Verifiquei: **NÃO há `ChatTransportProvider` no `providers.tsx` da app** (grep `grep -rl "ChatTransportProvider" src/` só retornou a própria feature). O `ChatPage` instancia `new HttpChatTransport(...)` direto dentro do `send()` (chat-page.tsx:74). Logo: **em runtime o transporte é SEMPRE o real** (Http), e a `ToolStepsList` aparece quando o backend manda os eventos `tool_step`. O mock só seria usado se a página usasse `useChatTransport()` em vez de instanciar direto. Risco: a lógica de mock é "morta" no `ChatPage` atual, mas segue sendo a do `defaultMockTransport` do contexto — vale revisar quando unificar.

2. **Hook `useChat` (use-chat.ts) é dead code do `ChatPage`** — o `ChatPage` reimplementa `messages + isStreaming + error + send + stop` inline em `ChatArea`. Se quiser componentizar ou mover o transporte para o provider, esse hook está pronto. Hoje é fonte de divergência (mudou `transport`, a `signal` é via `controller` local, etc.).

3. **`tool_step` como evento ADITIVO** — a UI só faz `setToolSteps(prev => [...prev, novo])` (chat-page.tsx:104). Não substitui o `phase: 'call'` quando chega o `phase: 'result'` da mesma tool. **A lista vai crescendo com `call` + `result` lado a lado** (visualmente, a mesma tool aparece 2x: "Executando query" com Loader e "Executando query" com Check). Se o backend manda só o `result` consolidado, não duplica; se manda `call`+`result`, duplica. Verificar comportamento real do backend `POST /agent/chat/:conversationId` SSE.

4. **Pensamento de "fechar/ocultar panel"** — se a feature pedida é "deixar a ToolStepsList visível depois do stream terminar como histórico (com botão de fechar)", o caminho menos invasivo é:
   - Tirar a condição `&& isStreaming` em chat-page.tsx:131 (passa a mostrar enquanto `toolSteps.length > 0`).
   - Adicionar um `useState<boolean>` `showToolHistory` (ou `dismissed`) e um `X` no header da `ToolStepsList`.
   - Resetar `toolSteps` e `dismissed` em `send()` para que a próxima tool call reabra.

5. **Altura do chat HOJE**: `h-[calc(100vh-7rem)]` no wrapper do `ChatPage` (chat-page.tsx:260) — mas o `DashboardLayout` (dashboard-layout.tsx:36) já tem `h-screen overflow-hidden` com `<main overflow-y-auto>`. A conta 7rem (112px) é: 4rem do topbar (h-14) + 2x py-4 (32px) do padding do main + 4px de bordas. **Resultado: o `ChatPage` cabe EXATAMENTE na altura do main interno; o scroll é INTERNO (`overflow-y-auto` em chat-page.tsx:125) e a página NÃO rola**. Se o wrapper `h-[calc(100vh-7rem)]` ficar maior que a área disponível (ex.: topbar crescer, ou `lg:py-8` ser maior que 4), a `ChatArea` ainda tem `min-h-0 flex-1` que segura o scroll interno. Se a conta der MENOR que o necessário, o wrapper corta; mas como é `flex-1` na coluna, ele se expande até o limite do main. Resumo: **NÃO há bug de "scroll geral da página" no chat hoje** — está dimensionado pra scroll interno. O 7rem é heurístico, mas está consistente com o `DashboardLayout`.

6. **Sincronia com `message_start` + `message_end`**: o `HttpChatTransport` é quem sabe quando a stream fechou (evento `final` ou `error`). O `ChatPage` confia só no `try/finally` (chat-page.tsx:108-115) — funciona, mas se o backend esquecer de mandar `final`, a UI fica com `isStreaming=true` eternamente. Mitigação existe se o stream SSE fechar (fetch Promise resolve).

7. **Render do chart inline é controlado por `message.chart`** (chat-message-bubble.tsx:75-79) — não pelas tools. Tools e chart inline são ORTHOGONAIS: o agente pode mandar `tool_step` sem `chart`, ou mandar `chart` sem tools. A `ToolStepsList` aparece junto com o `message.chart` se `isStreaming` (chart fica dentro da bolha, tools ficam abaixo dela, entre a bolha e a `ThinkingBubble`).

8. **Animação de entrada** da `ToolStepsList` é por linha (`animate-in fade-in slide-in-from-left-2 duration-300`) — não é entrada de "painel", é cada step entrando individualmente. Se a UI virar "painel", provavelmente troca por uma animação de container (slide-in-from-top-2 no root).

## Lacunas / o que não deu pra confirmar

- **Como o backend `POST /agent/chat/:conversationId` enfileira eventos `tool_step`**: o FE trata cada evento como aditivo; se o backend mandar `phase: 'result'` substituindo o `call` anterior (em vez de adicionar), o FE duplica. Sem um teste E2E (Playwright + browser MCP) contra o backend real, não dá pra confirmar o comportamento exato. Recomendação: rodar `get_process_output` no `be` e ver o log de SSE, ou testar uma tool com browser e inspecionar o array `toolSteps` no DevTools.
- **Hook `useChat` em `use-chat.ts` é totalmente substituído pelo `ChatArea` inline** — o que está "em uso" vs "preparado para T-H2" não é totalmente claro. Não verifiquei se há outros consumidores.
- **Largura da área de chat no mobile**: o chat usa `flex` com sidebar `w-64` (256px) fixa em `shrink-0`. Em viewport < 768px a sidebar pode ocupar quase toda a tela, deixando a área de chat espremida. Não vi media queries pra colapsar a sidebar no chat (o `DashboardLayout` tem `collapsed` mas é só pro `AppSidebar` global, não pro `ChatSidebar` interno que é uma segunda sidebar).
- **Comportamento de `text_delta` em tools**: tools rodam "entre" os deltas de texto, então durante `tool_step` o `text_delta` do assistant fica parado. Não verifiquei se o backend emite `text_delta` durante a tool ou só antes/depois — provavelmente só entre, mas vale conferir.

## Resumo das linhas exatas que o pai vai querer ler (resumo ultra-curto)

- `features/chat/components/chat-page.tsx:33-36` — estado `toolSteps` + `isStreaming`.
- `features/chat/components/chat-page.tsx:103-107` — switch do `for await` que popula `toolSteps` no `phase: 'tool_step'`.
- `features/chat/components/chat-page.tsx:130-132` — **decisão de visibilidade da ToolStepsList** (ABAIXO das mensagens, ACIMA do thinking).
- `features/chat/components/chat-page.tsx:260` — wrapper de altura `h-[calc(100vh-7rem)]` (cabe no main do DashboardLayout, scroll é interno).
- `features/chat/components/tool-steps-list.tsx:33-71` — UI da lista (sem X/collapse).
- `features/chat/components/chat-message-bubble.tsx:75-79` — chart inline renderizado dentro da bolha, ABAIXO do texto.
- `features/chat/transport/http-transport.ts:117-123` — onde o real parseia `tool_step` do SSE.
- `features/chat/transport/mock-transport.ts:55-76` — mock NÃO emite `tool_step` (então ToolStepsList nunca aparece com mock).
- `app/dashboard-layout.tsx:36,53` — shell autenticado, `<main overflow-y-auto>` que segura o overflow global; chat cabe dentro.
- `features/chat/routes.tsx:18-26` — rota `/chat` com `RequireRole permission="artifacts:manage"`.
