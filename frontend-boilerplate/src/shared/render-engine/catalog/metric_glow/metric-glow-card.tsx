/**
 * COMPONENTE PRÓPRIO DO BLOCO — a métrica de VITRINE, a que abre um painel.
 *
 * Depois da repaginação, a COMPOSIÇÃO é a mesma dos outros cards de resumo
 * (`04-widgets-prontos.md` §2): a referência descreve um único card, e §2.4
 * lista as variações dele mudando só o que é desenhado ao lado do número —
 * nunca a caixa. Duas geometrias de card de resumo na mesma tela era o que
 * fazia o `metric_glow` parecer de outro produto ao lado de um KPI.
 *
 * O que continua exclusivo dele é o HALO: uma luz da cor da série atrás do
 * conteúdo. Ela entra pelo slot `decoration` do card, que é justamente onde a
 * referência coloca a forma decorativa (§2.1: 240×240, `z-index: -1`, atrás do
 * conteúdo). Ou seja: o bloco não desenha mais uma caixa própria — ele decora
 * a caixa comum.
 *
 * COR: a luz sai de `useChartPalette` (`var(--ds-color-*)` da série); só a
 * opacidade e o desfoque são tratamento. Zero hex.
 *
 * Só o bloco `metric_glow` usa; se um segundo bloco precisar, a regra da
 * trilha manda promovê-lo para `@/shared/ui`.
 */
import { KpiCard } from '@/shared/ui';
import type { ChartScope, ChartSeriesColor } from '@/shared/ui';
import { useChartPalette } from '@/shared/ui';
import type { CardProps } from '@astryxdesign/core/Card';

export interface MetricGlowCardProps {
  /** Nome da métrica. Aceita Markdown e `{{variavel}}`. */
  title: string;
  /** Valor bruto — é ele que rola dígito a dígito quando o dado muda. */
  value?: number;
  /** Valor em destaque, JÁ formatado. Aceita Markdown e `{{variavel}}`. */
  displayValue?: string;
  /** Variação em pontos percentuais. Sem ela, não há bloco de tendência. */
  delta?: number;
  /** Se subir é bom. Quando `false`, uma alta é sinalizada como piora. */
  higherIsBetter?: boolean;
  /** Cor do halo; sem ela, a primeira cor da paleta do DS. */
  color?: ChartSeriesColor;
  /** Família de cor do card (variante do `Card` do DS). */
  variant?: CardProps['variant'];
  /** Estado do card. */
  state?: 'success' | 'loading' | 'empty' | 'error';
  /** Detalhe do erro, exibido quando `state="error"`. */
  error?: string;
  /** Mensagem do estado vazio. Aceita Markdown e `{{variavel}}`. */
  emptyMessage?: string;
  /** Escopo de interpolação das `{{variaveis}}` (de `buildChartScope`). */
  scope?: ChartScope;
}

/**
 * O halo, em utilities ancoradas na escala do DS: diâmetro de 4 passos de
 * `--spacing-8` (128px) e desfoque de 1 passo de `--spacing-10` (40px). O
 * contêiner do slot `decoration` já é `position: absolute; inset: 0`, então
 * `top/start 1/2` centra a luz no card. A opacidade é o único número solto e é
 * intencional: 0.22 destaca sem competir com o número (0.2 apaga, 0.25 suja).
 */
const HALO_CLASS = [
  'pointer-events-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2',
  'h-[calc(var(--spacing-8)_*_4)] w-[calc(var(--spacing-8)_*_4)]',
  'rounded-[var(--radius-full)] opacity-[0.22] blur-[var(--spacing-10)]',
].join(' ');

/** Métrica de destaque: o card de resumo da referência, com halo de luz. */
export function MetricGlowCard({
  title,
  value,
  displayValue,
  delta,
  higherIsBetter = true,
  color,
  variant,
  state,
  error,
  emptyMessage,
  scope,
}: MetricGlowCardProps) {
  const palette = useChartPalette();

  return (
    <KpiCard
      slot="metric-glow-card"
      label={title}
      value={value}
      displayValue={displayValue}
      delta={delta}
      higherIsBetter={higherIsBetter}
      variant={variant}
      state={state}
      error={error}
      emptyMessage={emptyMessage}
      scope={scope}
      // A métrica de vitrine não compara períodos por padrão — o texto de
      // apoio do KPI ("vs. período anterior") não se aplica aqui.
      hint=""
      decoration={
        <span
          data-slot="metric-glow-halo"
          className={HALO_CLASS}
          // runtime: a cor da luz vem da paleta de dados (série/prop do bloco)
          style={{ backgroundColor: palette.varAt(0, color) }}
        />
      }
    />
  );
}
