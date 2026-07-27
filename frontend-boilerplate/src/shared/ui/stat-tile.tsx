/**
 * COMPONENTE PRÓPRIO — irmão denso do `KpiCard`. Existe porque um painel tem
 * DUAS hierarquias de número: o indicador principal (card grande) e o dado de
 * apoio, que aparece em fileiras de quatro ou seis. Mesma ordem de leitura,
 * tipografia um degrau abaixo — a diferença de tamanho é que comunica a
 * importância.
 *
 * Substitui `stat-tile.tsx`, que repetia borda/sombra à mão, o chip de ícone com
 * `bg-muted` e a barra de destaque colorida por classe Tailwind.
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

export interface StatTileProps {
  /** Nome da estatística (ex.: "Eventos hoje"). */
  label: string;
  /** Valor numérico — anima dígito a dígito quando muda. */
  value: number;
  /** Valor JÁ formatado. Vence `value`/`prefix`/`suffix`. */
  displayValue?: string;
  /** Prefixo colado no número. */
  prefix?: string;
  /** Sufixo colado no número. */
  suffix?: string;
  /** Variação percentual vs. período anterior. */
  delta?: number;
  /** Texto ao lado da variação. */
  hint?: string;
  /** Força a direção da variação. */
  trend?: 'up' | 'down';
  /** Se subir é bom (inverte a cor da variação quando `false`). */
  higherIsBetter?: boolean;
  /** Ícone antes do rótulo — passe o `Icon` do DS já montado. */
  icon?: ReactNode;
  /** Cor de categorização do ladrilho (variantes do `Card` do DS). */
  variant?: CardProps['variant'];
  /** Troca o conteúdo por `Skeleton` enquanto os dados não chegam. */
  isLoading?: boolean;
}

/** Ladrilho compacto de estatística, para fileiras de dados de apoio. */
export function StatTile({
  label,
  value,
  displayValue,
  prefix,
  suffix,
  delta,
  hint,
  trend,
  higherIsBetter = true,
  icon,
  variant,
  isLoading = false,
}: StatTileProps) {
  return (
    <Card padding={3} variant={variant} data-slot="stat-tile">
      <VStack gap={2}>
        <HStack gap={1.5} vAlign="center">
          {icon}
          <Text type="supporting" color="secondary" maxLines={1}>
            {label}
          </Text>
        </HStack>

        {isLoading ? (
          <Skeleton height={24} radius={1} />
        ) : (
          <HStack gap={0.5} vAlign="end">
            <Text type="large" weight="semibold" hasTabularNumbers>
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
              <Text type="supporting" color="secondary">
                {suffix}
              </Text>
            ) : null}
          </HStack>
        )}

        {!isLoading && (delta !== undefined || hint) ? (
          <HStack gap={1.5} vAlign="center" wrap="wrap">
            {delta !== undefined ? (
              <DeltaBadge value={delta} trend={trend} higherIsBetter={higherIsBetter} />
            ) : null}
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
