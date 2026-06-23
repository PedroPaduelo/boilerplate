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
 * Modo de aplicação (Turno 6 — multi IMPLEMENTADO; ENTREGA 1 — multi IGNORA
 * accent custom):
 *   - `palette: 'single'` (default) → TODAS as barras com a mesma cor (accent).
 *     Passa `style`/`accent` no nível GLOBAL do HBarChart.
 *   - `palette: 'multi'` → cicla palette (chart-1..5) por item, via
 *     `paletteClass(i)` aplicado em CADA datum (`barClassName` por linha).
 *     **ENTREGA 1**: o accent custom (`#40E0D0`, gradient, classe Tailwind
 *     fora do DS) é IGNORADO em `palette: 'multi'` — a paleta cíclica do DS
 *     vence. Custom só vale em `palette: 'single'` (single mode). Antes, o
 *     accent custom quebrava o ciclo (só a 1ª barra ficava colorida; as
 *     outras caíam no default `bg-primary`).
 *   - `palette: 'none'` → sem distinção (deixa o default do UI base).
 *
 * `valueFormat` (ENTREGA 2 — enum FECHADO, NÃO campo aberto): a prop vira um
 * enum com valores canônicos do DS (`BRL`, `compactBRL`, `number`,
 * `compactNumber`, `percent`) — cada valor casa 1:1 com um helper de
 * `format.ts` via `formatValueByEnum()`. O schema do manifest fecha como
 * `<Select>` no playground (sem input livre) e a AJV valida na borda. O
 * `defaultProps` + o default interno do componente é `'compactBRL'`
 * (consistente com o padrão atual — `formatCompactBRL` no `HBarChart`).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Maior: {label} ({y})".
 *  - OPCIONAL 2ª: "Menor: {label} ({y})" — só se houver +1 ponto e
 *    o menor > 0.
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { HBarChart, type HBarChartDatum } from '@/components/ui/h-bar-chart';
import {
  formatCompactBRL,
  formatValueByEnum,
  type ValueFormat,
} from '@/shared/lib/format';
import { resolveAccent, paletteClass } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HBarProps = {
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da barra (só usado em palette="single" — em "multi" a paleta
   * cíclica do DS vence; ver ENTREGA 1 no header).
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccent()` em `lib/accent.ts` — devolve
   * `{ className: 'bg-…' }` (Tailwind) ou `{ style: { background } }`
   * (CSS). VENCE `className` quando setado.
   */
  accent?: string;
  /**
   * (ENTREGA 2) Formato do valor exibido no rótulo lateral + tooltip.
   * ENUM FECHADO — default `'compactBRL'` (consistente com o histórico
   * do bloco). O component normaliza para a UI base via
   * `formatValueByEnum()` de `format.ts`. Sem input livre — o schema
   * trava o domínio.
   */
  valueFormat?: ValueFormat;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<HBarProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const palette = props.palette ?? 'single';

  // (ENTREGA 2) valueFormat enum → formatador concreto. Default
  // 'compactBRL' (consistente com o histórico — antes da ENTREGA 2, o
  // default era `formatCompactNumberBR`; o `bar_chart` irmão já usa BRL
  // como default desde o Turno 5, então alinhamos aqui para o DS ficar
  // uniforme entre "barras verticais" e "barras horizontais").
  const valueFormatter = (v: number) =>
    formatValueByEnum(v, props.valueFormat ?? 'compactBRL');

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). VENCE o default `bg-primary` do UI
  // base quando `style` está presente; senão, aplica a classe.
  const resolvedAccent = resolveAccent(props.accent);
  const globalBarClassName: string =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : 'bg-chart-1';
  const globalBarStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // ENTREGA 1 — multi IGNORA accent custom: em `palette === 'multi'`, a
  // paleta cíclica do DS (chart-1..5) SEMPRE vence — não aplicamos
  // `globalBarClassName`/`globalBarStyle` no nível do HBarChart nesse
  // modo (passamos só o fallback `bg-chart-1` e `style=undefined`).
  // Antes, o accent custom quebrava o ciclo (a 1ª barra ficava colorida
  // via `style` global; as outras, sem `barStyle` próprio, caíam no
  // `bg-primary` default).
  const applyGlobalAccent = palette === 'single';

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
      // datum traz o próprio `barClassName` (paleta cíclica) — o global
      // fica em fallback `bg-chart-1` para que a UI base NÃO tente aplicar
      // accent custom por cima (entre Turnos 5 e 6, o accent custom
      // "vazava" pro multi e quebrava a 2ª+ barra — ver ENTREGA 1).
      accent={applyGlobalAccent ? globalBarClassName : 'bg-chart-1'}
      style={applyGlobalAccent ? globalBarStyle : undefined}
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
 * `formatCompactBRL` (mesmo formatter das barras, default da ENTREGA 2).
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Maior: ${String(top.x)} (${formatCompactBRL(top.y ?? 0)})`,
  ];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) =>
      (p.y ?? 0) < (best.y ?? 0) ? p : best,
    );
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor: ${String(bottom.x)} (${formatCompactBRL(bottom.y ?? 0)})`,
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
