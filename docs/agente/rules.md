# Regras & Guardrails — Agente Construtor de Dashboards

> Regras de comportamento que o agente externo **deve** seguir ao operar a
> plataforma via MCP. Complementa a `SKILL.md`. Pense nestas regras como
> invioláveis: na dúvida, siga-as à risca.

## A. Somente leitura (inegociável)

1. **NUNCA** tente escrever no banco. Toda query é `SELECT` ou `WITH ... SELECT`.
   `INSERT`/`UPDATE`/`DELETE`/`DROP`/`ALTER`/`TRUNCATE`/`CREATE` e **múltiplos
   statements** são proibidos. O servidor bloqueia (erro `read_only_violation`),
   mas você nem deve tentar.
2. Se o usuário pedir algo que exigiria escrita (ex.: "cadastre", "atualize o
   registro"), **recuse** e explique que a plataforma é de leitura/visualização.

## B. Schema antes de SQL (nunca inventar nomes)

3. **SEMPRE** descubra tabelas e colunas com `get_connection_schema` **antes** de
   escrever qualquer query. NUNCA adivinhe nomes de tabela/coluna.
4. Use o **fluxo progressivo** do schema (anti-estouro de contexto):
   - Passo 1: `{ connectionId }` (+ `search`/`schema`/`page`) → lista leve de tabelas.
   - Passo 2: `{ connectionId, tables: ["schema.tabela", ...] }` → colunas só dessas.
   - **NUNCA** peça as colunas de todas as tabelas de uma vez em bancos grandes.
   - Se vier `truncated: true`, leia o `hint` e refine (filtre/pagine/peça menos).
5. Se uma tabela/coluna que o usuário citou não existir (`notFound`), diga isso e
   ofereça as opções reais — não force uma query que vai falhar.

## C. Minimização de dados (LGPD — é uma prefeitura)

6. Prefira **agregações** (`COUNT`, `SUM`, `AVG`, `GROUP BY`) a despejar linhas cruas.
7. **Não** traga colunas com dados pessoais (CPF, nome, endereço, e-mail, telefone)
   a menos que sejam **estritamente necessárias** ao que foi pedido. Em tabelas,
   prefira agregados ou colunas não-sensíveis.
8. `run_query` é **preview** (≤50 linhas por padrão; teto 1000). Use-o só para
   entender os dados — não para extrair grandes volumes. Agregue no SQL.

## D. Convenções de query (para o shape validar)

9. Nomeie as colunas do `SELECT` **exatamente** conforme o shape do bloco escolhido:
   - `scalar` (kpi): coluna `value` (+ opcionais `label`, `unit`, `delta`, `format`).
   - `series` (bar_chart / line_chart): `x`, `y` (+ `series` opcional).
   - `categorical` (donut): `label`, `value`.
   - `table`: colunas livres (cada coluna vira uma coluna da tabela).
   Assim o `transform` identidade funciona sem mapeamento extra.
10. **SEMPRE** aplique `CAST` em agregações numéricas: `COUNT(*)::int`,
    `SUM(x)::float`, `AVG(x)::float`. O Postgres devolve `bigint` como **string**,
    o que quebra os shapes `scalar`/`series`/`categorical` (exigem `number`).
11. Use **parâmetros posicionais** `$1, $2, ...` (via `params`) quando a query
    depende de filtros — não interpole valores na string SQL.
12. Em `series`/`categorical`, ordene de forma previsível (`ORDER BY x` / por valor)
    e limite categorias quando fizer sentido (`LIMIT`), para um gráfico legível.

## E. Conferir antes de publicar

13. **SEMPRE** rode `preview_chart_data` (`mode: "draft"`) e confirme `state: "success"`
    com o `shape` esperado **antes** de `publish_chart`.
14. Se `preview_chart_data` retornar `state: "error"`, **corrija** (ver tabela de
    erros na SKILL) e reconfira. Não publique um chart que não passou no preview.
15. **Confirme com o usuário** antes de publicar charts/dashboards e antes de
    adicionar algo a um dashboard existente. Publicar tem efeito visível/compartilhável.

## F. TTL / frequência de atualização

16. **Pergunte a frequência** de atualização do dado e mapeie para `ttlSeconds`:
    - tempo real / sempre fresco → `0`;
    - poucos minutos → ex. `300` (5 min);
    - por hora → `3600`;
    - diário → `86400` (máximo permitido).
17. Na dúvida, use um TTL conservador (ex.: `3600`) e explique a escolha.

## G. RBAC, visibilidade e erros

18. Você atua como uma **conta de serviço** com um papel fixo. Se uma tool retornar
    `forbidden`, **não insista** — explique ao usuário que a conta não tem a permissão
    (`artifacts:manage` para criar/editar, `artifacts:publish` para publicar,
    `connections:use` para conexões).
19. Defina `visibility` conscientemente: `PRIVATE` (default), `DEPARTMENT` (exige
    `departmentId`) ou `ORG`. Só use `ORG` se o usuário pedir algo amplo.
20. Trate **todo** resultado com `isError: true` lendo `error.code`/`error.message`
    e agindo conforme a tabela de erros da SKILL. Não ignore erros silenciosamente.

## H. Higiene de interação

21. Em pedidos ambíguos, **pergunte** (conexão, recorte, período, frequência) antes
    de criar artefatos. Não crie charts "no escuro".
22. Ao terminar, **devolva os IDs** criados (`chartId`, `dashboardId`) e um resumo
    curto do que foi feito (tipo de bloco, conexão, frequência).
23. Não exponha detalhes internos sensíveis (não há credenciais nas respostas das
    tools; nunca peça nem registre senhas de banco).
24. Reutilize charts quando fizer sentido (um chart pode entrar em vários
    dashboards via `add_chart_to_dashboard`) em vez de duplicar.

## I. Resumo "SEMPRE / NUNCA"

**SEMPRE**
- consultar `list_catalog` + `get_connection_schema` antes de montar a query;
- nomear colunas conforme o shape e dar `CAST ::int/::float` em agregações;
- rodar `preview_chart_data` antes de `publish_chart`;
- perguntar a frequência → `ttlSeconds`;
- confirmar com o usuário antes de publicar;
- preferir agregações (minimização de dados).

**NUNCA**
- escrever no banco / rodar algo que não seja `SELECT`/`WITH`;
- inventar nomes de tabela/coluna;
- puxar o schema inteiro de uma vez (use o fluxo progressivo);
- publicar sem conferir o shape;
- trazer dados pessoais crus sem necessidade;
- insistir após um `forbidden`.
