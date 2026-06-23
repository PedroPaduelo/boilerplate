/**
 * Bloco `bar_list` (shape 'categorical') — usa o Vitrine `BarListTremor`.
 * Mapeia {label,value} para {name,value} (formato esperado pela lista).
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
 *     por linha). O `BarListTremor` ainda não cicla nativamente — usa
 *     `bg-chart-1` hardcoded; a prop fica no schema para preparar o
 *     override futuro. Ver aviso abaixo.
 *   - `palette: 'none'` → sem distinção de cor (deixa o default do UI base).
 *
 * `palette: 'multi'` warning (Turno 5 — replicado do bar_chart): `palette:
 * 'multi'` é aceito pelo schema mas o `BarListTremor` da Vitrine é
 * single-cor por design (`bg-chart-1` hardcoded). Avisamos em dev pra
 * deixar a limitação visível.
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Top 1: {label} ({value})".
 *  - OPCIONAL 2ª: "Último: {label} ({value})" — só se houver +1 item e
 *    o último > 0.
 */
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { CategoricalData } from '@dashboards/contracts';
import { BarListTremor } from '@/components/ui/bar-list-tremor';
import { formatCompactBRL } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarListProps = {
  sortOrder?: 'ascending' | 'descending' | 'none';
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da barra (só usado em palette="single").
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccent()` em `lib/accent.ts` — devolve
   * `{ className: 'bg-…' }` (Tailwind) ou `{ style: { background } }`
   * (CSS). VENCE `className` quando setado.
   */
  accent?: string;
};

type CategoryPoint = { label: string; value: number | null };

export const Component: BlockComponent<BarListProps, CategoricalData> = ({ props, data }) => {
  const items = (data ?? []) as CategoryPoint[];
  const rows = items.map((d) => ({ name: d.label, value: d.value ?? 0 }));

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). VENCE a classe `bg-chart-1` do UI
  // base quando `style` está presente.
  const resolvedAccent = resolveAccent(props.accent);
  const barClassName: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const barStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // `palette === 'multi'` warning: o BarListTremor é single-cor por design
  // (vide JSDoc do bloco). Avisamos em dev.
  const warnedMultiRef = useRef(false);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      props.palette === 'multi' &&
      !warnedMultiRef.current
    ) {
      console.warn(
        '[bar_list] `palette: "multi"` ainda não cicla cores — o BarListTremor da Vitrine ' +
          'aplica uma cor única em todas as barras. Render atual usa `accent` único.',
      );
      warnedMultiRef.current = true;
    }
  }, [props.palette]);
  useEffect(() => {
    if (props.palette !== 'multi') warnedMultiRef.current = false;
  }, [props.palette]);

  return (
    <BarListTremor
      data={rows}
      sortOrder={props.sortOrder ?? 'descending'}
      valueFormatter={(v) => formatCompactBRL(v)}
      // accent resolvido — `barStyle` vence `barClassName` na UI base
      // (atributo de apresentação > classe CSS).
      barStyle={barStyle}
      barClassName={barClassName}
    />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "Top 1: {label} ({value em BRL compacto})".
 *  - OPCIONAL 2²: "Último: {label} ({value em BRL compacto})" — só se
 *    houver +1 item E o último > 0.
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatCompactBRL` (mesmo formatter do `bar_chart`).
 */
function deriveTakeaway(data: CategoricalData): string[] | undefined {
  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) return undefined;

  const top = items.reduce((best, d) => ((d.value ?? 0) > (best.value ?? 0) ? d : best));
  if ((top.value ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Top 1: ${top.label} (${formatCompactBRL(top.value ?? 0)})`,
  ];

  if (items.length > 1) {
    const bottom = items.reduce((best, d) =>
      (d.value ?? 0) < (best.value ?? 0) ? d : best,
    );
    if ((bottom.value ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Último: ${bottom.label} (${formatCompactBRL(bottom.value ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<BarListProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;