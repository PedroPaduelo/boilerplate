/**
 * COMPONENTE PRÓPRIO — o Astryx não tem ranking. Resolve "top N por valor":
 * lista ordenada em que a barra dá a proporção e o texto dá o número exato.
 *
 * Substitui `bar-list-tremor.tsx` (398 linhas), que escrevia o rótulo DENTRO da
 * barra colorida e, por causa disso, carregava um calculador de luminância WCAG,
 * um parser de hex/rgb e um `text-shadow` de contorno só para o texto não sumir.
 * Aqui o rótulo fica FORA da barra: o problema de contraste deixa de existir e
 * a cor volta a ser só dado.
 *
 * Não é `role="img"`: é uma `<ol>` com rótulo e valor em texto — já legível por
 * leitor de tela sem equivalente extra.
 */
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartBarTrack } from './chart-bar-track';
import { CHART_EMPTY_MESSAGE } from './chart-frame';
import { formatChartValue } from './chart-data';
import type { ChartStateProps, ValueFormatter } from './types';
import type { ChartSeriesColor } from './use-chart-palette';
import { useChartPalette } from './use-chart-palette';

/** Uma linha do ranking. */
export interface BarListItem {
  /** Chave estável. Sem isto, usa o rótulo. */
  key?: string;
  /** Nome da categoria. */
  label: string;
  /** Valor que define o comprimento da barra. */
  value: number;
  /** Quando presente, o rótulo vira link. */
  href?: string;
  /** Cor fixa da barra. Sem isto, segue `hasColorByItem`. */
  color?: ChartSeriesColor;
}

export interface BarListProps extends Omit<ChartStateProps, 'label' | 'summary'> {
  /** Itens do ranking. */
  data: BarListItem[];
  /** Ordem de exibição. */
  sortOrder?: 'ascending' | 'descending' | 'none';
  /** Uma cor por item em vez de uma cor só para toda a lista. */
  hasColorByItem?: boolean;
  /** Formata o valor exibido à direita. */
  valueFormatter?: ValueFormatter;
  /** Nº de linhas de esqueleto no estado de carregamento. */
  loadingRows?: number;
}

/** Ordena uma cópia dos itens conforme `sortOrder`. */
function sortItems(data: BarListItem[], order: BarListProps['sortOrder']): BarListItem[] {
  if (order === 'none') return data;
  return [...data].sort((a, b) =>
    order === 'ascending' ? a.value - b.value : b.value - a.value,
  );
}

/** Ranking horizontal "top N", com barra proporcional e valor à direita. */
export function BarList({
  data,
  sortOrder = 'descending',
  hasColorByItem = false,
  valueFormatter = formatChartValue,
  loadingRows = 5,
  isLoading,
  emptyMessage = CHART_EMPTY_MESSAGE,
}: BarListProps) {
  const palette = useChartPalette();

  if (isLoading) {
    return (
      <VStack gap={3} width="100%" data-slot="bar-list-loading">
        {Array.from({ length: loadingRows }, (_, index) => (
          <Skeleton key={index} height={28} radius={1} index={index} />
        ))}
      </VStack>
    );
  }

  if (data.length === 0) {
    return <EmptyState isCompact title={emptyMessage} />;
  }

  const items = sortItems(data, sortOrder);
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <VStack as="ol" gap={3} width="100%" data-slot="bar-list">
      {items.map((item, index) => (
        <VStack as="li" key={item.key ?? item.label} gap={1}>
          <HStack gap={3} hAlign="between" vAlign="center">
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <Text type="supporting" maxLines={1}>
                {item.label}
              </Text>
            )}
            <Text type="supporting" weight="medium" hasTabularNumbers>
              {valueFormatter(item.value)}
            </Text>
          </HStack>
          <ChartBarTrack
            ratio={max === 0 ? 0 : item.value / max}
            color={palette.varAt(hasColorByItem ? index : 0, item.color)}
          />
        </VStack>
      ))}
    </VStack>
  );
}
