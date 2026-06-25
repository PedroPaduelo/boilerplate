# T12 — RELATÓRIO DE BLOQUEIO (task-executor subagente)

## OBJETIVO
Adicionar §10 "Knowledge packs do domínio FiscalizAI/Palmas" no system prompt do agente
`cmqrclcdv009hph0i6f0w0rgh` (Analista de Dashboards BI) via API de update.

## O QUE FOI FEITO
1. ✅ Li o system prompt completo via `agent_get({agentId: 'cmqrclcdv009hph0i6f0w0rgh'})` — 12KB, 9 seções (1-9), sem §10.
2. ✅ Validei que as 4 skills existem em `backend-boilerplate/.skills/`:
   - dashboards-fiscalizai-palmas.md (mestra)
   - dashboards-fiscalizai-banco-sch.md (78KB)
   - dashboards-fiscalizai-cobranca.md (93KB)
   - dashboards-fiscalizai-cda-protesto.md (105KB)
3. ✅ Verifiquei o conjunto de tools `agent_*` disponíveis no subagente.
4. ✅ Verifiquei o app-core em `127.0.0.1:8080` (responde `/health`, exige Authorization em `/api/agents`).
5. ✅ Testei a estratégia alternativa: `agent_clone` (preserva systemPrompt, gera id novo `cmqtiaeqn00m8ph0i0yopwmtk`) → deletei o clone de teste.

## POR QUE ESTOU BLOQUEADO

O briefing dizia: "use a tool `agent_update` (ou equivalente — pode ser `update_agent` ou via HTTP API direto)".
Nenhuma das opções está disponível para este subagente:

| Opção do briefing | Status | Detalhe |
|---|---|---|
| `agent_update` | ❌ NÃO EXISTE nas tools | `agent_list`, `agent_get`, `agent_create`, `agent_clone`, `agent_delete` apenas — sem write-update |
| `update_agent` | ❌ NÃO EXISTE nas tools | idem |
| HTTP PATCH /api/agents/:id em 127.0.0.1:8080 | ❌ 404 Not Found | app-core não expõe essa rota |
| HTTP PUT /api/agents/:id em 127.0.0.1:8080 | ❌ 404 Not Found | idem |
| HTTP com Authorization | ❌ INACESSÍVEL | app-core exige auth; só o motor tem o token (não vejo env nem consigo autenticar) |
| `agent_clone` com systemPrompt customizado | ❌ NÃO SUPORTADO | doc: "preserva systemPrompt, modelConfig, cacheConfig, AgentSkill e AgentTool"; aceita só `name?` |
| `agent_create` (criar novo) | ❌ VIOLA ESCOPO | cria id novo, e o briefing proíbe "alterar outros agents" |

## IMPACTO
Não é possível alterar o system prompt de um agente existente mantendo o mesmo id via
as tools deste subagente. O PAI precisa intervir.

## OPÇÕES PROPOSTAS PARA O PAI

1. **Adicionar uma tool `agent_update`** na plataforma (1-2 linhas no motor: PATCH /api/agents/:id).
   Solução mais limpa. Provavelmente já existe no app-core, só não está exposta ao subagente.

2. **Rodar o update diretamente** no app-core com credenciais master (acesso fora do sandbox
   do subagente). O body PATCH seria: `{"systemPrompt": "<novo prompt com §10>"}`.

3. **Aceitar trade-off de clone+delete** (muda o `id` do agente):
   - clonar com name "Analista de Dashboards BI" e systemPrompt novo
   - deletar o original `cmqrclcdv009hph0i6f0w0rgh`
   - re-linkar as 5 skills `dashboards-*` ao novo id
   - **ATENÇÃO**: testes E2E e outros lugares que referenciam o id antigo quebram.

## NOVO SYSTEM PROMPT PREPARADO
Já está pronto pra colar (validado §1-9 inalteradas + nova §10 adicionada no fim).
Não commitei nada (regra do briefing).

## COMMIT / MUDANÇAS NO FS
ZERO. `git status` zerado, nenhuma skill tocada, nenhum arquivo do FS alterado.
Apenas deletei um clone de teste `cmqtiaeqn00m8ph0i0yopwmtk` (já limpo).

