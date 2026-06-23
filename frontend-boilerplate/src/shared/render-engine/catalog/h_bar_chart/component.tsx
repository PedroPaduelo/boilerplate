/**
 * Bloco `h_bar_chart` (shape 'series') — usa o Vitrine `HBarChart` (barras
 * horizontais). Mapeia cada ponto {x,y} para {label,value}.
 *
 * Prop de COR (Turno 5 — canônico): `accent` aceita enum DS + string custom
 * (resolvido por `resolveAccent()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind `bg-chart-N`
 *     (regra CSS do tema resolve `var(--color-chart-1)`);
 *   - classe Tailwind (bg-purple-500) → usa direto;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.background` inline
 *     na barra (atributo de apresentação que vence a classe CSS).
 *
 * Modo de aplicação (Turno 6 — multi IMPLEMENTADO):
 *   - `palette: 'single'` (default) → TODAS as barras com a mesma cor (accent).
 *     Passa `style`/`accent` no nível GLOBAL do HBarChart.
 *   - `palette: 'multi'` → cicla palette (chart-1..5) por item, via
 *     `paletteClass(i)` aplicado em CADA datum (`barClassName` por linha).
 *     (Turno 6 — IMPLEMENTADO: `HBarChartDatum` ganhou `barClassName?`/
 *     `barStyle?` por item, então o ciclo vai direto na barra de cada linha.)
 *   - `palette: 'none'` → sem distinção (deixa o default do UI base).
 *
 * `valueFormatter` (opcional, novo Turno 5): permite trocar o formatador do
 * valor exibido no rótulo lateral + tooltip (default interno
 * `formatCompactNumberBR`). O bloco normaliza para o caller trocar via prop
 * — sem precisar editar o componente.
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Maior: {label} ({y})".
 *  - OPCIONAL 2ª: "Menor: {label} ({y})" — só se houver +1 ponto e
 *    o menor > 0.
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { HBarChart, type HBarChartDatum } from '@/components/ui/h-bar-chart';
import { formatCompactNumberBR } from '@/shared/lib/format';
import { resolveAccent, paletteClass } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HBarProps = {
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da barra (só usado em palette="single").
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccent()` em `lib/accent.ts` — devolve
   * `{ className: 'bg-…' }` (Tailwind) ou `{ style: { background } }`
   * (CSS). VENCE `className` quando setado.
   */
  accent?: string;
  /**
   * Formatter do valor exibido no rótulo lateral + tooltip. Default:
   * `formatCompactNumberBR` ("2,6 mil"). O bloco normaliza para o
   * caller trocar via prop — sem precisar editar o componente.
   */
  valueFormatter?: (value: number) => string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<HBarProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const palette = props.palette ?? 'single';

  // valueFormatter flexível: usa a prop se passada, senão o default.
  const valueFormatter = props.valueFormatter ?? formatCompactNumberBR;

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). VENCE o default `bg-primary` do UI
  // base quando `style` está presente; senão, aplica a classe.
  const resolvedAccent = resolveAccent(props.accent);
  const globalBarClassName: string =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : 'bg-chart-1';
  const globalBarStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // Modo SINGLE → aplica accent GLOBAL no nível do HBarChart (1 cor pra
  // todas as barras). Modo MULTI → cicla palette por item via
  // `barClassName` em cada datum. Modo NONE → sem distinção (default
  // `bg-primary` do UI base, vence por estar ausente no nível global).
  const series: HBarChartDatum[] = points.map((p, i) => {
    const datum: HBarChartDatum = { label: String(p.x), value: p.y ?? 0 };
    if (palette === 'multi') {
      datum.barClassName = paletteClass(i);
    }
    return datum;
  });

  return (
    <HBarChart
      series={series}
      // accent GLOBAL — aplicado em `palette === 'single'`. Em `multi`, cada
      // datum traz o próprio `barClassName` (paleta cíclica), que VENCE o
      // global via lógica de precedência do HBarChart. Em `none`, passa só
      // o fallback `bg-chart-1` (senão usa `bg-primary` default do UI base).
      accent={palette === 'single' ? globalBarClassName : 'bg-chart-1'}
      style={palette === 'single' ? globalBarStyle : undefined}
      valueFormatter={valueFormatter}
    />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "Maior: {label} ({y em número compacto})".
 *  - OPCIONAL 2ª: "Menor: {label} ({y em número compacto})" — só se
 *    houver +1 ponto E o menor > 0.
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatCompactNumberBR` (mesmo formatter das barras).
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Maior: ${String(top.x)} (${formatCompactNumberBR(top.y ?? 0)})`,
  ];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) =>
      (p.y ?? 0) < (best.y ?? 0) ? p : best,
    );
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor: ${String(bottom.x)} (${formatCompactNumberBR(bottom.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<HBarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;