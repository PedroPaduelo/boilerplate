/**
 * COMPONENTE PRÓPRIO DO BLOCO — por que existe: é a métrica de VITRINE, a que
 * abre um painel. O `KpiCard` da base é o indicador de trabalho (rótulo à
 * esquerda, número alinhado, variação embaixo); aqui a composição é centrada,
 * o número domina e um halo de luz atrás dele dá o destaque — a razão de o
 * bloco existir ao lado do KPI.
 *
 * O halo é a única parte desenhada à mão, e mesmo ela sai de token: a cor vem
 * de `useChartPalette` (`--color-data-*`); opacidade e desfoque são só o
 * tratamento da luz. Zero hex.
 *
 * ESTILO (regra 2.3): o enquadramento é do DS (`Card`, `HStack hAlign`,
 * `VStack`) e a geometria do halo é utility ancorada em token. No `style` fica
 * só a cor da luz, que vem da paleta de dados em runtime.
 *
 * Só o bloco `metric_glow` usa; se um segundo bloco precisar, a regra da trilha
 * manda promovê-lo para `@/shared/ui`.
 */
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DeltaBadge, useChartPalette } from '@/shared/ui';
import type { ChartSeriesColor } from '@/shared/ui';

export interface MetricGlowCardProps {
  /** Nome da métrica. */
  title: string;
  /** Valor em destaque, JÁ formatado. */
  value: string;
  /** Variação em pontos percentuais. Sem ela, não há selo. */
  delta?: number;
  /** Se subir é bom. Quando `false`, uma alta é sinalizada como piora. */
  higherIsBetter?: boolean;
  /** Cor do halo; sem ela, a primeira cor da paleta do DS. */
  color?: ChartSeriesColor;
  /** Troca o valor por esqueleto enquanto os dados não chegam. */
  isLoading?: boolean;
}

/**
 * O halo, em utilities ancoradas na escala do DS: diâmetro de 4 passos de
 * `--spacing-8` (128px) e desfoque de 1 passo de `--spacing-10` (40px) — a
 * mesma luz de antes, agora presa aos tokens. A opacidade é o único número
 * solto e é intencional: 0.22 é presente o bastante para destacar e longe de
 * competir com o número (0.2 apaga, 0.25 já suja o texto).
 */
const HALO_CLASS = [
  'pointer-events-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2',
  'h-[calc(var(--spacing-8)_*_4)] w-[calc(var(--spacing-8)_*_4)]',
  'rounded-[var(--radius-full)] opacity-[0.22] blur-[var(--spacing-10)]',
].join(' ');

/** Métrica de destaque: rótulo, número grande com halo e variação. */
export function MetricGlowCard({
  title,
  value,
  delta,
  higherIsBetter = true,
  color,
  isLoading = false,
}: MetricGlowCardProps) {
  const palette = useChartPalette();

  return (
    <Card padding={4} data-slot="metric-glow-card">
      {/* Contexto de posicionamento do halo — puramente geométrico. */}
      <HStack hAlign="center" className="relative">
        <span
          aria-hidden="true"
          data-slot="metric-glow-halo"
          className={HALO_CLASS}
          // runtime: a cor da luz vem da paleta de dados (série/prop do bloco)
          style={{ backgroundColor: palette.varAt(0, color) }}
        />
        <VStack gap={1} hAlign="center" width="100%">
          <Text type="label" color="secondary" justify="center">
            {title}
          </Text>
          {isLoading ? (
            <Skeleton width="60%" height={32} radius={1} />
          ) : (
            <Text type="display-2" hasTabularNumbers justify="center">
              {value}
            </Text>
          )}
          {!isLoading && delta !== undefined ? (
            <DeltaBadge value={delta} higherIsBetter={higherIsBetter} />
          ) : null}
        </VStack>
      </HStack>
    </Card>
  );
}
