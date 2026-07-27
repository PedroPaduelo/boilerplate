/**
 * COMPONENTE PRÓPRIO — na verdade uma REGRA de leitura em cima do `Badge` do
 * Astryx. "Subiu 3%" é bom para receita e ruim para churn: quem decide a cor é
 * `higherIsBetter`, não o sinal do número. KPI e ladrilho compartilhavam esse
 * `if` duplicado (e com `bg-chart-2/10` cravado); agora ele mora aqui.
 */
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';

export interface DeltaBadgeProps {
  /** Variação percentual em relação ao período anterior. */
  value: number;
  /** Se subir é bom. Quando `false`, uma alta é sinalizada como piora. */
  higherIsBetter?: boolean;
  /** Força a direção. Sem isto, deriva do sinal de `value`. */
  trend?: 'up' | 'down';
  /** Formata o rótulo. Sem isto, usa `+3,2%` / `-1,4%` em pt-BR. */
  format?: (value: number) => string;
}

/** Formata a variação com sinal explícito e uma casa decimal, em pt-BR. */
function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })}%`;
}

/** Selo de variação, colorido pela LEITURA de negócio (não pelo sinal). */
export function DeltaBadge({
  value,
  higherIsBetter = true,
  trend,
  format = formatDelta,
}: DeltaBadgeProps) {
  const isUp = trend ? trend === 'up' : value >= 0;
  const isGood = isUp === higherIsBetter;

  return (
    <Badge
      variant={isGood ? 'success' : 'error'}
      label={format(value)}
      icon={<Icon icon={isUp ? ArrowUpRight : ArrowDownRight} size="xsm" />}
      data-slot="delta-badge"
    />
  );
}
