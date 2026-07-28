# BRIEFING — repaginação visual de UM gráfico do catálogo

> Leia isto INTEIRO antes de editar qualquer arquivo. Depois leia `PLANO.md`
> (matriz gráfico ↔ layout) e a seção da referência que corresponde ao SEU lote.

## 0. Sua missão, em uma frase

Reescrever a **camada visual** do(s) gráfico(s) do seu lote para ficar **idêntica**
ao layout de referência — pixel perfect —, **sem alterar nenhuma prop pública** e
**sem quebrar** nada do catálogo.

## 1. Onde está a fonte da verdade

| O quê                                       | Onde                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Layout / medidas / cores                    | `uploads/graficos-ref/graficos/` (raiz do workspace, fora do `frontend-boilerplate`) |
| Fundamentos (paleta, tipografia, checklist) | `uploads/graficos-ref/graficos/01-fundamentos.md`                                    |
| Configuração base herdada por todos         | `uploads/graficos-ref/graficos/02-configuracao-base.md`                              |
| **A seção do SEU tipo**                     | `uploads/graficos-ref/graficos/03-tipos-de-grafico.md`                               |
| Cards de resumo / mini-gráficos             | `uploads/graficos-ref/graficos/04-widgets-prontos.md`                                |
| Tooltip, legenda, card, esqueleto           | `uploads/graficos-ref/graficos/05-tooltip-legenda-css.md`                            |
| Tradução Apex → Recharts                    | `uploads/graficos-ref/graficos/06-portabilidade.md` §3.1                             |
| Comportamento / props                       | o código atual do bloco                                                              |

**Conflito:** layout segue a referência, comportamento segue o código atual.

## 2. A BASE já está pronta — você CONSOME, não edita

**PROIBIDO editar** (qualquer um destes arquivos é do orquestrador):

```
src/shared/ui/charts/chart-theme.ts        src/shared/ui/charts/chart-theme.css
src/shared/ui/charts/use-chart-palette.ts  src/shared/ui/charts/chart-axes.ts
src/shared/ui/charts/chart-frame.tsx       src/shared/ui/charts/chart-legend.tsx
src/shared/ui/charts/chart-tooltip.tsx     src/shared/ui/charts/chart-skeleton.tsx
src/shared/ui/charts/chart-text.tsx        src/shared/ui/charts/chart-template.ts
src/shared/ui/charts/chart-series-tooltip.tsx
src/shared/ui/charts/chart-swatch.tsx      src/shared/ui/charts/chart-center-label.tsx
src/shared/ui/charts/chart-data.ts         src/shared/ui/charts/types.ts
src/shared/ui/charts/index.ts              src/shared/ui/index.ts
src/shared/ui/chart-accent.ts              src/shared/lib/markdown.ts
src/shared/render-engine/block-frame.tsx   src/shared/render-engine/block-renderer.tsx
src/shared/render-engine/block-state.ts    src/shared/render-engine/types.ts
src/shared/render-engine/registry.ts       src/app/index.css
docs/charts/*
```

Precisou de algo que a base não tem? **NÃO edite a base.** Escreva o pedido em
`docs/charts/PEDIDOS-BASE.md` (append, com seu ID de lote) e siga com a melhor
alternativa possível dentro dos seus arquivos.

### 2.1 O que a base te dá

```ts
import {
  ChartFrame, // casca: cabeçalho + 5 estados + geometria + a11y
  ChartLegend, // legenda nativa (13px/500, marcador circular 12px)
  ChartLegends, // legenda PRÓPRIA dos circulares (11,375 + 14,875)
  ChartTooltip, // tooltip translúcido com blur (o da referência)
  ChartSeriesTooltip, // ponte payload do recharts → ChartTooltip
  ChartSkeleton, // esqueleto com onda (circular nos anéis)
  ChartText, // markdown inline + {{interpolação}} (DOM)
  chartPlainText, // idem, texto puro (aria-label, <text> do SVG)
  buildChartScope, // dados → escopo de {{variáveis}}
  useChartPalette, // cores + geometria + tipografia + motion, do tema
  chartGridProps,
  chartAxisProps,
  chartYAxisProps,
  chartCursorProps,
  chartBarCursorProps,
  chartAnimationProps,
  chartBarRadius,
  CHART_MARGIN,
  CHART_SPARK_MARGIN,
  Y_AXIS_WIDTH,
  CHART_HEIGHT,
} from '@/shared/ui';
```

`useChartPalette()` devolve:

```ts
palette.colorAt(i, override?)   // cor RESOLVIDA da série i  → use em SVG
palette.varAt(i, override?)     // var(--token) da série i    → use no DOM
palette.hoverAt(i)              // a mesma cor ESCURECIDA (hover/ativo)
palette.chrome('grid'|'axis'|'label'|'emphasis'|'surface'|'tooltipTitle'
              |'track'|'trackLight'|'markerStroke'|'neutral'|'accent'
              |'positive'|'warning'|'negative'|'primaryDark')
palette.primary80               // rgba(0,120,103,.8) — a cor mais usada da referência
palette.geometry                // lineWidth 2.5, barRadius 4, barWidth .48, gridDash '3 3', …
palette.typography              // axis 12/400, legend 13/500, centerValue 17.5/700, …
palette.motion                  // duration 360, stagger 120, hoverDarken .2
```

## 3. Restrições ABSOLUTAS

1. **NÃO altere, renomeie ou remova nenhuma prop pública existente** — nem no
   `manifest.propsSchema`, nem nas props do componente de `shared/ui/charts`.
   Adicionar prop OPCIONAL é permitido; mudar default só se a referência exigir
   (e aí registre em `NOTAS.md`).
2. **Zero hardcode de estilo.** Nenhum `#hex`, `rgb()`, `oklch()`, nenhum
   `fontSize: 12` cravado, nenhum `strokeWidth: 2` cravado. Tudo vem de
   `useChartPalette()`. A única exceção é geometria que dependa do DADO em
   runtime (largura de barra em %, por exemplo) — e nesse caso comente o porquê.
3. **Consuma `ChartFrame`** — não reinvente estado vazio/carregando/erro.
4. **Não troque a biblioteca de charts** (é recharts). Se algo for impossível,
   PARE e escreva em `docs/charts/PEDIDOS-BASE.md`.
5. **Não toque em arquivo fora do seu lote.** Outro subagente está trabalhando
   em paralelo nos arquivos dele.

## 4. Os 7 detalhes que fazem parecer igual (checklist mínimo)

| #   | Regra                                           | Como fazer aqui                                                                               |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Grade **só horizontal**, tracejada 3            | `<CartesianGrid {...chartGridProps(palette)} />`                                              |
| 2   | Eixos **sem linha e sem marcações**             | `{...chartAxisProps(palette)}` / `{...chartYAxisProps(palette)}`                              |
| 3   | Texto dos eixos 12px/400/`#919EAB`              | já vem de `chartAxisProps`                                                                    |
| 4   | Linhas 2,5px, curva suave, **sem pontos**       | `strokeWidth={palette.geometry.lineWidth}` `type="monotone"` `dot={false}`                    |
| 5   | Coluna com raio 4px **só no topo**, largura 48% | `radius={chartBarRadius(palette)}` + `barCategoryGap` derivado de `palette.geometry.barWidth` |
| 6   | Hover **escurece** (a maioria das libs clareia) | `activeBar`/`activeDot` com `palette.hoverAt(i)`                                              |
| 7   | Tooltip branco 90% com blur                     | `content={<ChartSeriesTooltip … />}` (já é o da referência)                                   |

Mais: animação de entrada `{...chartAnimationProps(palette, i)}` (360ms, 120ms de
atraso por série); circulares **sem eixo e sem grade**, com `ChartLegends` **fora**
do desenho.

## 5. Contrato comum — obrigatório no SEU bloco

Todo bloco do catálogo expõe os mesmos blocos na tela de propriedades. Você
implementa a parte do seu componente:

1. **Cabeçalho** — o `BlockFrame` já desenha título/subtítulo/descrição/badge/ações
   a partir do bloco. **Não desenhe um segundo título dentro do gráfico.**
2. **Dados** — todo bloco aceita fonte de dados. Se o seu tipo hoje é "decorativo",
   passe a aceitar `data` e use-a (mesmo que só para interpolar texto).
3. **Markdown + `{{interpolação}}`** — qualquer texto que o seu bloco desenhe
   (rótulo, mensagem de vazio, legenda de eixo, rótulo central) passa por
   `chartPlainText(texto, scope)` (SVG/aria) ou `<ChartText value={texto} scope={scope} />`
   (DOM). O escopo vem de `buildChartScope(data, extras)`.
4. **Estados** — `ChartFrame` cobre carregando / vazio / erro / sem permissão.
   Mapeie `state === 'loading' | 'skeleton'` → `isLoading`, `'error'` → `state="error"`.
5. **Parâmetros existentes continuam funcionando** — reveja cada prop do
   `propsSchema` e confirme que ela ainda tem efeito.

## 6. Entregáveis do seu lote

- [ ] Componente(s) de `shared/ui/charts/` do lote, repaginado(s).
- [ ] Bloco(s) de `render-engine/catalog/<type>/component.tsx` adaptado(s).
- [ ] `component.test.tsx` do bloco **passando** (crie se não existir; consulte por
      papel acessível, **nunca** por classe — os nomes são hashes do StyleX).
- [ ] Checklist de conformidade visual preenchida no topo do `component.tsx`
      (comentário `CONFORMIDADE VISUAL` com um item por linha da tabela §4).
- [ ] Ambiguidade de layout → decisão registrada em `docs/charts/NOTAS.md`
      (append, com seu ID de lote).

## 7. Como validar antes de encerrar

```bash
cd frontend-boilerplate
npx tsc -b --noEmit 2>&1 | grep -v "catalog.test.tsx\|public-dashboard-view.tsx"   # 2 erros PRÉ-EXISTENTES, ignore
npx vitest run --config vite.config.ts <caminho dos seus testes>
npx eslint <seus arquivos>
```

Encerre com um relatório curto: o que mudou, decisões tomadas, o que ficou pendente.
