# `mcp` — Servidor MCP (tools para o agente externo) · T-D

Expõe um **servidor MCP** (Model Context Protocol) para que o **agente de IA
EXTERNO** (decisão do doc 22) configure conexões/consultas/charts/dashboards na
plataforma. Todas as tools **reusam os services** dos módulos T-A/T-B/T-C — este
módulo **não reimplementa regra de negócio**.

## Transporte & autenticação

- **Transporte:** HTTP "Streamable" — um único endpoint **`POST /mcp`** que recebe
  mensagens **JSON-RPC 2.0** (MCP) e responde `application/json`. _Stateless_:
  cada request é autenticado e atendido isoladamente. `GET /mcp` → `405`
  (sem canal SSE iniciado pelo servidor neste MVP).
- **Auth:** **bearer / API-key**. `Authorization: Bearer <MCP_API_KEY>` é
  comparado em **tempo constante** com a env `MCP_API_KEY`. Sem `MCP_API_KEY`
  configurada o endpoint fica **desabilitado** (`503`, _fail-closed_).
- **Ator de serviço (RBAC):** o agente atua **em nome de um usuário real** do
  sistema, configurado por `MCP_SERVICE_USER_ID` (ou `MCP_SERVICE_USER_EMAIL`).
  O papel e os departamentos desse usuário são lidos do banco e **todas as tools
  respeitam a mesma visibilidade/permissão** das rotas REST — o MCP **não burla**
  RBAC. `ownerId` dos artefatos criados = esse usuário.

### Variáveis de ambiente

| Env                     | Obrigatória | Descrição                                                        |
| ----------------------- | ----------- | ---------------------------------------------------------------- |
| `MCP_API_KEY`           | sim¹        | Token de serviço (bearer) do runtime externo. Sem ela → `503`.   |
| `MCP_SERVICE_USER_ID`   | sim²        | Id do usuário em nome de quem o agente atua (âncora de RBAC).     |
| `MCP_SERVICE_USER_EMAIL`| sim²        | Alternativa ao id: resolve o usuário pelo e-mail.                 |

¹ sem ela o `/mcp` responde `503` (desabilitado). · ² ao menos **um** dos dois
identificadores de usuário; sem nenhum → `503` (config incompleta).

## Tools

| Tool                     | O que faz                                              | Service reusado                         |
| ------------------------ | ------------------------------------------------------ | --------------------------------------- |
| `list_connections`       | Conexões visíveis ao ator (RBAC/visibilidade)          | `modules/connections` (`listConnections` + rbac) |
| `get_connection_schema`  | Introspecção de tabelas/colunas (cache Redis)          | `modules/connections` (`introspectSchema`) |
| `run_query`              | SELECT read-only de preview (guardrails do pg-runner)  | `modules/connections` (`runConnectionQuery`) |
| `list_catalog`           | Manifestos do catálogo VIVO **com `dataContract`**     | `lib/catalog` (F0.4)                    |
| `create_chart`           | Cria gráfico (draft)                                   | `modules/charts` (`createChart`)        |
| `update_chart`           | Edita os campos draft de um gráfico                    | `modules/charts` (`updateChart`)        |
| `publish_chart`          | Promove draft→published                                | `modules/charts` (`publishChart`)       |
| `preview_chart_data`     | Executa o dataBinding e devolve o resultado no shape   | `modules/data` (`executeBlockData`) + pg-runner |
| `create_dashboard`       | Cria dashboard (draft) com layout `{ filters, rows }`  | `modules/dashboards` (`createDashboard`) |
| `update_dashboard`       | Edita os campos draft de um dashboard                  | `modules/dashboards` (`updateDashboard`) |
| `add_chart_to_dashboard` | Insere um bloco que referencia um chart no layout      | `modules/dashboards` (`addChartToDashboard`) |
| `publish_dashboard`      | Promove draftLayout→publishedLayout (invalida cache)   | `modules/dashboards` (`publishDashboard`) |

As **descrições das tools são escritas para a IA** (estão no código, em
`tools/*.ts`) e referenciam o `dataContract` do catálogo: o agente deve consultar
`list_catalog` para saber `catalogType`, `propsSchema` e o `shape` que o
resultado da query precisa respeitar (`scalar | series | categorical | table`).

## Como o agente usa (fluxo típico)

1. `initialize` → `tools/list` (descobre as tools e seus `inputSchema`).
2. `list_catalog` + `list_connections` (descobre tipos de bloco e conexões).
3. `get_connection_schema` + `run_query` (entende os dados — read-only).
4. `create_chart` (com `catalogType` + `draftProps` + `draftDataBinding`).
5. `preview_chart_data` (confere o shape) → `publish_chart`.
6. `create_dashboard` / `add_chart_to_dashboard` → `publish_dashboard`.

## Exemplo (curl)

```bash
# tools/list
curl -sX POST "$BASE/mcp" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# tools/call → run_query
curl -sX POST "$BASE/mcp" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"run_query",
                 "arguments":{"connectionId":"<id>","sql":"SELECT 1 AS n"}}}'
```

## Convenção de erros (MCP)

- Erro de **protocolo** (método inexistente, params inválidos) → erro **JSON-RPC**
  (`code` negativo).
- Erro de **execução de tool** (regra de negócio, validação de argumentos, RBAC) →
  **resultado** normal com `isError: true` e `{ error: { code, message } }` no
  `content`/`structuredContent` (o agente lê e corrige).

## Desvio consciente do plano (doc 05)

O doc 05 sugere "HTTP streamable + bearer/API-key" e cogita o SDK oficial
`@modelcontextprotocol/sdk`. Implementamos o transporte **JSON-RPC 2.0 sobre
HTTP** próprio (sem o SDK) para **não acoplar o build/tests a um pacote ESM-only**
nem mexer no wiring de `@dashboards/contracts`. O **protocolo no fio continua
MCP-compliant** e o registro de tools (`tools/`) é portável para o SDK caso um
runtime externo exija o transporte oficial. Itens parametrizáveis (transporte/
auth) ficam isolados em `config.ts`/`index.ts`.
