# Agente externo de Dashboards — SKILL + RULES (portável)

Esta pasta contém o **"cérebro" do agente de IA externo** que cria relatórios,
gráficos e dashboards na plataforma da prefeitura **consumindo o servidor MCP**
dela. Por decisão de arquitetura (docs `06-chat-agente.md` e
`22-arquitetura-agente-llm.md`), a **gestão do agente é externa**: estes arquivos
são documentação/config **portável** que você carrega na sua ferramenta de agente
(Claude Code, ou outra que fale MCP). **Não é código da plataforma.**

## Arquivos

| Arquivo | O que é |
|---------|---------|
| **`SKILL.md`** | A SKILL principal (com frontmatter Anthropic Agent Skills): identidade, modelo mental do domínio, mapeamento de dados → bloco, e o **playbook passo a passo** do fluxo de trabalho. |
| **`rules.md`** | As **regras e guardrails** de comportamento (SEMPRE/NUNCA): só leitura, schema antes de SQL, minimização de dados (LGPD), conferir antes de publicar, etc. |
| **`mcp-reference.md`** | A "cola" técnica: transporte/auth do MCP, as **12 tools** com argumentos exatos, o **catálogo de 7 blocos** e shapes, **convenções de query** por shape e **exemplos end-to-end**. |

> Os três arquivos são **auto-suficientes**: juntos, descrevem tudo que o agente
> precisa para operar a plataforma corretamente. Foram escritos e **verificados
> contra o servidor MCP real** (ver "Precisão técnica" abaixo).

## O que o agente precisa para conectar ao MCP

A ferramenta de agente precisa de um **MCP client** apontando para o servidor da
plataforma:

- **Endpoint:** `POST <BASE_URL>/mcp` (transporte HTTP "Streamable", JSON-RPC 2.0).
- **Auth:** header `Authorization: Bearer <MCP_API_KEY>`.
- Em desenvolvimento local: `BASE_URL = http://localhost:4000`, chave dev
  `dev-mcp-key-change-me` (troque em produção).

> Detalhes de transporte/auth/erros estão em `mcp-reference.md` §1.

---

## Como instalar no Claude Code

Há duas formas; use a que combina com seu setup.

### A) Como **Agent Skill** (recomendado)

1. Crie a pasta da skill no seu projeto (ou no diretório de skills do Claude Code):
   ```
   .claude/skills/construtor-dashboards/
   ```
2. Copie **`SKILL.md`** para dentro dela (o nome do arquivo precisa ser `SKILL.md`).
   O frontmatter no topo (`name`, `description`) é o que o Claude usa para decidir
   **quando** ativar a skill.
3. Copie também `rules.md` e `mcp-reference.md` para a **mesma pasta** — o `SKILL.md`
   referencia esses arquivos por nome, e o Claude os carrega como material de apoio:
   ```
   .claude/skills/construtor-dashboards/
     ├── SKILL.md
     ├── rules.md
     └── mcp-reference.md
   ```
4. Configure o **MCP server** no Claude Code (`.mcp.json` / `claude mcp add`),
   apontando para `<BASE_URL>/mcp` com o header `Authorization: Bearer <MCP_API_KEY>`.
   Exemplo de entrada (HTTP transport):
   ```jsonc
   {
     "mcpServers": {
       "dashboards": {
         "type": "http",
         "url": "https://<sua-base>/mcp",
         "headers": { "Authorization": "Bearer <MCP_API_KEY>" }
       }
     }
   }
   ```
5. Pronto: peça em linguagem natural ("crie um KPI com o total de contribuintes") e
   o agente seguirá o playbook da skill usando as tools do MCP.

### B) Como **system prompt / regras do projeto**

Se preferir não usar o mecanismo de skills, concatene o conteúdo dos três arquivos
(`SKILL.md` sem o frontmatter + `rules.md` + `mcp-reference.md`) no **`CLAUDE.md`**
do projeto ou no system prompt. O MCP server é configurado da mesma forma (passo 4
acima).

---

## Como adaptar para **outra ferramenta** de agente

O conteúdo é portável. Para qualquer runtime que fale MCP:

1. **System prompt / instruções:** cole o corpo do `SKILL.md` (pode remover o
   frontmatter YAML, que é específico do formato Anthropic Agent Skills) + o
   `rules.md`. Anexe o `mcp-reference.md` como material de referência (ou inclua-o
   no contexto sob demanda, se a ferramenta suportar arquivos de apoio).
2. **MCP client:** configure o transporte HTTP JSON-RPC para `POST <BASE_URL>/mcp`
   com `Authorization: Bearer <MCP_API_KEY>`. As tools aparecem via `tools/list`.
   - Se sua ferramenta exigir o transporte oficial do SDK MCP, note que este
     servidor implementa o protocolo **no fio** (JSON-RPC 2.0 sobre HTTP) de forma
     MCP-compliant, mas **não** expõe canal SSE iniciado pelo servidor (`GET /mcp`
     → `405`). Use o modo HTTP request/response.
3. **Sem suporte a MCP nativo?** Você pode chamar o endpoint diretamente (ver os
   exemplos curl em `mcp-reference.md` §1) e mapear cada tool para uma "função"/
   "tool" da sua ferramenta usando o `inputSchema` que vem em `tools/list`.

---

## Precisão técnica (como foi verificado)

Os arquivos foram conferidos contra o **código real** do módulo MCP
(`backend-boilerplate/src/modules/mcp/`) e contra o **servidor MCP em execução**:

- **12 tools** confirmadas via `tools/list` (nomes e `inputSchema` exatos):
  `list_connections`, `get_connection_schema`, `run_query`, `list_catalog`,
  `create_chart`, `update_chart`, `publish_chart`, `preview_chart_data`,
  `create_dashboard`, `update_dashboard`, `add_chart_to_dashboard`, `publish_dashboard`.
- **Catálogo** confirmado via `list_catalog`: **7 blocos** vivos (`kpi`, `bar_chart`,
  `line_chart`, `donut`, `table`, `title`, `rich_text`) + 1 placeholder interno
  (`__example`, não usar). Shapes e `propsSchema` batem com os manifests reais.
- **Fluxo progressivo** do `get_connection_schema` (passo 1 = lista de tabelas;
  passo 2 = colunas só das pedidas) validado em execução.
- **Gotcha do `CAST ::int`** validado ao vivo: `SELECT COUNT(*)` devolve `"6"`
  (string) e `SELECT COUNT(*)::int` devolve `6` (number) — daí a regra de sempre
  fazer cast em agregações.

Se a plataforma evoluir (novos blocos no catálogo, novas tools), o agente continua
correto porque o playbook manda **sempre** consultar `list_catalog` e `tools/list`
na descoberta — estes documentos descrevem o estado atual e o **método**, não uma
lista congelada.
