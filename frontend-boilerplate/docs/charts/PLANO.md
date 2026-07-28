# PLANO — Repaginação do Catálogo de Gráficos

> Fonte de layout: `uploads/graficos-ref/graficos/` (referência de design dos gráficos
> do AuditorIA — 18 tipos, tokens, CSS e demo).
> Fonte de comportamento: o código atual do catálogo.
> **Em caso de conflito: layout segue a referência, comportamento segue o código.**

---

## 1. Estratégia

Três fases:

1. **Recon + BASE** (orquestrador, sequencial) — este documento, o `chart-theme`,
   o `ChartFrame`, a legenda, o tooltip, o esqueleto, o util de markdown +
   interpolação e a moldura `BlockFrame`. **Concluída antes de qualquer subagente subir.**
2. **Execução paralela** (1 subagente por gráfico/lote irmão) — só a camada visual
   de cada gráfico. Cada subagente edita APENAS os arquivos do seu lote.
3. **Consolidação** (orquestrador) — merge, lint, build, testes, revisão visual.

**Regra de paralelismo:** nenhum subagente edita `chart-theme.*`, `chart-frame`,
`chart-legend`, `chart-tooltip`, `chart-skeleton`, `chart-text`, `chart-template`,
`chart-axes`, `block-frame` ou `block-renderer`. Só consomem. Precisou mudar a base →
reporta ao orquestrador.

---

## 2. Base compartilhada (pronta)

| Arquivo                                 | Papel                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/charts/chart-theme.ts`       | **A especificação**: 9 cores de série na ordem (como token do DS), chrome, geometria, tipografia (px reais), motion, alturas, `darkenColor`/`fadeColor` |
| `shared/ui/charts/chart-theme.css`      | O que só o CSS resolve: tooltip translúcido com `blur(6px)`, onda do esqueleto, legenda própria, padding assimétrico do corpo                           |
| `shared/ui/charts/use-chart-palette.ts` | Resolve o tema **em profundidade** (segue cadeias de `var()`), expõe `colorAt`/`varAt`/`hoverAt`/`chrome`/`geometry`/`typography`/`motion`              |
| `shared/ui/charts/chart-axes.ts`        | Props compartilhados de grade/eixo/cursor/animação/raio de coluna                                                                                       |
| `shared/ui/charts/chart-frame.tsx`      | A casca: cabeçalho (título/subtítulo/descrição/ícone/ações), 5 estados, geometria, a11y                                                                 |
| `shared/ui/charts/chart-legend.tsx`     | `ChartLegend` (nativa, 13px/500) e `ChartLegends` (própria dos circulares, 11,375 + 14,875)                                                             |
| `shared/ui/charts/chart-tooltip.tsx`    | Tooltip da referência (branco 90%, blur, raio 10, título sobre faixa cinza)                                                                             |
| `shared/ui/charts/chart-skeleton.tsx`   | Esqueleto com onda; circular nos anéis                                                                                                                  |
| `shared/ui/charts/chart-template.ts`    | Interpolação `{{variavel}}` + vocabulário único derivado dos dados                                                                                      |
| `shared/ui/charts/chart-text.tsx`       | Markdown inline + interpolação (`ChartText`, `chartPlainText`)                                                                                          |
| `shared/lib/markdown.ts`                | Markdown → HTML sanitizado (documento e inline)                                                                                                         |
| `render-engine/block-frame.tsx`         | Moldura do bloco: header completo, estados, takeaways, rodapé técnico                                                                                   |

### 2.1 Paleta — referência ↔ token do DS

| #   | Referência | Token do DS                 | Nome no código |
| --- | ---------- | --------------------------- | -------------- |
| 1   | `#00A76F`  | `--ds-color-primary-main`   | `emerald`      |
| 2   | `#FFAB00`  | `--ds-color-warning-main`   | `amber`        |
| 3   | `#00B8D9`  | `--ds-color-info-main`      | `cyan`         |
| 4   | `#FF5630`  | `--ds-color-error-main`     | `red`          |
| 5   | `#22C55E`  | `--ds-color-success-main`   | `green`        |
| 6   | `#B76E00`  | `--ds-color-warning-dark`   | `bronze`       |
| 7   | `#065E49`  | `--ds-color-success-darker` | `forest`       |
| 8   | `#006C9C`  | `--ds-color-info-dark`      | `steel`        |
| 9   | `#003768`  | `--ds-color-info-darker`    | `navy`         |

Chrome: grade `--ds-color-divider` (= `rgba(145,158,171,.2)`), eixo
`--ds-color-text-disabled` (= `#919EAB`), rótulo `--ds-color-text-secondary`
(= `#637381`), ênfase `--ds-color-text-primary` (= `#1C252E`), faixa do tooltip
`--ds-color-background-neutral` (= `#F4F6F8`), trilha `--ds-color-action-selected`
(= 16%) e `--ds-color-action-hover` (= 8%).

**Zero hexadecimal escrito em componente.** Os nove valores da referência já existiam
no tema porque vêm da mesma auditoria de design.

---

## 3. Matriz: gráfico do catálogo ↔ layout da referência

| #   | Bloco (`catalog/<type>`)               | Layout de referência                                              | Arquivos do lote                                                                                               | Subagente |
| --- | -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `line_chart`                           | §1 Linha (320px, marcador 6/3, legenda ligada)                    | `charts/line-chart.tsx`, `catalog/line_chart/*`                                                                | SUB-01    |
| 2   | `area_chart`                           | §2 Área (gradiente 0.4→0 vertical)                                | `charts/area-chart.tsx`, `catalog/area_chart/*`                                                                | SUB-02    |
| 3   | `bar_chart`                            | §4/§5/§6/§7 Coluna simples, múltipla, empilhada e negativa        | `charts/bar-chart.tsx`, `catalog/bar_chart/*`                                                                  | SUB-03    |
| 4   | `h_bar_chart`                          | §8 Barra horizontal (altura 30%, raio 2, traço 0)                 | `charts/h-bar-chart.tsx`, `catalog/h_bar_chart/*`                                                              | SUB-04    |
| 5   | `donut`                                | §9 Pizza + §10 Rosca (furo 72%, legenda própria)                  | `charts/donut-chart.tsx`, `catalog/donut/*`                                                                    | SUB-05    |
| 6   | `radial_gauge`, `progress_circle`      | §11 Barra radial, §12 Medidor semicircular, §13 Medidor tracejado | `charts/radial-gauge.tsx`, `charts/progress-circle.tsx`, `catalog/radial_gauge/*`, `catalog/progress_circle/*` | SUB-06    |
| 7   | `scatter_chart`                        | §15 Dispersão (marcador 6, 8 divisões em X)                       | `charts/scatter-chart.tsx`, `catalog/scatter_chart/*`                                                          | SUB-07    |
| 8   | `spark_chart`, `signal_card`           | §04-2.3 Mini-gráfico de card de resumo (sparkline, 84×56)         | `charts/spark-chart.tsx`, `catalog/spark_chart/*`, `catalog/signal_card/*`                                     | SUB-08    |
| 9   | `bar_list`, `leaderboard`              | §8 Barra horizontal + legenda própria (ranking em DOM)            | `charts/bar-list.tsx`, `catalog/bar_list/*`, `catalog/leaderboard/*`                                           | SUB-09    |
| 10  | `kpi`, `stat_tile`, `metric_glow`      | §04-2 Card de resumo com tendência                                | `kpi-card.tsx`, `stat-tile.tsx`, `delta-badge.tsx`, `catalog/{kpi,stat_tile,metric_glow}/*`                    | SUB-10    |
| 11  | `progress_bar`                         | §8 Barra horizontal (versão escalar)                              | `charts/chart-bar-track.tsx`, `catalog/progress_bar/*`                                                         | SUB-11    |
| 12  | `table`, `data_table`, `invoice_table` | §05-4 Card + cabeçalho (tabular)                                  | `chart-data-table.tsx`, `catalog/{table,data_table,invoice_table}/*`                                           | SUB-12    |
| 13  | `funnel_stage`                         | §6 Coluna empilhada + §8 barra horizontal                         | `catalog/funnel_stage/*`                                                                                       | SUB-13    |

### 3.1 Lacunas — **PARAR E PERGUNTAR** (seção 9 do briefing)

**Layout na referência SEM bloco no catálogo** (5). Nenhum foi criado; aguardam decisão:

| Referência                       | Situação                     |
| -------------------------------- | ---------------------------- |
| §3 Misto (coluna + área + linha) | Não existe bloco equivalente |
| §14 Radar                        | Não existe                   |
| §16 Mapa de calor                | Não existe                   |
| §17 Mapa de árvore               | Não existe                   |
| §18 Diagrama de caixa            | Não existe                   |

**Bloco no catálogo SEM layout na referência** (7): `bar_list`, `leaderboard`,
`progress_bar`, `signal_card`, `funnel_stage`, `data_table`, `invoice_table`.
Repaginados **por analogia** com o layout mais próximo (coluna "Layout de referência"
acima) — decisão registrada em `NOTAS.md`.

---

## 4. Contrato comum (seção 6 do briefing) — onde cada parte mora

| Bloco do contrato                                                | Implementação                                                | Consumido por            |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| **Cabeçalho** (título, subtítulo, descrição, ícone/badge, ações) | `ChartFrame` + `BlockFrame`                                  | todos                    |
| **Dados**                                                        | `BlockRenderer` → `props.data`; escopo por `buildChartScope` | todos                    |
| **Markdown + `{{interpolação}}`**                                | `chart-template.ts` + `chart-text.tsx`                       | todos os campos de texto |
| **Estados** (carregando, vazio, erro, sem permissão)             | `ChartFrame.state` / `BlockFrame.state`                      | todos                    |
| **Parâmetros existentes**                                        | `manifest.propsSchema` intocado                              | todos                    |

---

## 5. Ordem de execução

1. ✅ Base (orquestrador).
2. ✅ SUB-01 … SUB-14 em paralelo (arquivos disjuntos) — **14 lotes, 0 conflitos**.
3. ✅ Consolidação: tokens que estavam em constante local subiram ao `chart-theme`,
   `CHART_BODY_HEIGHT` ajustado aos 320px da referência, `ChartCenterLabel` na
   tipografia da referência, `RankingBar` no barril. Lint, typecheck, testes e
   build verdes. Ver `CHANGELOG.md` e a seção CONSOLIDAÇÃO de `NOTAS.md`.

## 6. Critérios de pronto por lote

- [ ] Nenhuma prop pública removida/renomeada (`manifest.propsSchema` intocado).
- [ ] Consome `ChartFrame` + `useChartPalette`; zero hex/rgb/px de estilo no componente.
- [ ] Contrato comum implementado (header, dados, markdown, estados).
- [ ] Checklist de conformidade visual preenchida no `component.tsx`.
- [ ] `component.test.tsx` verde (consulta por papel acessível, nunca por classe).
