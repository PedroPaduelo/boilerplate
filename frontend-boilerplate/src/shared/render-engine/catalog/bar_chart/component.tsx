/**
 * Bloco `bar_chart` (shape 'series') — usa o Vitrine `BarChart`.
 * Mapeia cada ponto {x,y} da série para {label,value} do gráfico e expõe um
 * `deriveTakeaway` (insight de rodapé exibido pelo ChartWidget).
 *
 * Prop de COR: `accent` é enum fechado (`chart-1..5 | 'primary'`), validado
 * pelo schema. Tradução enum → classe Tailwind via `accentClass()` em
 * `lib/accent.ts`. Default: `'chart-1'`.
 *
 * Prop `palette` (ENTREGA 3): aceita o valor; o render atual é single-série
 * (não cicla cores), então o valor não tem efeito ainda — entra em turno futuro.
 */
import type { SeriesData } from '@dashboards/contracts';
import { BarChart } from '@/components/ui/bar-chart';
import { HBarChart } from '@/components/ui/h-bar-chart';
import { formatCompactBRL } from '@/shared/lib/format';
import { accentClass, type AccentColor } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarProps = {
  stacked?: boolean;
  orientation?: 'vertical' | 'horizontal';
  accent?: AccentColor;
  palette?: 'single' | 'multi' | 'none';
};

/**
 * Tipo do ponto da série (no FE, `SeriesData` de @dashboards/contracts resolve
 * para `any` porque `json-schema-to-ts` não é dependência do FE — anotamos o
 * elemento localmente para manter o type-safety dentro do bloco).
 */
type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<BarProps, SeriesData> = ({ props, data }) => {
  // `palette` aceito no schema; render atual é single (não cicla cores).
  const points = (data ?? []) as SeriesPoint[];
  const series = points.map((d) => ({
    label: String(d.x),
    value: d.y ?? 0,
  }));
  // `accentClass()` traduz enum (chart-N | primary) em classe Tailwind
  // (`bg-chart-N` / `bg-primary`) que o UI base já consome nativamente.
  const accent = accentClass(props.accent);
  // `orientation: "horizontal"` re-aproveita o `HBarChart` (mesma "família" do
  // DS, mesmo accent e mesmo formatter). Vertical é o default.
  if (props.orientation === 'horizontal') {
    return (
      <HBarChart
        series={series}
        accent={accent}
        valueFormatter={(v) => formatCompactBRL(v)}
      />
    );
  }
  return (
    <BarChart
      series={series}
      accent={accent}
      valueFormatter={(v) => formatCompactBRL(v)}
    />
  );
};

/**
 * Insight de rodapé (takeaway): aponta a categoria de MAIOR valor da série
 * (ex.: "Maior valor: Mai (R$ 110)"). Valor formatado em PT-BR via format.ts —
 * mesmo formatter (`formatCompactBRL`) usado nas barras, p/ consistência.
 */
function deriveTakeaway(data: SeriesData): string | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;
  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;
  return `Maior valor: ${String(top.x)} (${formatCompactBRL(top.y ?? 0)})`;
}

export const definition = defineBlock<BarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;