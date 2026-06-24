# Plano de Integração: Motor de Agente de IA no Boilerplate

## Situação Atual

### Frontend
- `/chat` existe com UI COMPLETA: ChatPage, ChatMessageList, ChatMessageBubble, ChatInput, InlineChart, ThinkingIndicator
- Transport layer já abstraída: `ChatTransport` interface com `sendMessage(history) → AsyncIterable<ChatEvent>`
- Eventos: message_start, text_delta, chart, message_end, error
- HOJE usa MockChatTransport (simula respostas)
- UI + hooks prontos — SÓ precisa trocar o transport de Mock pra HTTP (SSE)

### Backend
- Fastify + Prisma + Redis + Socket.IO + BullMQ
- Auto-discovery de módulos via `@fastify/autoload` (cada módulo = pasta com index.ts)
- Socket.IO já configurado com auth JWT
- NÃO tem `ai`, `@ai-sdk/anthropic`, `ws` (tem socket.io)
- Env NÃO tem ANTHROPIC_API_KEY / AI_BASE_URL
- Prisma NÃO tem modelos Conversation/Message/Agent

### Arquivos do Usuário (motor do agente)
1. **schemas.ts** — Zod schemas de config (CacheOptions, BaseAgentConfig, etc)
2. **anthropic.ts** — wrapper @ai-sdk/anthropic com cache_control, metadata, providerOptions
3. **messages.ts** — monta messages com cache breakpoints (ephemeral)
4. **loop.ts** — runAgent(): generateText do AI SDK com stopWhen=stepCountIs, onStepFinish → sink
5. **bootstrap.ts** — bootstrapAgent(): workspace, systemPrompt, skills, tools, provider
6. **skills/index.ts** — loadSkills(.skills/*.md), renderSkillsIndex, createActivateSkillTool
7. **session.ts** — Session { messages, mcpHandle, busy }
8. **ws.ts** — attachWsServer(): WebSocket com runTurn → bootstrapAgent → runAgent → broadcast
9. **http.ts** — createHttpServer(): serve chat.html + REST /history, /reset
10. **load.ts** — loadTestConfig/loadChatConfig

## Plano de Implementação

### FASE 1 — Backend: infra do agente (motor + endpoint SSE)

#### 1.1 Instalar dependências
```
npm install ai @ai-sdk/anthropic @ai-sdk-provider-utils
```

#### 1.2 Criar módulo `agent` em `backend-boilerplate/src/modules/agent/`
- `config/schemas.ts` ← adaptado de schemas.ts (Zod configs do agent)
- `provider/anthropic.ts` ← adaptado de anthropic.ts (createAnthropicWithExtras)
- `agent/messages.ts` ← adaptado de messages.ts (buildMessages com cache breakpoints)
- `agent/loop.ts` ← adaptado de loop.ts (runAgent com generateText)
- `agent/bootstrap.ts` ← adaptado de bootstrap.ts (bootstrapAgent)
- `skills/index.ts` ← adaptado de skills/index.ts (loadSkills + activate_skill tool)
- `sinks/types.ts` — AgentSink interface
- `sinks/sse-sink.ts` — sink que escreve SSE events
- `routes/agent-chat.ts` — POST /agent/chat (SSE stream)
- `routes/agent-history.ts` — GET /agent/history/:sessionId
- `routes/agent-reset.ts` — POST /agent/reset/:sessionId
- `index.ts` — Fastify plugin que registra as rotas

#### 1.3 Adaptar ferramentas (tools)
O agente precisa de tools que fazem sentido no boilerplate:
- `activate_skill` — do skills/index.ts
- `list_connections` — lista conexões disponíveis (usa prisma)
- `run_query` — executa query read-only numa conexão (usa pg-runner)
- `list_catalog` — lista blocos do catálogo
- `create_chart` — cria um chart via prisma
- `create_dashboard` — cria um dashboard
- As tools do MCP existente podem ser reaproveitadas!

#### 1.4 Env vars novas
```
ANTHROPIC_API_KEY=...
AI_BASE_URL=https://api.anthropic.com  (ou proxy)
AI_MODEL=claude-sonnet-4-20250514
```

#### 1.5 Sessões em memória (Map<sessionId, Session>)
- Single-tenant por enquanto (como o ws.ts original)
- Histórico acumulado por sessionId
- Reset por sessionId

### FASE 2 — Backend: endpoint SSE

#### 2.1 `POST /agent/chat`
- Body: `{ message: string, sessionId?: string }`
- Auth: JWT (bearer token)
- Response: SSE stream (text/event-stream)
- Eventos SSE:
  - `event: message_start` → `{ messageId }`
  - `event: text_delta` → `{ messageId, delta }`
  - `event: chart` → `{ messageId, chart: ChatChartPayload }`
  - `event: tool_step` → `{ toolName, toolCallId, args, output }`
  - `event: usage` → `{ inputTokens, outputTokens, cachedInputTokens }`
  - `event: message_end` → `{ messageId }`
  - `event: error` → `{ message }`

#### 2.2 O agente cria charts e devolve `ChatChartPayload`
Quando o agente usa `create_chart`, o resultado vira um evento `chart` com:
- `chartId` (criado no DB)
- `title`, `catalogType`, `props`
- `result` (BlockDataResult do preview)
- `dataBinding`

### FASE 3 — Frontend: HttpChatTransport

#### 3.1 Criar `transport/http-transport.ts`
- Implementa `ChatTransport.sendMessage()` consumindo SSE de `/agent/chat`
- Conecta com `fetch` + `ReadableStream` (EventSource não suporta POST + Auth header)
- Parse SSE events → ChatEvent
- AbortSignal para parar

#### 3.2 Trocar default no `transport-context.ts`
- Default: `HttpChatTransport` em vez de `MockChatTransport`

#### 3.3 Atualizar tipos `ChatEvent`
- Adicionar `tool_step` (opcional)
- Adicionar `usage` (opcional)

#### 3.4 UI: mostrar tool steps
- ThinkingIndicator já existe; adaptar para mostrar "Consultando dados..." etc
- Badge tira "Demo (mock)" e mostra modelo/usage

### FASE 4 — Validação
- tsc FE + BE limpos
- Lint limpo
- Testes existentes passando (MockChatTransport continua funcionando para testes)
- Backend sobe sem erro
- Chat funciona end-to-end via browser

## DECISÕES
1. **SSE em vez de WebSocket**: o FE já tem Socket.IO, mas SSE é mais simples pra streaming unidirecional (agent → user). O POST envia a mensagem, a resposta vem via SSE. Sem estado de conexão persistente.
2. **Sessões em memória**: Map<sessionId, Session> no backend. Simples, funciona. Depois pode virar Redis/DB.
3. **Skills do disco**: ler de `.skills/*.md` no workspace do backend (ou da pasta skills do sistema).
4. **Tools integradas com o sistema existente**: o agente opera Diretamente no DB (Prisma) + pg-runner + catálogo — não via HTTP loopback.
5. **ChatChartPayload igual ao contrato existente**: o agente devolve exatamente o que o InlineChart e o AddToDashboardDialog já esperam.
