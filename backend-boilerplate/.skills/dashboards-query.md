---
name: dashboards-query
description: Sub-skill de geração de SQL para o Construtor de Dashboards: convenção de colunas por shape (scalar/series/categorical/table), CAST obrigatório em agregações, case-sensitivity do Postgres (aspas duplas), parâmetros posicionais, agregação e minimização de dados (LGPD), descoberta progressiva de schema (get_connection_schema em 2 passos) e uso de pg_stat_user_tables. Read-only sempre.
---

# Geração de Query SQL - para o shape validar de primeira

> Sub-skill da **construtor-dashboards**. O `dataBinding.query` é SEMPRE SQL
> **somente-leitura** (SELECT/WITH). O resultado precisa bater com o
> `dataContract.shape` do bloco (ver sub-skill **dashboards-catalogo**), senão o
> `preview_chart_data` retorna `contract_violation`. Esta skill ensina a escrever
> a query certa de primeira.

## 0. INEGOCIÁVEL: teste a query REAL antes de criar o chart

Antes de QUALQUER `create_chart`, rode a query **completa e exata** no `run_query`.
Não a ideia dela - a query literal. O `run_query` executa de verdade e pega, de
graça, os 4 erros que mais quebram dashboard: coluna inexistente, shape errado,
encoding (LATIN1) e timeout (`durationMs`). Se a query passa no `run_query` com as
colunas certas e tempo aceitável, o chart vai renderizar. Se você não testou, não
crie. (Ver os erros preveníveis na skill **dashboards-erros** §0.)

## 1. Convenção de COLUNAS por shape (o ponto mais importante)

O `transform` é **identidade por convenção**: se você nomear as colunas do SELECT
exatamente como o shape espera, NÃO precisa de transform. Convenção:

| shape | colunas do SELECT | blocos |
|---|---|---|
| `scalar` | `value` (obrig.) + opcionais `label`, `unit`, `delta` | kpi, metric_glow, stat_tile, progress_bar, progress_circle, radial_gauge |
| `series` | `x`, `y` (obrig.) + `series` (opcional, multi-série) | bar_chart, h_bar_chart, line_chart, area_chart, scatter_chart, spark_chart, signal_card |
| `categorical` | `label`, `value` (obrig.) | donut, bar_list, leaderboard |
| `table` | colunas livres (cada coluna do SELECT vira uma coluna tipada) | data_table, table, invoice_table |

AVISO: **`h_bar_chart` é series (`x,y`), NÃO categorical.** Parece "barra com rótulo"
mas o contrato é series: `x` = rótulo da barra, `y` = valor. Mandar `label,value`
nele -> `contract_violation: /0 must have required property 'x'`. Só `donut`,
`bar_list` e `leaderboard` usam `label,value`.

Exemplos:
```sql
-- scalar (kpi)
SELECT SUM("VALOR_PREVISTO")::numeric AS value FROM "SCH"."RECEITAS_PORTAL" WHERE "ANO" = 2025;

-- series (h_bar_chart / bar_chart) - x,y!
SELECT 'Divida Ativa' AS x, SUM("VL_DIVIDA")::numeric AS y FROM "SCH"."DUAM_IT" WHERE ...;

-- series temporal (line_chart)
SELECT mes AS x, SUM(valor)::numeric AS y FROM arrecadacao GROUP BY mes ORDER BY mes;

-- categorical (donut / bar_list)
SELECT "NOME" AS label, SUM("VALOR_PREVISTO")::numeric AS value
  FROM "SCH"."RECEITAS_PORTAL" WHERE "NIVEL" = 1 GROUP BY "NOME" ORDER BY value DESC LIMIT 8;
```

### Transform declarativo (quando NÃO der pra renomear)
Se as colunas não puderem seguir a convenção, passe `dataBinding.transform` como
objeto declarativo: `{ x, y, series, label, value, unit, delta }`. Prefira
renomear no SQL (`AS`).

## 2. CAST obrigatório em agregações

`COUNT(*)`, `SUM(...)` sobre inteiros e colunas `numeric` voltam como **string**
no node-pg. Sempre faça CAST (`::int`/`::numeric`) - evita `contract_violation`
por tipo e garante precisão.

## 3. Case-sensitivity do Postgres (armadilha nº 1)

Identificadores maiúsculos/aspas são **case-sensitive**. Use aspas duplas em
schema, tabela E colunas: `"SCH"."RECEITAS_PORTAL"`, `"VALOR_PREVISTO"`. Vale no
`get_connection_schema.tables` também.

## 4. Parâmetros posicionais (nunca interpole)
Use `$1, $2, ...` e passe `params`. Não concatene valores na string SQL.

## 5. Minimização de dados (LGPD - é uma prefeitura)
- Prefira **agregações** a despejar linhas. Não traga dados pessoais crus.
- `run_query` é preview (<=50 linhas default). Agregue/`LIMIT` no SQL.

## 6. Descoberta de schema (NUNCA invente nomes - e VALIDE por tabela)

SEMPRE descubra tabelas/colunas com `get_connection_schema` antes de escrever SQL.
Fluxo PROGRESSIVO em 2 passos:
1. **Lista leve**: `get_connection_schema { connectionId }` (+ `search`, `schema`,
   `page`). Retorna a lista de tabelas (sem colunas).
2. **Colunas**: `get_connection_schema { connectionId, tables:["schema.tabela"] }`
   -> colunas só dessas tabelas.

AVISO: **NUNCA valide uma coluna com `information_schema.columns ... WHERE table_name
IN ('A','B','C')`** - o resultado MISTURA colunas de tabelas diferentes e você
acha que a coluna existe na tabela errada (causa real do erro
`column "CCP" does not exist`). Valide UMA tabela por vez, ou melhor: rode
`SELECT "COLUNA" FROM "SCH"."TABELA" LIMIT 1` - se a coluna não existe, falha na hora.

## 7. Encoding do banco (LATIN1 - bancos legados de prefeitura)

Muitos bancos são **LATIN1**, não UTF-8. Caracteres tipográficos Unicode em
LITERAIS de string (`-` travessão, `>` seta, `...` reticências, `" " ' '` aspas
curvas, `*` bullet) quebram com
`query_failed: ... has no equivalent in encoding "LATIN1"`. Nos literais SQL use
ASCII: `-`, `->`, `...`, `"`. Acentos do português (á é í ó ú ã õ ç à â ê ô) SÃO
válidos em LATIN1 e podem ser usados normalmente. Cheque o encoding uma vez:
```sql
SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname=current_database();
```

## 8. PERFORMANCE - não deixe a query estourar o statement_timeout

Dashboards rodam várias queries; cada uma tem teto de tempo no servidor. Meça o
`durationMs` no `run_query`. Se passar de ~10s, OTIMIZE - não confie na sorte.

**8.1 COUNT(DISTINCT)/GROUP BY são caros.** Se existe uma chave que já é única no
recorte, NÃO use DISTINCT/GROUP BY. Confirme a unicidade:
```sql
SELECT COUNT(*) AS linhas, COUNT(DISTINCT "CHAVE") AS distintos FROM ... WHERE filtro;
```
Se `linhas = distintos`, troque `COUNT(DISTINCT "CHAVE")` por `COUNT(*)` e remova o
`GROUP BY` - cai de dezenas de segundos para poucos.

**8.2 Uma passada com `FILTER` em vez de N scans.** Para calcular vários números
sobre a mesma tabela (ex.: 3 fatias de um funil), NÃO faça 3 SELECTs (3 scans).
Faça UM scan com `COUNT(*) FILTER (WHERE ...)` / `SUM(x) FILTER (WHERE ...)`:
```sql
SELECT
  COUNT(*) FILTER (WHERE cond_a) AS a,
  SUM(valor) FILTER (WHERE cond_b) AS b
FROM "SCH"."TAB" WHERE recorte_comum;
```

**8.3 Transpor uma linha de agregados em várias linhas (categorical/table).** Para
um donut/tabela a partir de UM scan agregado, agregue numa linha e transponha com
`unnest(ARRAY[...])` - continua sendo 1 scan:
```sql
SELECT label, value FROM (
  SELECT unnest(ARRAY['Fatia A','Fatia B']) AS label,
         unnest(ARRAY[ SUM(v) FILTER (WHERE a), SUM(v) FILTER (WHERE b) ])::numeric AS value
  FROM (SELECT v, a, b FROM "SCH"."TAB" WHERE recorte) s
) t;
```

**8.4 Derive flags uma vez** numa subquery (`SELECT cond AS flag ...`) e reuse nos
`FILTER` - evita repetir expressões caras por linha.

**8.5 Sem índice, o piso é o scan.** Você não cria índice (read-only). Aceite o
custo do scan do recorte e minimize-o: filtre cedo, projete só o necessário, 1
passada. Se mesmo otimizada a query é inerentemente longa, considere recortar o
período (ex.: ano corrente) - e avise o usuário do trade-off.

## 9. Lógica de NULL (flags booleanas)
`coluna = false` NÃO pega `NULL` (`NULL = false` = UNKNOWN). Em flags que podem
ser nulas (ex.: `CANCELADO`), use `coluna IS NOT TRUE` (false E null) ou
`COALESCE(coluna,false) = false`. Sintoma de erro: contagem retorna `0`
inesperado. Sempre confira a contagem com `run_query`.

## 10. `pg_stat_user_tables.n_live_tup` é ESTIMATIVA
Pode mostrar `0` numa tabela cheia (autovacuum atrasado). Use só como dica de
volume. Para saber se uma tabela tem dados de verdade:
`SELECT COUNT(*) FROM "SCH"."TABELA"`. Nunca conclua "tabela vazia / sem fonte"
sem o `COUNT(*)` real.

## 11. Permissões por schema
`query_failed: permission denied for schema X` -> tente outro schema; não insista.

## 12. Sempre SELECT/WITH
INSERT/UPDATE/DELETE/DDL e múltiplos statements são REJEITADOS
(`read_only_violation`). Um único `SELECT`/`WITH ... SELECT`.

## 13. Checklist antes de criar o chart
- [ ] Descobri as colunas reais via `get_connection_schema` (e validei a coluna NA
      tabela certa, não num `IN (...)` misturado).
- [ ] Nomeei as colunas conforme o shape (`value` / `x,y` / `label,value`).
      (h_bar/bar/line/area/scatter/spark/signal = `x,y`!)
- [ ] CAST `::int`/`::numeric` em toda agregação.
- [ ] Aspas duplas em identificadores maiúsculos/custom.
- [ ] Sem caracteres tipográficos Unicode nos literais (banco pode ser LATIN1).
- [ ] Flags booleanas com `IS NOT TRUE`/`COALESCE`, não `= false`.
- [ ] Performance: sem COUNT(DISTINCT)/GROUP BY redundante; 1 passada com FILTER;
      `durationMs` aceitável no `run_query`.
- [ ] Rodei a query COMPLETA no `run_query` e confirmei colunas + tempo ANTES de `create_chart`.
