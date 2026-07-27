/**
 * COMPONENTE PRÓPRIO — o Astryx tem `Card`, mas não tem a COMPOSIÇÃO de um KPI
 * (rótulo → número grande → variação → comparação). Fixar essa ordem num só
 * lugar é o que faz um painel com dez KPIs parecer um painel, e não dez cards
 * diferentes.
 *
 * Substitui `kpi-card.tsx`, que desenhava borda/sombra à mão, tinha um "rail"
 * de destaque com cor por classe (`bg-chart-1`) ou `style` cru, e escrevia
 * `text-white` no chip do ícone. Aqui a caixa é o `Card` do DS, a cor de
 * destaque é uma `variant` dele e o ícone vem pronto de quem usa.
 */
import type { ReactNode } from 'react';
import type { CardProps } from '@astryxdesign/core/Card';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { AnimatedNumber } from './animated-number';
import { DeltaBadge } from './delta-badge';

export interface KpiCardProps {
  /** Nome da métrica (ex.: "Receita recorrente"). */
  label: string;
  /** Valor numérico — anima dígito a dígito quando muda. */
  value: number;
  /**
   * Valor JÁ formatado (ex.: "R$ 2,61 bi"). Vence `value`/`prefix`/`suffix`:
   * valores monetários longos ficam ilegíveis rolando casa a casa.
   */
  displayValue?: string;
  /** Prefixo colado no número (ex.: "R$"). */
  prefix?: string;
  /** Sufixo colado no número (ex.: "%"). */
  suffix?: string;
  /** Variação percentual vs. período anterior. */
  delta?: number;
  /** Texto ao lado da variação. */
  hint?: string;
  /** Força a direção da variação. */
  trend?: 'up' | 'down';
  /** Se subir é bom (inverte a cor da variação quando `false`). */
  higherIsBetter?: boolean;
  /** Ícone à direita do rótulo — passe o `Icon` do DS já montado. */
  icon?: ReactNode;
  /** Cor de categorização do card (variantes do `Card` do DS). */
  variant?: CardProps['variant'];
  /** Troca o conteúdo por `Skeleton` enquanto os dados não chegam. */
  isLoading?: boolean;
}

/** Card de indicador: rótulo, número em destaque e variação. */
export function KpiCard({
  label,
  value,
  displayValue,
  prefix,
  suffix,
  delta,
  hint = 'vs. período anterior',
  trend,
  higherIsBetter = true,
  icon,
  variant,
  isLoading = false,
}: KpiCardProps) {
  return (
    <Card padding={4} variant={variant} data-slot="kpi-card">
      <VStack gap={3}>
        <HStack gap={2} hAlign="between" vAlign="center">
          <Text type="supporting" color="secondary">
            {label}
          </Text>
          {icon}
        </HStack>

        {isLoading ? (
          <Skeleton height={36} radius={1} />
        ) : (
          <HStack gap={1} vAlign="end">
            <Text type="display-3" hasTabularNumbers>
              {displayValue !== undefined ? (
                displayValue
              ) : (
                <>
                  {prefix}
                  <AnimatedNumber value={value} />
                </>
              )}
            </Text>
            {displayValue === undefined && suffix ? (
              <Text type="large" color="secondary">
                {suffix}
              </Text>
            ) : null}
          </HStack>
        )}

        {!isLoading && delta !== undefined ? (
          <HStack gap={2} vAlign="center" wrap="wrap">
            <DeltaBadge value={delta} trend={trend} higherIsBetter={higherIsBetter} />
            {hint ? (
              <Text type="supporting" color="secondary">
                {hint}
              </Text>
            ) : null}
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
}
