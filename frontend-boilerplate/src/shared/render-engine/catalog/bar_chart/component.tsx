/**
 * Bloco `bar_chart` (shape 'series') — usa o Vitrine `BarChart`.
 * Mapeia cada ponto {x,y} da série para {label,value} do gráfico e expõe um
 * `deriveTakeaway` (insights de rodapé exibidos pelo ChartWidget).
 *
 * Prop de COR: `accent` é enum fechado (`chart-1..5 | 'primary'`), validado
 * pelo schema. Mas o input livre do playground permite string custom —
 * `resolveAccent()` em `lib/accent.ts` traduz 1:1 para a classe Tailwind
 * (`bg-chart-N` / `bg-primary`) OU aplica via `style.background` quando é
 * cor CSS crua (`#40E0D0`, `rgb(0,255,0)`, `oklch(...)`, `linear-gradient(...)`).
 * Default: `'chart-1'`.
 *
 * Prop `palette` (ENTREGA 3 — Turno 2 do playground): aceita 3 valores
 *  - `'single'` (default): toda a série usa `accent` (1 cor).
 *  - `'multi'`: cada ponto vira uma cor do PALETTE (chart-1..5 cíclico).
 *    ⚠️ LIMITAÇÃO CONHECIDA (2026-06-23): o `BarChart` da Vitrine
 *    (`@/components/ui/bar-chart.tsx`) é single-série por design — recebe
 *    um `accent` único e aplica a TODAS as barras. A prop `palette: 'multi'`
 *    é aceita pelo schema, mas o RENDER atual ainda usa `accent` (não
 *    cicla). Quando virar necessário multi-série real, o caminho é:
 *      1) ou estender o `BarChart` para aceitar uma classe por ponto
 *         (passando `accentClass(i)` em vez de `accent`), o que implica
 *         revisar o cálculo de max/largura relativa entre séries;
 *      2) ou empilhar via `stacked: true` com mapeamento de série (já
 *         aceito no schema, ainda não implementado);
 *      3) ou trocar pelo `AreaChart` (multi-série por natureza) caso o
 *         uso de empilhamento não seja desejado.
 *    Por ora, quando `palette === 'multi'`, emitimos um `console.warn` em
 *    dev pra deixar o "fio solto" visível e não travar a renderização.
 *  - `'none'`: o bloco segue igual a `'single'` (placeholder p/ futuras
 *    variações — manter o slot).
 *
 * Prop `valueFormatter` (opcional, novo): permite trocar o formatador do
 * valor exibido na barra / tooltip / valor horizontal. Default interno é
 * `formatCompactBRL` (consistente com o padrão atual). O objetivo é
 * normalizar — se você quiser moeda crua, número inteiro etc., basta
 * passar um formatter via prop (sem mexer no componente).
 */
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { BarChart } from '@/components/ui/bar-chart';
import { HBarChart } from '@/components/ui/h-bar-chart';
import { formatCompactBRL } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
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

  // `valueFormatter` flexível: usa a prop se passada, senão o default BRL
  // (mantém o comportamento atual do bloco).
  const valueFormatter = props.valueFormatter ?? defaultFormatter;

  // `palette === 'multi'` é aceito pelo schema, mas o BarChart da Vitrine é
  // single-série (1 accent pra todas as barras) — vide JSDoc do bloco.
  // Avisamos em dev pra deixar a limitação visível. Emitido UMA vez por
  // instância (useRef evita flood no re-render).
  const warnedMultiRef = useRef(false);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      props.palette === 'multi' &&
      !warnedMultiRef.current
    ) {
      console.warn(
        '[bar_chart] `palette: "multi"` ainda não cicla cores — o BarChart da Vitrine ' +
          'aceita um único `accent`. Render atual usa `accent` único. ' +
          'Veja JSDoc do componente para opções de implementação futura.',
      );
      warnedMultiRef.current = true;
    }
  }, [props.palette]);

  // Reseta o flag se a prop voltar a "single"/"none" — permite novo aviso
  // se o user reativar (caso comum: testar e desfazer).
  useEffect(() => {
    if (props.palette !== 'multi') warnedMultiRef.current = false;
  }, [props.palette]);

  const series = points.map((d) => ({
    label: String(d.x),
    value: d.y ?? 0,
  }));
  // `resolveAccent()` decide se a cor é enum (classe Tailwind) ou cor CSS
  // (style.background). Cobre o playground (que aceita `#40E0D0`,
  // `linear-gradient(...)`, etc.) sem quebrar a paleta do DS.
  const resolvedAccent = resolveAccent(props.accent);
  const chartAccent =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : '';
  const chartStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;
  // `orientation: "horizontal"` re-aproveita o `HBarChart` (mesma "família" do
  // DS, mesmo accent e mesmo formatter). Vertical é o default.
  if (props.orientation === 'horizontal') {
    return (
      <HBarChart
        series={series}
        accent={chartAccent}
        style={chartStyle}
        valueFormatter={valueFormatter}
      />
    );
  }
  return (
    <BarChart
      series={series}
      accent={chartAccent}
      style={chartStyle}
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