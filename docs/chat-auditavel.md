# O chat auditável

Como funciona a tela `/chat` depois do redesenho — e, principalmente, **por que**
ela é assim.

## A tese

O auditorIA promete "respostas auditáveis". Antes, a tela entregava a
**conclusão** do agente e escondia a **evidência**: qual conexão ele abriu, qual
SQL executou, quantas linhas voltaram, quanto tempo levou.

Uma resposta com a qual não dá para discordar não é auditoria — é opinião bem
formatada. O redesenho inteiro sai daí: **toda afirmação chega acompanhada da
prova de como foi obtida**, durante o streaming e depois dele.

Por isso a ordem dentro de cada resposta é *trilha → texto*, e não o contrário.
Quem lê passa antes pelo que o agente fez.

## As peças

```
┌── backend ────────────────────────────────────────────────────────────┐
│ audit-trail.ts        traduz retorno cru de tool → evidência (PURO)   │
│ run-agent-background  orquestra: quando emitir, como medir, persistir │
│ run-store.ts          estado retomável no Redis (trilha + gráficos)   │
└───────────────────────────────────────────────────────────────────────┘
                     │  socket, sala chat:{conversationId}
                     ▼
┌── contrato ───────────────────────────────────────────────────────────┐
│ shared/contracts/src/socket/chat.ts   — a costura, campos opcionais   │
└───────────────────────────────────────────────────────────────────────┘
                     ▼
┌── frontend ───────────────────────────────────────────────────────────┐
│ model.ts              vocabulário da tela (AuditStep, ChatMessageTrail)│
│ lib/chat-tools.ts     socket → passo · toolData → passo · passo → DS  │
│ lib/conversation-state reducer: trilha vive JUNTO da mensagem         │
│ components/audit-*    a trilha e a evidência                          │
└───────────────────────────────────────────────────────────────────────┘
```

## Eventos do turno

Todos na sala `chat:{conversationId}`. Contrato completo e comentado em
`shared/contracts/src/socket/chat.ts`.

| Evento | O que resolve |
| --- | --- |
| `chat:delta` | texto em streaming (já existia) |
| `chat:phase` | "O agente está trabalhando…" não informa nada. `thinking`/`tool`/`writing` + rótulo ("Executando consulta · teste") |
| `chat:tool-step` | passo com **SQL**, conexão, linhas, duração, amostra, status e marca de ação destrutiva |
| `chat:chart` | o gráfico renderizável — **declarado desde sempre e nunca emitido** |
| `chat:artifact` | o que foi criado vira cartão acionável, em vez de sumir na listagem |
| `chat:usage` | tokens/tempo/passos no rodapé |
| `chat:title` | a conversa deixa de se chamar "Nova conversa" sem esperar um F5 |

**Todo campo de auditoria é opcional.** Um backend antigo degrada para o que
existia; um frontend antigo ignora o que não conhece. Isso permite subir os dois
lados em ordens diferentes.

## Três decisões que não são óbvias

### 1. A trilha vive junto da MENSAGEM

Antes, os passos moravam num campo único da conversa (`toolSteps`). Efeito: a
trilha da resposta anterior sumia quando chegava uma nova, e **nada sobrevivia ao
recarregar** — mesmo com os passos já gravados no banco desde sempre, em
`ChatMessage.toolData`, lidos por ninguém.

Agora é `trails[messageId]`, alimentado tanto pelo socket quanto pelo histórico
(`readPersistedTrail` entende o formato novo, o antigo e lixo).

Detalhe que só aparece em uso real: **as ferramentas rodam antes do primeiro
delta**, que é o que abre a bolha do agente. Os passos ficam num `pendingTrail` e
são *adotados* pela mensagem quando ela nasce — é o que amarra "executei este
SQL" à resposta que veio dele.

### 2. Casamento por `toolCallId`, nunca por índice

O código antigo casava `toolCalls[i]` com `toolResults[i]`. Mas `toolResults` é
`content.filter(type === 'tool-result')` e **um erro de ferramenta vira parte
`tool-error`, que não entra nessa lista**. Com duas chamadas em que a primeira
falha, `toolResults[0]` é o resultado da *segunda* — e a trilha passaria a
mentir sobre qual ferramenta produziu qual resultado.

Reproduzido com o `streamText` real antes de corrigir. Numa feature cuja razão de
existir é ser confiável, esse era o pior bug possível.

### 3. O gráfico não pode depender da rota que o modelo escolheu

`chat:chart` nasce do encontro de duas ferramentas: `create_chart` traz a
definição (título, tipo, props, binding) e **só** `preview_chart_data` traz os
dados. Mas o preview é opcional para o agente.

Medido na aplicação: ele criou o gráfico e respondeu sem pré-visualizar — o
usuário recebeu um cartão "Abrir gráfico" sem gráfico. Por isso o servidor
materializa os dados que faltaram no fim do turno
(`materializarGraficosPendentes`), com prazo, teto de tamanho e a regra de nunca
atrapalhar a resposta que já está pronta.

## Regras que valem para quem mexer aqui

- **Segredo nunca entra na trilha.** `list_connections` devolve host/usuário e
  `create_dashboard_share_link` devolve um token de acesso público: nada disso é
  extraído. Coberto por teste que serializa o resultado e procura o segredo.
- **Amostra tem teto** (8 linhas × 12 colunas), com `totalRows` guardando a
  verdade. Mandar 500 linhas por socket trava a aba e não ajuda a auditar.
- **Nada de auditoria pode derrubar o turno.** Output malformado degrada para o
  rótulo da ferramenta; falha ao emitir é engolida. O trabalho do agente vale
  mais que a legenda.
- **Os rótulos de ferramenta existem em dois lugares** — `TOOL_TITLES`
  (backend, fonte da verdade) e `TOOL_LABELS` (frontend, plano B para histórico
  antigo). Precisam ser idênticos; enquanto divergiram, o mesmo passo tinha dois
  nomes conforme a idade da conversa.

## Verificação

```bash
cd backend-boilerplate
npx tsc --noEmit -p tsconfig.json
npx jest --config jest.config.js tests/agent tests/unit --forceExit   # 322 testes

cd ../frontend-boilerplate
npx tsc -b --noEmit                       # limpo (exceto 2 erros pré-existentes)
npx vitest run --config vite.config.ts    # 539 testes
npx eslint src --max-warnings=0
```

## O que ficou de fora, e por quê

- **Aprovação prévia de ação destrutiva.** O agente tem `delete_chart`,
  `delete_dashboard` e `unpublish_*`, e há uma conversa real na base começando
  com *"Deleta todos os gráficos e os dashes que tiver aí"*. Implementar
  aprovação exige pausar o loop do AI SDK e reter o turno no Redis à espera da
  resposta — mudança de arquitetura, não de tela. O que existe hoje é o passo
  destrutivo **marcado** na trilha (`isDestructive`), para que uma exclusão feita
  em nome do usuário não passe despercebida.
- **Feedback 👍/👎 persistido.** O componente existe e é acessível, mas não é
  ligado: sem endpoint, o botão registraria a opinião em lugar nenhum — e botão
  que não faz nada é pior que botão ausente. Precisa de uma coluna em
  `ChatMessage` e uma rota.
- ~~**Restaurar o gráfico ao recarregar.**~~ **Feito.** `readPersistedChart`
  (em `lib/chat-tools.ts`) lê `toolData.charts` e `toUiMessage` devolve o
  gráfico junto da mensagem. A validação é de forma (`title`, `catalogType`,
  `result` presentes) e o **último válido vence** — a mesma regra do streaming,
  em que cada evento `chart` sobrescreve o anterior na mensagem. Ressalva
  honesta: um turno que produziu vários gráficos (há um com 7 nesta base)
  continua exibindo só um; mudar isso mexe no modelo, no reducer e no contrato
  (ROADMAP § 9).
