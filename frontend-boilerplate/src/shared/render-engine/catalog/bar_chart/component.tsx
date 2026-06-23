/**
 * Bloco `bar_chart` (shape 'series') — usa o Vitrine `BarChart` (vertical,
 * default) ou `HBarChart` (horizontal). Mapeia cada ponto {x,y} da série
 * para {label,value} do gráfico e expõe um `deriveTakeaway` (insights de
 * rodapé exibidos pelo ChartWidget).
 *
 * Prop de COR: `accent` é enum fechado (`chart-1..5 | 'primary'`), validado
 * pelo schema. Mas o input livre do playground permite string custom —
 * `resolveAccent()` em `lib/accent.ts` traduz 1:1 para a classe Tailwind
 * (`bg-chart-N` / `bg-primary`) OU aplica via `style.background` quando é
 * cor CSS crua (`#40E0D0`, `rgb(0,255,0)`, `oklch(...)`, `linear-gradient(...)`).
 * Default: `'chart-1'`.
 *
 * Prop `palette` (Turno 6 — multi IMPLEMENTADO):
 *  - `'single'` (default): toda a série usa `accent` (1 cor). Passa
 *    `accent`/`style` no nível global do BarChart/HBarChart.
 *  - `'multi'`: cada ponto vira uma cor do PALETTE (chart-1..5 cíclico),
 *    via `paletteClass(i)` aplicado em CADA datum (`barClassName` por
 *    barra). (Turno 6 — IMPLEMENTADO: `BarChartDatum` e `HBarChartDatum`
 *    ganharam `barClassName?`/`barStyle?` por item.)
 *  - `'none'`: o bloco segue igual a `'single'` (sem distinção de cor).
 *
 * Prop `valueFormatter` (opcional, novo): permite trocar o formatador do
 * valor exibido na barra / tooltip / valor horizontal. Default interno é
 * `formatCompactBRL` (consistente com o padrão atual). O objetivo é
 * normalizar — se você quiser moeda crua, número inteiro etc., basta
 * passar um formatter via prop (sem mexer no componente).
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { BarChart, type BarChartDatum } from '@/components/ui/bar-chart';
import { HBarChart, type HBarChartDatum } from '@/components/ui/h-bar-chart';
import { formatCompactBRL } from '@/shared/lib/format';
import { resolveAccent, paletteClass } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarProps = {
  stacked?: boolean;
  orientation?: 'vertical' | 'horizontal';
  /**
   * Cor da barra. Aceita:
   *  - enum DS: 'chart-1'..'chart-5' | 'primary' (validado pelo schema)
   *  - classe Tailwind: 'bg-purple-500' (custom)
   *  - cor CSS: '#40E0D0', 'rgb(0,255,0)', 'oklch(...)', 'linear-gradient(...)'
   *  - bare color: 'purple-500' (vira 'bg-purple-500' por conveniência)
   * Resolvido por `resolveAccent()` em `lib/accent.ts` — devolve
   * `{ className }` (Tailwind) ou `{ style: { background } }` (CSS).
   */
  accent?: string;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Formatter do valor exibido no topo da barra / tooltip / valor lateral
   * (no `HBarChart`). Default: `formatCompactBRL` ("R$ 2,61 bi"). O bloco
   * normaliza para o caller trocar via prop — sem precisar editar o
   * componente.
   */
  valueFormatter?: (value: number) => string;
};

/**
 * Tipo do ponto da série (no FE, `SeriesData` de @dashboards/contracts resolve
 * para `any` porque `json-schema-to-ts` não é dependência do FE — anotamos o
 * elemento localmente para manter o type-safety dentro do bloco).
 */
type SeriesPoint = { x: string | number; y: number | null; series?: string };

function defaultFormatter(value: number): string {
  return formatCompactBRL(value);
}

export const Component: BlockComponent<BarProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const palette = props.palette ?? 'single';

  // `valueFormatter` flexível: usa a prop se passada, senão o default BRL
  // (mantém o comportamento atual do bloco).
  const valueFormatter = props.valueFormatter ?? defaultFormatter;

  // `resolveAccent()` decide se a cor é enum (classe Tailwind) ou cor CSS
  // (style.background). Cobre o playground (que aceita `#40E0D0`,
  // `linear-gradient(...)`, etc.) sem quebrar a paleta do DS.
  const resolvedAccent = resolveAccent(props.accent);
  const globalBarClassName: string =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : 'bg-chart-1';
  const globalBarStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // Modo MULTI → cicla palette por item via `barClassName` em cada datum.
  // SINGLE/NONE → só o accent GLOBAL é aplicado.
  const isMulti = palette === 'multi';

  // `orientation: "horizontal"` re-aproveita o `HBarChart` (mesma "família" do
  // DS, mesmo accent e mesmo formatter). Vertical é o default.
  if (props.orientation === 'horizontal') {
    const series: HBarChartDatum[] = points.map((d, i) => {
      const datum: HBarChartDatum = { label: String(d.x), value: d.y ?? 0 };
      if (isMulti) datum.barClassName = paletteClass(i);
      return datum;
    });
    return (
      <HBarChart
        series={series}
        // accent GLOBAL — aplicado em `palette === 'single'`. Em `multi`,
        // cada datum traz o próprio `barClassName` (paleta cíclica), que
        // VENCE o global via lógica de precedência do HBarChart.
        accent={palette === 'single' ? globalBarClassName : 'bg-chart-1'}
        style={palette === 'single' ? globalBarStyle : undefined}
        valueFormatter={valueFormatter}
      />
    );
  }
  const series: BarChartDatum[] = points.map((d, i) => {
    const datum: BarChartDatum = { label: String(d.x), value: d.y ?? 0 };
    if (isMulti) datum.barClassName = paletteClass(i);
    return datum;
  });
  return (
    <BarChart
      series={series}
      // accent GLOBAL — idem bloco `h_bar_chart` (acima).
      accent={palette === 'single' ? globalBarClassName : 'bg-chart-1'}
      style={palette === 'single' ? globalBarStyle : undefined}
      valueFormatter={valueFormatter}
    />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas
 * (cada uma vira 1 linha com lâmpada no ChartWidget):
 *  - SEMPRE a 1ª: "Maior valor: {x} ({y em BRL compacto})".
 *  - OPCIONAL 2ª: "Menor valor: {x} ({y em BRL compacto})" — só se
 *    houver mais de 1 ponto E o menor valor for > 0 (evita mostrar
 *    "Menor valor: X (R$ 0)" quando todos os pontos são zero).
 *
 * Retorno `string[]` (novo padrão); o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. Formato PT-BR via
 * `formatCompactBRL` (mesmo formatter das barras → consistência visual).
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Maior valor: ${String(top.x)} (${formatCompactBRL(top.y ?? 0)})`,
  ];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) =>
      (p.y ?? 0) < (best.y ?? 0) ? p : best,
    );
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor valor: ${String(bottom.x)} (${formatCompactBRL(bottom.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<BarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;