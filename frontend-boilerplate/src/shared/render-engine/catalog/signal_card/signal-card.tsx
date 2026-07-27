/**
 * COMPONENTE PRÓPRIO DO BLOCO — por que existe: nem o Astryx nem `@/shared/ui`
 * têm esta COMPOSIÇÃO. O `KpiCard` responde "quanto é"; o sinal responde "para
 * onde está indo": o rótulo e a variação recente dividem a primeira linha, o
 * número vem em seguida e a tendência é desenhada logo abaixo, dentro do mesmo
 * cartão. Sem essa forma, uma fileira de sinais viraria uma fileira de KPIs com
 * um gráfico solto embaixo.
 *
 * Tudo o que dava para reaproveitar veio pronto: `Card`/`Text` do design
 * system, `DeltaBadge` (que decide a cor pela leitura de negócio, não pelo
 * sinal do número) e `SparkChart` (cor de token, estados e rótulo acessível).
 * Por ora só o bloco `signal_card` usa; se um segundo bloco precisar, a regra
 * da trilha manda promovê-lo para `@/shared/ui`.
 */
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DeltaBadge, SparkChart } from '@/shared/ui';
import type { ChartSeriesColor } from '@/shared/ui';

export interface SignalCardProps {
  /** Rótulo curto do sinal (ex.: "Latência p95"). */
  label: string;
  /** Valor em destaque, JÁ formatado. */
  value: string;
  /** Série da tendência, na ordem temporal. */
  data: number[];
  /** Variação como FRAÇÃO (0.042 = +4,2%). Sem ela, não há selo. */
  trend?: number;
  /** Se subir é bom. Quando `false`, uma alta é sinalizada como piora. */
  higherIsBetter?: boolean;
  /** Mostra a tendência desenhada. */
  showSparkline?: boolean;
  /** Cor da série; sem ela, a primeira cor da paleta do DS. */
  color?: ChartSeriesColor;
  /** Troca a tendência por esqueleto enquanto os dados não chegam. */
  isLoading?: boolean;
}

/** Altura da tendência em px — geometria do desenho, não espaçamento. */
const SPARK_HEIGHT = 44;

/** Cartão de sinal: rótulo, variação recente, valor e tendência. */
export function SignalCard({
  label,
  value,
  data,
  trend,
  higherIsBetter = true,
  showSparkline = true,
  color,
  isLoading = false,
}: SignalCardProps) {
  return (
    <Card padding={3} data-slot="signal-card">
      <VStack gap={2}>
        <HStack gap={2} hAlign="between" vAlign="center">
          <Text type="supporting" maxLines={1}>
            {label}
          </Text>
          {trend !== undefined ? (
            <DeltaBadge value={trend * 100} higherIsBetter={higherIsBetter} />
          ) : null}
        </HStack>

        <Text type="large" weight="semibold" hasTabularNumbers>
          {value}
        </Text>

        {showSparkline ? (
          <SparkChart
            data={data}
            type="area"
            color={color}
            height={SPARK_HEIGHT}
            label={`${label}: tendência`}
            isLoading={isLoading}
          />
        ) : null}
      </VStack>
    </Card>
  );
}
