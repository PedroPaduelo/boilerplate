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
 * Modo de aplicação (Turno 5 — expandido do `bar_chart`):
 *   - `palette: 'single'` (default) → TODAS as barras com a mesma cor (accent).
 *   - `palette: 'multi'` → cicla BG_PALETTE por item (cores diferentes
 *     por barra). O `HBarChart` ainda não cicla nativamente — vide warn.
 *   - `palette: 'none'` → sem distinção (deixa o default do UI base).
 *
 * `palette: 'multi'` warning (Turno 5 — replicado do bar_chart): `palette:
 * 'multi'` é aceito pelo schema mas o `HBarChart` da Vitrine é single-cor
 * por design (`accent` único). Avisamos em dev pra deixar a limitação
 * visível.
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
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { HBarChart } from '@/components/ui/h-bar-chart';
import { formatCompactNumberBR } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
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
  const series = points.map((p) => ({ label: String(p.x), value: p.y ?? 0 }));

  // valueFormatter flexível: usa a prop se passada, senão o default.
  const valueFormatter = props.valueFormatter ?? formatCompactNumberBR;

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). VENCE o default `bg-primary` do UI
  // base quando `style` está presente; senão, aplica a classe.
  const resolvedAccent = resolveAccent(props.accent);
  const chartAccent: string =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : 'bg-chart-1';
  const chartStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // `palette === 'multi'` warning: o HBarChart é single-cor por design
  // (vide JSDoc do bloco). Avisamos em dev.
  const warnedMultiRef = useRef(false);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      props.palette === 'multi' &&
      !warnedMultiRef.current
    ) {
      console.warn(
        '[h_bar_chart] `palette: "multi"` ainda não cicla cores — o HBarChart da Vitrine ' +
          'aplica uma cor única em todas as barras. Render atual usa `accent` único.',
      );
      warnedMultiRef.current = true;
    }
  }, [props.palette]);
  useEffect(() => {
    if (props.palette !== 'multi') warnedMultiRef.current = false;
  }, [props.palette]);

  return (
    <HBarChart
      series={series}
      accent={chartAccent}
      style={chartStyle}
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