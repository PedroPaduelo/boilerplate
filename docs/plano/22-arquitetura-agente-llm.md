# 22 — Arquitetura do Agente de IA (LLM + MCP) — DISCUSSÃO A FUNDO

> Status: EM DISCUSSÃO (usuário pediu para discutir a fundo). Decisão pendente.

## Por que é decisão estruturante
Afeta: F2 (backend), módulos 05 (MCP) e 06 (chat), modelagem de chat (30), segurança
e custo. Precisa ser fechada antes de detalhar 05/06.

## Eixo 1 — PRIVACIDADE (provavelmente o mais importante: é prefeitura / LGPD)
A IA vê **dados reais da prefeitura** (resultados de query) e schema dos bancos.
- [ ] Pode trafegar para LLM em nuvem (OpenAI/Anthropic/Azure)?
- [ ] Precisa Azure OpenAI (acordo de não-treinamento) / região específica?
- [ ] Precisa modelo **self-hosted** (on-premise) por exigência legal?
- [ ] Estratégia de minimização: mandar só amostra/schema e não o dataset inteiro?

## Eixo 2 — ONDE roda o loop do agente
**Opção A — Loop próprio no backend (Fastify).** Backend orquestra LLM↔tools (MCP
in-process), streaming via Socket.IO.
- + Controle total, integra auth/RBAC, dados só vão ao LLM escolhido, simples de operar.
- − Implementar orquestração (tool-calling, memória, retries).

**Opção B — Runtime de agentes externo já existente** (ex.: o `orquestrador` do
`.mcp.json`, ou Mastra/serviço dedicado). Nosso backend só **expõe o MCP server**
(tools: query, catálogo, config) e o runtime externo consome.
- + Menos código de orquestração; reusa infra.
- − Acoplamento, latência, auth entre serviços, dados trafegam para fora.

**Opção C — Híbrido**: backend expõe MCP server + um "agent-service" fino roda o loop
(mesmo processo ou container separado). Equilíbrio entre A e B.

## Eixo 3 — MCP server: in-process vs separado
- In-process no Fastify (rota /mcp) reusa Prisma/Redis/serviços direto.
- Processo separado isola, mas duplica acesso a dados.

## Eixo 4 — Itens que dependem da escolha
- Modelagem de chat (ChatThread/ChatMessage) só se o loop for nosso (Opção A/C).
- "Perguntas estruturadas" do agente ao usuário (escolher conexão) — protocolo no chat.
- Streaming de tokens/gráficos pro front (Socket.IO).
- **Skills/rules** do agente (usuário citou "agente que lê skills/rules") — onde vivem,
  formato (arquivos? banco?).
- Provider/modelo + chave + limites de custo.

## Recomendação preliminar do planner (a validar)
Para uma prefeitura, **Opção A ou C** + **MCP in-process** tende a ser o mais seguro
e controlável (dados não passam por orquestrador de terceiros além do LLM). O ponto
crítico é o Eixo 1 (privacidade) — ele dita se o LLM pode ser nuvem ou precisa ser
self-hosted, e isso muda provider e custo.

## ✅ Decisões travadas (rodada 3)
- **Privacidade**: LLM em nuvem (OpenAI/Anthropic) está OK. Sem self-hosted.
- **Onde roda o loop**: **Opção B — runtime EXTERNO** consome nosso MCP. Nosso backend
  NÃO roda LLM, NÃO orquestra agente, NÃO armazena chat.
- **Skills/rules**: é uma **ferramenta específica que o usuário já usa** → AGUARDANDO ele
  dizer qual (bloqueia detalhes de transporte/auth do MCP e onde o chat-UI vive).

## ⚠️ Questão crítica aberta (depende de qual ferramenta)
Como o agente roda externo, **onde fica o "chat com gráficos + botão adicionar ao
dashboard"** que o usuário descreveu?
- (a) Na própria ferramenta externa (ela renderiza nossos gráficos? improvável sem embed);
- (b) Nosso FE tem um chat que conversa com a API da ferramenta externa;
- (c) A ferramenta externa só CRIA via MCP e o usuário vê o resultado abrindo o
      gráfico/dashboard no nosso FE (sem "gráfico no chat").
→ Resolver assim que soubermos a ferramenta.

## ✅ Decisões travadas (rodada 4) — integração definida
- A **gestão do agente é 100% externa**. O usuário fornecerá uma **API** do agente.
- **Nosso FE tem o chat embutido** e fala com essa API externa.
- O agente externo usa **nosso MCP** para listar conexões, rodar query, criar/publicar
  charts e dashboards.
- Fluxo do "gráfico no chat": agente cria via MCP → retorna `chartId` → nosso FE
  **renderiza inline com o mesmo render engine do dashboard** → botão "adicionar ao
  dashboard" chama nossa API/MCP.
- Pendência menor: o chat do FE chama a API externa **direto** ou via **proxy fino no
  nosso BE** (recomendo proxy só p/ esconder credenciais/padronizar auth — não é
  "gerir agente", é forward). Ver F3.
- Falta o usuário entregar: **spec da API externa** (endpoints, auth, formato de
  streaming) — necessária para implementar o chat (T-H).
