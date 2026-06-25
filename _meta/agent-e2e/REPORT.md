# T6 — Validação E2E completa do agente de BI

**Data:** 2026-06-25
**Escopo:** validar que o agente de IA da plataforma `auditorIA` consegue, via chat, criar dashboards ponta a ponta, exercitando os 5 fixes (T1–T4 + T5) aplicados nos commits `cc16d8e`, `9b4aba5`, `29b2300`, `2267219`.
**Método:** `_meta/agent-e2e/test-scenarios.sh` (5 cenários de chat, captura de SSE, análise de cada stream). BE estava saudável (`curl /agent/health → {"configured":true,...}`).
**Resultado dos 5 cenários em ~70s** (não 15-20min: o agente parou cedo em todos).

---

## 1. Por cenário

| # | Prompt | Eventos | Tools chamadas | Veredito | O que aconteceu |
|---|---|---|---|---|---|
| 1 | "Crie um KPI mostrando o total de receita prevista de Palmas em 2025" | 7 | 1× `activate_skill` (404) | ❌ **FALHOU** | Tentou ativar `construtor-dashboards` → 404 "Skill não encontrada". Caiu no fallback "playbook canônico" e ficou em modo **entrevista** ("qual conexão?", "qual definição de receita prevista?") — não chamou nenhuma outra tool. Texto final: 6 perguntas de alinhamento. |
| 2 | "Crie um dashboard de receita Palmas 2025 com 5 visualizações…" | 11 | 1× `activate_skill` (404), 1× `list_connections` | ❌ **FALHOU** | Mesmo 404 no activate_skill. Tentou `list_connections(search="Palmas")` → achou 1 conexão (`palmas`). Depois ficou em modo **entrevista** com tabela de 5 decisões propostas + 5 perguntas de confirmação. **Nenhum chart criado.** |
| 3 | "Monte um gráfico de barras horizontais top 10 contratos de compras de Palmas, em reais" | 7 | 1× `activate_skill` (404) | ❌ **FALHOU** | Mesmo padrão. Caiu em 6 perguntas de alinhamento (objetivo, período, município, status do contrato, granularidade do eixo Y, conexão). Não chamou `run_query` nem `get_connection_schema`. |
| 4 | "Crie um gráfico de pizza com os 5 maiores inadimplentes do IPTU de Palmas (se a fonte não tiver, me avise)" | ~50 | 1× `activate_skill` (404), 8× `run_query` (4 com erro `internal_error: required connectionId/sql`, 4 com sucesso) | ❌ **FALHOU** | **O único cenário que avançou além de `list_connections`.** Tentou `get_connection_schema` (não apareceu no log — provavelmente embutido no `run_query` em `information_schema.columns`). Fez múltiplas queries para descobrir o schema de `CONSULTA_DIVIDA_ATIVA`, `DIVIDA_ATIVA`, `DUAM*`. Teve **3 tool calls vazios** (args=`{}`) que retornaram `invalid_type / required connectionId` (toolCallId `call_PaopBTSUY…`, `call_XrEtkUZpv…`, `call_wdE5OOMJXC…`, `call_eSI4lsmnNf…`) — sinal que o LLM perdeu o contexto dos args. Descobriu que `CONSULTA_DIVIDA_ATIVA` está VAZIA, `DIVIDA_ATIVA` está VAZIA. Stream foi cortado em 42KB após 8 run_query de descoberta. **Nenhum chart criado.** |
| 5 | "Faça um dashboard completo sobre dívida ativa de Palmas" | 7 | 1× `activate_skill` (404) | ❌ **FALHOU** | Mesmo padrão. Caiu em **5 perguntas de alinhamento** (objetivo/público, escopo temporal, dimensões de análise, KPIs prioritários, fonte de dados). Não chamou nenhuma outra tool. |

---

## 2. Tabela: bugs ORIGINAIS do diagnóstico — ainda aparecem?

| # | Bug original | T-fix | Status observado na E2E | Comentário |
|---|---|---|---|---|
| 1 | Falta de `construtor-dashboards` no system prompt | T3 (commit `29b2300`) | ✅ **System prompt MANDOU ativar a skill** (system-prompt.md linha 33: "SEMPRE ative a skill `construtor-dashboards` no início"). A IA OBEDECEU em 5/5 cenários. | Fix correto no código. Falha não é no prompt. |
| 2 | IA mandava `args.query` em vez de `args.sql` | T2 (commit `9b4aba5`) | ✅ **0 ocorrências** nas 8 chamadas de `run_query` do cenário 4 — todas usaram `args.sql` corretamente. | Fix funcionou. |
| 3 | IA mandava `tables: {item: [...]}` aninhado | T4 (commit `2267219`) | ✅ **0 ocorrências** em qualquer cenário. `get_connection_schema` não chegou a ser chamada com `tables` em nenhum dos 5 cenários (cenário 4 fez introspecção via `run_query` em `information_schema.columns`). | Fix funcionou (mas não foi exercitado no caminho oficial). |
| 4 | tool_step `phase:result` sem toolCallId correspondente | T5 (commit `9b4aba5`) | ✅ **0 toolCalls sem result**. Análise: 56 toolCalls totais nos 5 cenários, **100% correlacionados** (cada `call` tem seu `result` com mesmo `toolCallId`). | Fix funcionou. |
| 5 | `args.sql` malformado / SQL quebrado | (não foi T específica) | ⚠️ **Cenário 4 teve 1 query falhada** (`column "codigo_lei" does not exist`) — case-sensitivity do Postgres. **A IA identificou e corrigiu sozinha** (próxima query usou aspas duplas). | Comportamento correto, mas exposto. |
| 6 | **Skill `construtor-dashboards` inexistente no agent** | ❌ **NÃO HOUVE T-FIX para isso** | ❌ **BLOQUEIO ATIVO EM 5/5 CENÁRIOS** | **Root cause do veredito ❌ — ver §4 abaixo.** |

---

## 3. Tabela: funcionalidades validadas

| Funcionalidade | Validada? | Onde |
|---|---|---|
| `activate_skill` chamada como um dos primeiros tool calls (T3) | ✅ Em **5/5 cenários**, foi o 1º tool call | todos os streams |
| `run_query` com `args.sql` (NÃO `args.query`) (T2) | ✅ Em **8/8 chamadas** no cenário 4, todas com `args.sql` correto | scenario-4.stream |
| `get_connection_schema` SEM `tables: {item:[...]}` aninhado (T4) | ✅ **0 ocorrências** (nunca foi chamado no caminho errado — não chegou a ser chamado com `tables` em nenhum cenário) | análise estática |
| `toolCallId` correlacionado call↔result (T5) | ✅ **56/56 toolCalls** (100%) — todos os pares têm mesmo `toolCallId` | análise de todos os streams |
| Agente chega em `create_chart` ou `create_dashboard` | ❌ **0/5 cenários** — nenhum chegou | nenhum stream |
| Agente cria dashboard sem limitações | ❌ **Não. Ver §4.** | — |

---

## 4. Root cause do veredito negativo

**A skill `construtor-dashboards` NÃO EXISTE no `backend-boilerplate/.skills/`** — pasta não existe (`ls backend-boilerplate/.skills/` → "No such file or directory"). Os 5 cenários provam isso (todos os `activate_skill` retornam `{error: "Skill \"construtor-dashboards\" nao encontrada.", available: []}`).

**O bug é arquitetural e histórico:** `backend-boilerplate/src/modules/agent/skills/index.ts:11-16` lê skills de arquivos `.md` locais em `backend-boilerplate/.skills/`, **não** da API de skills da organização (a qual foi usada pelo pai nos commits anteriores para criar a mestra e as 5 sub-skills com IDs `cmqs4bzfc00byph0iqgubilr9`, `cmqrboxpd0098ph0i8anzrms5`, `cmqrboxpj0099ph0i9x818188`, `cmqrbr4ia009aph0i9mppgn9q`, `cmqrbr4ib009bph0imm5uestt`, `cmqrbs28o009cph0i2b5ift3s`). As skills existem no **banco** mas não existem no **filesystem** que o agente consulta. Resultado: o `available: []` na resposta do `activate_skill` mostra que `loadAllSkills()` retorna lista vazia.

**Consequência:** o system prompt manda ativar a skill mestra (comportamento T3 correto), a IA tenta (correto), recebe 404 e cai no fallback "playbook canônico" do próprio prompt — que por sua vez diz "entreviste o usuário antes de construir". Esse modo entrevista produz o comportamento observado: 4 dos 5 cenários ficaram travados em perguntas; o cenário 4 conseguiu avançar para `run_query` mas não criou nenhum chart. Nenhum cenário terminou o trabalho.

---

## 5. Verificação extra (T1, T4 — arquivos)

| Entrega | Status | Evidência |
|---|---|---|
| **T1 — VITE_API_URL fail-fast no bundle** | ✅ Presente | `frontend-boilerplate/dist/assets/env-vbBFGSYw.js` contém `VITE_API_URL precisa ser uma URL valida` + o fallback string `"https://boilerplate-be-cmqg5udk.cloud.serendiped.com"` + a mensagem de erro `"VITE_API_URL=<url-publica-do-backend>"`. Build fail-fast em produção funcionando. |
| **T4 — mcp-adapter normalização de arrays** | ✅ Presente | `backend-boilerplate/src/modules/agent/tools/mcp-adapter.ts` exporta `looksLikeItemWrapper` (linha 54, heurística "keys.length===1 && keys[0]==='item'"), `collectArrayPaths` (linha 73, recursivo top-level + sub-objetos), `unwrapArrayWrappers` (linha 107). Comentário nas linhas 32-50 documenta que NÃO usa heurística genérica para não quebrar filter `{field:'item', op:'='}` legítimos. |

---

## 6. Veredicto final

**❌ O agente NÃO cria dashboards sem limitações. 0 de 5 cenários chegaram em `create_chart` ou `create_dashboard`.**

Os 4 fixes de código (T1, T2, T4, T5) estão **todos corretos e funcionando** quando exercitados — só não foram exercitados no caminho crítico porque o agente não chega lá. O **único bloqueio não corrigido** é a **skill `construtor-dashboards` não estar materializada em `backend-boilerplate/.skills/*.md`** (o filesystem que o agente lê), embora esteja cadastrada na API de skills da organização.

**Por que o agente travou em modo "entrevista":** sem a skill mestra no contexto, o system prompt sozinho (que já tem instruções ricas mas é genérico) prescreve o modo "entreviste antes de construir". Em 4 cenários a IA seguiu literalmente; no cenário 4 a IA teve ímpeto maior de descoberta e conseguiu rodar 8 `run_query` mas também não criou chart. Em nenhum dos 5 cenários o LLM assumiu autonomia para `create_chart` sem fazer 4-7 perguntas de alinhamento antes — comportamento consistente com a ausência da skill mestra.

**Correção mínima necessária (fora do escopo desta task — apenas para o pai decidir):**
1. Exportar as 6 skills (`construtor-dashboards` + 5 sub) da API para `backend-boilerplate/.skills/*.md` no formato frontmatter esperado por `parseFrontmatter` (linha 18-26 de `agent/skills/index.ts`), OU
2. Mudar `loadAllSkills()` para também ler da API REST de skills da organização e fazer merge, OU
3. Mudar o `activate_skill` tool para aceitar slug e fazer fetch on-demand da API de skills da organização (sem cache local).

Recomendação: **opção 1** (dump dos 6 SKILL.md em `.skills/`) é a mais simples, auditável via git, e não introduz acoplamento extra entre o módulo agent e a API REST de skills.

---

## 7. Artefatos desta validação

- `_meta/agent-e2e/test-scenarios.sh` — script (existente)
- `_meta/agent-e2e/run.log` — log do script (saída dos 5 cenários)
- `_meta/agent-e2e/scenario-{1..5}.stream` — SSE bruto capturado de cada cenário
- `_meta/agent-e2e/REPORT.md` — este relatório