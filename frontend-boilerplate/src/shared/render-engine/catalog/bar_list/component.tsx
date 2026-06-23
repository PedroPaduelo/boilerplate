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
 * Modo de aplicação (Turno 6 — multi IMPLEMENTADO):
 *   - `palette: 'single'` (default) → TODAS as barras com a mesma cor (accent).
 *     Passa `barStyle`/`barClassName` no nível global da `BarListTremor`.
 *   - `palette: 'multi'` → cicla palette (chart-1..5) por item, via
 *     `paletteClass(i)` aplicado em CADA item (`barClassName` por linha).
 *     (Turno 6 — IMPLEMENTADO: `BarListTremorItem` ganhou `barClassName?`/
 *     `barStyle?` por item, então o ciclo vai direto na barra de cada linha.)
 *   - `palette: 'none'` → sem distinção de cor (deixa o default do UI base).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Top 1: {label} ({value})".
 *  - OPCIONAL 2ª: "Último: {label} ({value})" — só se houver +1 item e
 *    o último > 0.
 */
import type { CSSProperties } from 'react';
import type { CategoricalData } from '@dashboards/contracts';
import { BarListTremor, type BarListTremorItem } from '@/components/ui/bar-list-tremor';
import { formatCompactBRL } from '@/shared/lib/format';
import { resolveAccent, paletteClass } from '../../lib/accent';
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

/** Row do BarListTremor (genérico ancorado em `unknown`). */
type BarListRow = BarListTremorItem<unknown>;

export const Component: BlockComponent<BarListProps, CategoricalData> = ({ props, data }) => {
  const items = (data ?? []) as CategoryPoint[];
  const palette = props.palette ?? 'single';

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). VENCE a classe `bg-chart-1` do UI
  // base quando `style` está presente.
  const resolvedAccent = resolveAccent(props.accent);
  const globalBarClassName: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const globalBarStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // Modo SINGLE → aplica accent GLOBAL no nível do BarListTremor (1 cor pra
  // todas as barras). Modo MULTI → cicla palette por item via `barClassName`
  // em cada row. Modo NONE → sem distinção (deixa o default `bg-chart-1`).
  const rows: BarListRow[] = items.map((d, i) => {
    const row: BarListRow = { name: d.label, value: d.value ?? 0 };
    if (palette === 'multi') {
      row.barClassName = paletteClass(i);
    }
    return row;
  });

  return (
    <BarListTremor
      data={rows}
      sortOrder={props.sortOrder ?? 'descending'}
      valueFormatter={(v) => formatCompactBRL(v)}
      // accent GLOBAL — aplicado quando `palette === 'single'`.
      // Em `multi`, cada row traz o próprio `barClassName` (paleta cíclica),
      // que VENCE o global via lógica de precedência do BarListTremor
      // (item.barClassName → barClassName global → bg-chart-1 default).
      // Em `none`, não passamos nada — UI base usa o `bg-chart-1` default.
      barStyle={palette === 'single' ? globalBarStyle : undefined}
      barClassName={palette === 'single' ? globalBarClassName : undefined}
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