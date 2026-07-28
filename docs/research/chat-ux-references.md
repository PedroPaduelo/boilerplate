# Referências de UX para o chat do auditorIA

Pesquisa feita para o redesenho da tela `/chat`. Cada referência aqui está
ligada a uma decisão de projeto — o que não virou decisão não entrou na lista.

**O critério.** O auditorIA não é um chatbot genérico com acesso a banco. É uma
ferramenta de **auditoria**: o valor não está na resposta, está em **poder
discordar dela**. Por isso as referências foram lidas procurando uma coisa
específica — *como cada produto prova o que afirma*.

---

## 1. Vercel AI Elements — o vocabulário de UI de agente

<https://elements.ai-sdk.dev> · prints: `overview`, `chain-of-thought`, `tool`

Biblioteca da Vercel sobre shadcn/ui com os padrões consolidados de interface
para agentes. Serve como **inventário de padrões**, não como código a copiar
(nosso DS é o Astryx).

Padrões relevantes, e o que fizemos com cada um:

| Padrão deles | O que resolve | Nossa decisão |
| --- | --- | --- |
| `ChainOfThought` (passos com status `complete/active/pending`) | mostrar o raciocínio como progresso, não como spinner | virou a **Trilha de auditoria** |
| `Tool` com 7 estados (`Pending`, `Running`, `Completed`, `Error`, `Awaiting Approval`, `Denied`, `Responded`) | um passo de ferramenta tem ciclo de vida, não só "carregando" | `AuditStep.status` (`running`/`ok`/`error`) |
| `Task` / `TaskItemFile` | o alvo da ação importa tanto quanto a ação | campo `target` (tabela, gráfico) |
| `Sources` / `InlineCitation` | rastrear a origem de cada afirmação | nossa citação é **o SQL + a conexão** |
| `Artifact` | o que o agente produziu vira objeto de primeira classe | `ArtifactCard` ("Abrir dashboard") |
| `Actions` no `Message` | copiar / refazer / feedback | `MessageActions` |
| `Confirmation` | aprovar ação antes de executar | **não implementado — ver "Recomendações"** |
| `Context` | consumo de tokens/janela | rodapé discreto (`usage`) |
| `CodeBlock` | código legível com cópia | o **SQL** dentro do passo |
| `Suggestion` | tirar o usuário do branco da página | cartões do estado vazio + follow-ups |

> A lição que mais pesou: **os sete estados do `Tool`**. Um passo de ferramenta
> não é binário. Nossa tela tratava tudo como "usou uma ferramenta", inclusive
> falhas — que simplesmente sumiam.

## 2. ThoughtSpot Spotter — "verifiability" como argumento de venda

<https://www.thoughtspot.com/product/agents/spotter> · print: `spotter-hero`, `spotter-verifiability`

Posicionamento: *"The most trusted enterprise agent for analytics"*,
*"delivering verifiable, no-hallucination insights"*. As seções do produto são
**"Deterministic Insights, Full Verifiability"** e *"Reasons Like Your Best
Analyst"*.

**O que confirma para nós:** num produto de análise, verificabilidade não é
detalhe técnico — é *a* proposta de valor, exposta na primeira dobra. Um chat de
auditoria que esconde a query está escondendo justamente aquilo que o mercado
já entendeu como o diferencial.

→ Decisão: **o SQL é conteúdo de primeira classe da resposta**, não um detalhe
de depuração.

## 3. Databricks AI/BI Genie — governança e feedback

<https://www.databricks.com/product/genie/agents> · print: `genie`

Features que o produto destaca: **Trusted Answers**, **Response Feedback**
(👍/👎 + pedido de revisão + comentário), **Sample Questions**, **Chat History**,
**Integrated Activity Monitoring**, **Accuracy Benchmarks**. O texto de
benefício diz que a integração com o catálogo garante respostas *"secure and
auditable"*.

**O que confirma:** feedback do usuário sobre a resposta é feature de primeira
classe em BI conversacional — porque o agente erra, e o produto precisa
descobrir *onde*. E "perguntas de exemplo" é reconhecido como remédio para o
problema do blank slate.

→ Decisões: **feedback 👍/👎 na resposta** e **cartões de partida** no estado
vazio (este já existia; foi mantido e afinado).

---

## O que foi descartado de propósito

- **Animação de entrada por mensagem.** Atrasa a leitura e cansa em uso diário.
  O movimento fica onde carrega informação: os passos aparecendo conforme
  acontecem.
- **Avatar animado / "digitando…" com três pontinhos.** Ocupa espaço para dizer
  "aguarde". A fase do turno (`Consultando teste · Postgres`) diz a mesma coisa
  informando.
- **Gradientes, glow, vidro colorido.** O público é auditoria de dados públicos;
  sobriedade é credibilidade. O "uau" tem de vir de *ver o trabalho acontecendo*
  e poder conferir — não de efeito visual.
- **Som.** Nunca, numa ferramenta usada em escritório aberto.

## Recomendação que ficou fora desta entrega

**Aprovação prévia de ação destrutiva** (o `Confirmation` do AI Elements). O
agente tem `delete_chart`, `delete_dashboard`, `unpublish_*` e as executa
direto — há inclusive uma conversa real na base começando com *"Deleta todos os
gráficos e os dashes que tiver aí"*. Implementar aprovação exige pausar o loop
do AI SDK e reter o turno no Redis à espera da resposta do usuário: é uma
mudança de arquitetura, não de tela.

O que esta entrega faz é o passo intermediário honesto: **marcar o passo
destrutivo na trilha** (`isDestructive`), para que uma exclusão feita em nome do
usuário não passe despercebida. A aprovação prévia fica registrada como próximo
passo.
