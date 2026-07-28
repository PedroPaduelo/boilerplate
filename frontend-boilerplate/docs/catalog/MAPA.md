# MAPA DO CATÁLOGO

> **Arquivo gerado.** Não edite à mão:
> `node scripts/audit-catalog-props.mjs --markdown > docs/catalog/MAPA.md`
>
> Um mapa escrito à mão mente na primeira mudança de manifesto — e o manifesto
> é o contrato que o agente de IA lê para montar dashboards.

**32 blocos · 146 propriedades declaradas**

- **Gráfico** (21): `area_chart`, `bar_chart`, `bar_list`, `data_table`, `donut`, `funnel_stage`, `graph_chart`, `h_bar_chart`, `invoice_table`, `kpi`, `leaderboard`, `line_chart`, `metric_glow`, `progress_bar`, `progress_circle`, `radial_gauge`, `scatter_chart`, `signal_card`, `spark_chart`, `stat_tile`, `table`
- **Layout** (6): `collapsible_block`, `divider`, `grid`, `mobius_loop`, `section`, `sheet`
- **Texto** (3): `alert`, `callout`, `rich_text`
- **Título** (2): `flip_words`, `title`

## Gráfico

### `area_chart`

consome **série temporal**.

| propriedade     | tipo    | valores aceitos                                                       | lida no código |
| --------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `type`          | string  | `default` · `stacked` · `percent`                                     | sim            |
| `fill`          | string  | `gradient` · `solid` · `none`                                         | sim            |
| `showLegend`    | boolean | —                                                                     | sim            |
| `showGridLines` | boolean | —                                                                     | sim            |
| `palette`       | string  | `single` · `multi`                                                    | sim            |
| `accent`        | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `valueFormat`   | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `bar_chart`

consome **série temporal**.

| propriedade    | tipo    | valores aceitos                                                       | lida no código |
| -------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `stacked`      | boolean | —                                                                     | sim            |
| `orientation`  | string  | `vertical` · `horizontal`                                             | sim            |
| `accent`       | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | **NÃO**        |
| `palette`      | string  | `single` · `multi`                                                    | **NÃO**        |
| `seriesColors` | array   | —                                                                     | **NÃO**        |
| `showLegend`   | boolean | —                                                                     | sim            |
| `valueFormat`  | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `bar_list`

consome **categorias**.

| propriedade   | tipo   | valores aceitos                                                       | lida no código |
| ------------- | ------ | --------------------------------------------------------------------- | -------------- |
| `sortOrder`   | string | `ascending` · `descending` · `none`                                   | sim            |
| `palette`     | string | `single` · `multi`                                                    | sim            |
| `accent`      | string | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `valueFormat` | string | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `data_table`

consome **tabela**.

| propriedade         | tipo    | valores aceitos | lida no código |
| ------------------- | ------- | --------------- | -------------- |
| `pageSize`          | integer | —               | sim            |
| `filterPlaceholder` | string  | —               | sim            |

### `donut`

consome **categorias**.

| propriedade   | tipo    | valores aceitos                                                       | lida no código |
| ------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `showLegend`  | boolean | —                                                                     | sim            |
| `centerLabel` | string  | —                                                                     | sim            |
| `palette`     | string  | `single` · `multi`                                                    | sim            |
| `accent`      | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `valueFormat` | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `funnel_stage`

consome **tabela**.

| propriedade    | tipo    | valores aceitos                                         | lida no código |
| -------------- | ------- | ------------------------------------------------------- | -------------- |
| `stageLabel`   | string  | —                                                       | sim            |
| `accent`       | string  | `blue` · `red` · `green` · `amber` · `violet` · `slate` | sim            |
| `defaultOpen`  | boolean | —                                                       | sim            |
| `barLabel`     | string  | —                                                       | sim            |
| `emptyMessage` | string  | —                                                       | sim            |
| `valueFormat`  | string  | `BRL` · `compactBRL`                                    | sim            |

### `graph_chart`

consome **tabela**.

| propriedade   | tipo    | valores aceitos                                                       | lida no código |
| ------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `layout`      | string  | `force` · `layered` · `radial`                                        | sim            |
| `showLabels`  | boolean | —                                                                     | sim            |
| `showArrows`  | boolean | —                                                                     | sim            |
| `linkStyle`   | string  | `straight` · `curved`                                                 | sim            |
| `showLegend`  | boolean | —                                                                     | sim            |
| `palette`     | string  | `single` · `multi`                                                    | sim            |
| `accent`      | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `valueFormat` | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `h_bar_chart`

consome **série temporal**.

| propriedade   | tipo   | valores aceitos                                                       | lida no código |
| ------------- | ------ | --------------------------------------------------------------------- | -------------- |
| `palette`     | string | `single` · `multi`                                                    | sim            |
| `accent`      | string | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `valueFormat` | string | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `invoice_table`

consome **tabela**.

_Sem propriedades declaradas._

### `kpi`

consome **número único**.

| propriedade     | tipo    | valores aceitos                                                                                                                                                                                                                                                                                                                                                                                                    | lida no código |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `label`         | string  | —                                                                                                                                                                                                                                                                                                                                                                                                                  | sim            |
| `valueFormat`   | string  | `auto` · `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`                                                                                                                                                                                                                                                                                                                                             | sim            |
| `accent`        | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary`                                                                                                                                                                                                                                                                                                                                              | sim            |
| `icon`          | string  | `DollarSign` · `Banknote` · `Coins` · `Wallet` · `PiggyBank` · `CreditCard` · `Receipt` · `Landmark` · `TrendingUp` · `TrendingDown` · `Activity` · `BarChart3` · `LineChart` · `PieChart` · `Target` · `Gauge` · `Percent` · `Users` · `UserCheck` · `Building2` · `MapPin` · `FileText` · `ClipboardList` · `Calendar` · `Clock` · `AlertTriangle` · `CheckCircle2` · `Info` · `ArrowUpRight` · `ArrowDownRight` | sim            |
| `showDelta`     | boolean | —                                                                                                                                                                                                                                                                                                                                                                                                                  | sim            |
| `hint`          | string  | —                                                                                                                                                                                                                                                                                                                                                                                                                  | sim            |
| `deltaPolarity` | string  | `up-good` · `up-bad`                                                                                                                                                                                                                                                                                                                                                                                               | sim            |

### `leaderboard`

consome **categorias**.

| propriedade | tipo   | valores aceitos | lida no código |
| ----------- | ------ | --------------- | -------------- |
| `unit`      | string | —               | sim            |

### `line_chart`

consome **série temporal**.

| propriedade   | tipo    | valores aceitos                                                       | lida no código |
| ------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `smooth`      | boolean | —                                                                     | sim            |
| `area`        | boolean | —                                                                     | sim            |
| `palette`     | string  | `single` · `multi`                                                    | sim            |
| `accent`      | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `valueFormat` | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |

### `metric_glow`

consome **número único**.

| propriedade     | tipo    | valores aceitos                                                       | lida no código |
| --------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `label`         | string  | —                                                                     | sim            |
| `valueFormat`   | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |
| `accent`        | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `showDelta`     | boolean | —                                                                     | sim            |
| `deltaPolarity` | string  | `up-good` · `up-bad`                                                  | sim            |

### `progress_bar`

consome **número único**.

| propriedade | tipo    | valores aceitos                                                       | lida no código |
| ----------- | ------- | --------------------------------------------------------------------- | -------------- |
| `max`       | number  | —                                                                     | sim            |
| `variant`   | string  | `default` · `neutral` · `warning` · `error` · `success`               | sim            |
| `accent`    | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `showValue` | boolean | —                                                                     | sim            |

### `progress_circle`

consome **número único**.

| propriedade | tipo   | valores aceitos                                                       | lida no código |
| ----------- | ------ | --------------------------------------------------------------------- | -------------- |
| `max`       | number | —                                                                     | sim            |
| `variant`   | string | `default` · `neutral` · `warning` · `error` · `success`               | sim            |
| `accent`    | string | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |

### `radial_gauge`

consome **número único**.

| propriedade | tipo   | valores aceitos                                                       | lida no código |
| ----------- | ------ | --------------------------------------------------------------------- | -------------- |
| `max`       | number | —                                                                     | sim            |
| `min`       | number | —                                                                     | sim            |
| `unit`      | string | —                                                                     | sim            |
| `accent`    | string | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `variant`   | string | `semicircle` · `radial` · `dashed`                                    | sim            |

### `scatter_chart`

consome **série temporal**.

| propriedade     | tipo    | valores aceitos                                                       | lida no código |
| --------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `showLegend`    | boolean | —                                                                     | sim            |
| `showGridLines` | boolean | —                                                                     | sim            |
| `palette`       | string  | `single` · `multi`                                                    | sim            |
| `accent`        | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |

### `signal_card`

consome **série temporal**.

| propriedade     | tipo    | valores aceitos                                                       | lida no código |
| --------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `label`         | string  | —                                                                     | sim            |
| `valueFormat`   | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |
| `accent`        | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `trendPolarity` | string  | `up-good` · `up-bad`                                                  | sim            |
| `trendBasis`    | string  | `first-vs-last` · `prev-vs-last`                                      | sim            |
| `showSparkline` | boolean | —                                                                     | sim            |

### `spark_chart`

consome **série temporal**.

| propriedade | tipo   | valores aceitos                                                       | lida no código |
| ----------- | ------ | --------------------------------------------------------------------- | -------------- |
| `type`      | string | `area` · `bar` · `line`                                               | sim            |
| `curveType` | string | `linear` · `monotone` · `step`                                        | sim            |
| `accent`    | string | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |

### `stat_tile`

consome **número único**.

| propriedade     | tipo    | valores aceitos                                                       | lida no código |
| --------------- | ------- | --------------------------------------------------------------------- | -------------- |
| `label`         | string  | —                                                                     | sim            |
| `valueFormat`   | string  | `BRL` · `compactBRL` · `number` · `compactNumber` · `percent`         | sim            |
| `accent`        | string  | `chart-1` · `chart-2` · `chart-3` · `chart-4` · `chart-5` · `primary` | sim            |
| `showDelta`     | boolean | —                                                                     | sim            |
| `deltaPolarity` | string  | `up-good` · `up-bad`                                                  | sim            |
| `hint`          | string  | —                                                                     | sim            |

### `table`

consome **tabela**.

| propriedade | tipo    | valores aceitos | lida no código |
| ----------- | ------- | --------------- | -------------- |
| `pageSize`  | integer | —               | sim            |
| `dense`     | boolean | —               | sim            |

## Layout

### `collapsible_block`

não consome dados.

| propriedade   | tipo    | valores aceitos                         | lida no código |
| ------------- | ------- | --------------------------------------- | -------------- |
| `title`       | string  | —                                       | sim            |
| `defaultOpen` | boolean | —                                       | sim            |
| `columns`     | integer | —                                       | **NÃO**        |
| `gap`         | string  | `none` · `sm` · `md` · `lg`             | **NÃO**        |
| `align`       | string  | `stretch` · `start` · `center` · `end`  | **NÃO**        |
| `rowHeight`   | string  | `auto` · `compact` · `default` · `tall` | **NÃO**        |
| `itemSizing`  | string  | `equal` · `span`                        | **NÃO**        |
| `variant`     | string  | `plain` · `card` · `framed`             | sim            |

### `divider`

não consome dados.

| propriedade   | tipo   | valores aceitos           | lida no código |
| ------------- | ------ | ------------------------- | -------------- |
| `label`       | string | —                         | sim            |
| `orientation` | string | `horizontal` · `vertical` | sim            |
| `spacing`     | string | `sm` · `md` · `lg`        | sim            |

### `grid`

não consome dados.

| propriedade  | tipo    | valores aceitos                         | lida no código |
| ------------ | ------- | --------------------------------------- | -------------- |
| `columns`    | integer | —                                       | sim            |
| `gap`        | string  | `none` · `sm` · `md` · `lg`             | **NÃO**        |
| `align`      | string  | `stretch` · `start` · `center` · `end`  | **NÃO**        |
| `rowHeight`  | string  | `auto` · `compact` · `default` · `tall` | **NÃO**        |
| `itemSizing` | string  | `equal` · `span`                        | **NÃO**        |
| `variant`    | string  | `plain` · `card` · `framed`             | sim            |

### `mobius_loop`

não consome dados.

| propriedade | tipo    | valores aceitos            | lida no código |
| ----------- | ------- | -------------------------- | -------------- |
| `size`      | integer | —                          | sim            |
| `speed`     | string  | `slow` · `normal` · `fast` | sim            |

### `section`

não consome dados.

| propriedade  | tipo    | valores aceitos                         | lida no código |
| ------------ | ------- | --------------------------------------- | -------------- |
| `title`      | string  | —                                       | sim            |
| `subtitle`   | string  | —                                       | sim            |
| `columns`    | integer | —                                       | **NÃO**        |
| `gap`        | string  | `none` · `sm` · `md` · `lg`             | **NÃO**        |
| `align`      | string  | `stretch` · `start` · `center` · `end`  | **NÃO**        |
| `rowHeight`  | string  | `auto` · `compact` · `default` · `tall` | **NÃO**        |
| `itemSizing` | string  | `equal` · `span`                        | **NÃO**        |
| `variant`    | string  | `plain` · `card` · `framed`             | sim            |

### `sheet`

não consome dados.

| propriedade    | tipo    | valores aceitos                         | lida no código |
| -------------- | ------- | --------------------------------------- | -------------- |
| `triggerLabel` | string  | —                                       | sim            |
| `title`        | string  | —                                       | sim            |
| `description`  | string  | —                                       | sim            |
| `side`         | string  | `top` · `right` · `bottom` · `left`     | sim            |
| `columns`      | integer | —                                       | **NÃO**        |
| `gap`          | string  | `none` · `sm` · `md` · `lg`             | **NÃO**        |
| `rowHeight`    | string  | `auto` · `compact` · `default` · `tall` | **NÃO**        |
| `itemSizing`   | string  | `equal` · `span`                        | **NÃO**        |

## Texto

### `alert`

não consome dados.

| propriedade   | tipo    | valores aceitos                                                      | lida no código |
| ------------- | ------- | -------------------------------------------------------------------- | -------------- |
| `variant`     | string  | `default` · `info` · `success` · `warning` · `error` · `destructive` | sim            |
| `title`       | string  | —                                                                    | sim            |
| `description` | string  | —                                                                    | sim            |
| `showIcon`    | boolean | —                                                                    | sim            |
| `dismissible` | boolean | —                                                                    | sim            |

### `callout`

não consome dados.

| propriedade   | tipo    | valores aceitos                                      | lida no código |
| ------------- | ------- | ---------------------------------------------------- | -------------- |
| `variant`     | string  | `default` · `info` · `success` · `warning` · `error` | sim            |
| `title`       | string  | —                                                    | sim            |
| `description` | string  | —                                                    | sim            |
| `boxColor`    | string  | —                                                    | sim            |
| `textColor`   | string  | —                                                    | sim            |
| `showIcon`    | boolean | —                                                    | sim            |

### `rich_text`

não consome dados.

| propriedade | tipo   | valores aceitos | lida no código |
| ----------- | ------ | --------------- | -------------- |
| `markdown`  | string | —               | sim            |

## Título

### `flip_words`

não consome dados.

| propriedade | tipo    | valores aceitos | lida no código |
| ----------- | ------- | --------------- | -------------- |
| `prefix`    | string  | —               | sim            |
| `words`     | array   | —               | sim            |
| `duration`  | integer | —               | sim            |

### `title`

não consome dados.

| propriedade | tipo    | valores aceitos             | lida no código |
| ----------- | ------- | --------------------------- | -------------- |
| `text`      | string  | —                           | sim            |
| `level`     | integer | —                           | sim            |
| `align`     | string  | `left` · `center` · `right` | sim            |

---

## Como este mapa é verificado

A coluna **lida no código** é análise estática: a chave é acessada a partir de
`props`? Ela pega a prop esquecida, mas não a prop que é lida e cai num ramo
morto. Para essa — a que o usuário vê como "mudei e não aconteceu nada" —
existe o harness de render:

```bash
npx vitest run --config vite.config.ts src/shared/render-engine/catalog/__audit__
```

Ele renderiza cada bloco com CADA valor de enum e compara o HTML: valores que
produzem o mesmo desenho aparecem como `INERTE`.
