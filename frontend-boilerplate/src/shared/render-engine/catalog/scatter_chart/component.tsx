/**
 * Bloco `scatter_chart` (shape 'series', x/y numéricos) — usa o Vitrine
 * `ScatterChartTremor`. Cada ponto {x,y,series?} vira {x,y,category}.
 *
 * Prop de COR (canônico — alinhado ao `h_bar_chart`): `accent` aceita enum DS
 * + string custom (resolvido por `resolveAccent()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind (`bg-chart-N`); a UI
 *     base deriva `fill-chart-N`/`stroke-chart-N` e aplica nos pontos;
 *   - classe Tailwind (`bg-purple-500`) → idem, deriva `fill-`/`stroke-`;
 *   - cor CSS crua (`#40E0D0`, `rgb()`) → passada como COR LITERAL para o
 *     `<Scatter fill=…>`/`stroke=` do recharts (que aceita string CSS direto).
 *     **Por que não `style.background`**: o scatter é SVG — um símbolo SVG não
 *     tem `background`; ele pinta com `fill`/`stroke`. O caminho do `h_bar`
 *     (barras = `<div>` com `background`) NÃO funciona aqui — era a causa do
 *     bug "cor custom não aplica". Por isso convertemos o `background` que o
 *     `resolveAccent()` devolve numa cor literal (`customColor`) e a UI base a
 *     repassa como prop nativa do `<Scatter>`.
 *
 * Modo de aplicação (igual ao `h_bar_chart` — ver header de referência):
 *   - `palette: 'single'` → TODAS as categorias com `accent` (1 cor), seja
 *     enum/classe ou cor custom literal.
 *   - `palette: 'multi'` (default) → cicla a paleta (chart-1..5) por categoria;
 *     o `accent` custom é IGNORADO (a paleta cíclica do DS vence).
 *   - `palette: 'none'` → sem distinção (deixa a palette cíclica padrão).
 *
 * Limitação conhecida: GRADIENTE (`linear-gradient(...)`) NÃO é aplicável ao
 * `fill` de um símbolo SVG (precisaria de um `<linearGradient>` em `<defs>` +
 * `fill="url(#id)"`). Em `palette: 'single'` + gradiente, os pontos caem no
 * fallback `chart-1` (não quebra) — gradiente só funciona em blocos HTML
 * (barras). Use uma cor sólida (`#40E0D0`, `rgb(...)`) no scatter.
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "{count} pontos em {n} séries" — total de observações.
 *  - OPCIONAL 2ª: "Maior correlação: ({x}, {y})" — top ponto por y.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  ScatterChartTremor,
  type ScatterChartTremorDatum,
} from '@/components/ui/scatter-chart-tremor';
import { formatNumberBR, formatCompactNumberBR } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ScatterProps = {
  showLegend?: boolean;
  showGridLines?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor ÚNICA aplicada a TODAS as categorias (vence palette cíclica).
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccent()` em `lib/accent.ts`.
   */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<ScatterProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const rows: ScatterChartTremorDatum[] = points.map((p) => ({
    x: Number(p.x),
    y: p.y ?? 0,
    category: p.series ?? 'Série',
  }));

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) p/ enum/classe
  // ou { style: { background } } (CSS) p/ cor crua. O UI base deriva
  // fill/stroke/bg do bare da classe (`bg-chart-1` → `fill-chart-1 …`).
  const resolvedAccent = resolveAccent(props.accent);
  const palette = props.palette ?? 'multi';
  const isSingle = palette === 'single';

  // Modo SINGLE + enum/classe Tailwind → passa a classe; a UI base deriva
  // `fill-…`/`stroke-…` p/ os pontos (CSS do tema vence o atributo default).
  // Modo multi/none → nenhum accent global (categoria cicla a paleta).
  const accentClass: string | undefined =
    isSingle && resolvedAccent.kind === 'class'
      ? resolvedAccent.className
      : undefined;

  // Modo SINGLE + cor CSS crua → COR LITERAL p/ o `<Scatter fill=…>`. O
  // `resolveAccent()` empacota a cor crua em `style.background` (semântica de
  // <div>/barra HTML); o scatter é SVG e precisa de `fill`/`stroke`, então
  // desempacotamos a cor e a entregamos como `customColor` (string literal).
  // É a CORREÇÃO do bug "cor custom não funciona": antes mandávamos
  // `style={{ background }}` que o símbolo SVG ignora, e a classe
  // `fill-chart-1` (fallback) vencia → todos os pontos ficavam chart-1.
  const customColor: string | undefined =
    isSingle && resolvedAccent.kind === 'style'
      ? (resolvedAccent.style.background as string | undefined)
      : undefined;

  return (
    <ScatterChartTremor
      data={rows}
      x="x"
      y="y"
      category="category"
      showLegend={props.showLegend !== false}
      showGridLines={props.showGridLines !== false}
      valueFormatter={(v) => formatNumberBR(v)}
      axisValueFormatter={(v) => formatCompactNumberBR(v)}
      height="h-64"
      accent={accentClass}
      customColor={customColor}
    />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "{count} pontos em {n} séries" — total de observações
 *    e nº de categorias.
 *  - OPCIONAL 2ª: "Maior correlação: ({x}, {y})" — ponto de maior `y`
 *    (top da nuvem, se houver).
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatNumberBR` para os valores.
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const categories = new Set(points.map((p) => p.series ?? 'Série'));
  const insights: string[] = [
    `${points.length} pontos em ${categories.size} ${categories.size === 1 ? 'série' : 'séries'}`,
  ];

  if (points.length > 0) {
    const top = points.reduce((best, p) =>
      (p.y ?? 0) > (best.y ?? 0) ? p : best,
    );
    if ((top.y ?? 0) > 0) {
      insights.push(
        `Maior correlação: (${formatNumberBR(Number(top.x))}, ${formatNumberBR(top.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<ScatterProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;