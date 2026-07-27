/**
 * COMPONENTE PRÓPRIO — moldura padrão de todo bloco de visualização. O Astryx
 * tem `Card` e `Divider`, mas não tem a ANATOMIA de um widget de painel:
 * cabeçalho com tipo e ações, corpo, insights, "mais detalhes" e o rodapé
 * técnico (SQL + duração) sempre por último. Fixar essa ordem aqui é o que faz
 * vinte widgets lerem igual.
 *
 * Substitui `chart-widget.tsx`, que montava borda, divisórias e tipografia à
 * mão e ainda mantinha uma prop `takeaway` legada em paralelo ao array.
 */
import type { ReactNode } from 'react';
import { ChevronRight, Lightbulb } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { formatDuration } from '@/shared/lib/format';

/** Insight de negócio exibido no rodapé. `enabled: false` não renderiza. */
export interface ChartWidgetTakeaway {
  /** Liga/desliga a linha sem removê-la do estado de quem edita o painel. */
  enabled: boolean;
  /** Texto do insight. */
  text: string;
}

export interface ChartWidgetProps {
  /** Título do widget. */
  title: string;
  /** Nível do `Heading` — mantenha a sequência da página. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Tipo do gráfico, exibido como selo ao lado do título. */
  chartType?: string;
  /** Ações do cabeçalho (menu, atualizar, exportar…). */
  actions?: ReactNode;
  /** Troca o corpo por um `Skeleton` da altura típica de um gráfico. */
  isLoading?: boolean;
  /** Insights de negócio. Linhas vazias ou desligadas são ignoradas. */
  takeaways?: ChartWidgetTakeaway[];
  /** Consulta que originou os dados. */
  query?: string;
  /** Tempo de execução da consulta, em ms. */
  durationMs?: number;
  /** Esconde o rodapé técnico mesmo havendo `query`. */
  showQuery?: boolean;
  /** Rótulo da ação de detalhe. */
  detailsLabel?: string;
  /** Destino da ação de detalhe (vira link). */
  detailsHref?: string;
  /** Ação de detalhe como callback (vira botão). Ignorado se houver `href`. */
  onDetails?: () => void;
  /** O gráfico. */
  children?: ReactNode;
}

/** Altura do esqueleto: acompanha a altura natural dos gráficos desta pasta. */
const BODY_SKELETON_HEIGHT = 224;

/** Moldura de widget de painel, com cabeçalho, corpo, insights e rodapé. */
export function ChartWidget({
  title,
  headingLevel = 3,
  chartType,
  actions,
  isLoading = false,
  takeaways,
  query,
  durationMs,
  showQuery = true,
  detailsLabel = 'Mais detalhes',
  detailsHref,
  onDetails,
  children,
}: ChartWidgetProps) {
  const insights = (takeaways ?? []).filter(
    (item) => item.enabled && item.text.trim().length > 0,
  );
  const hasDetails = Boolean(detailsHref) || typeof onDetails === 'function';
  const hasFooter = showQuery && Boolean(query);

  return (
    <Card padding={0} data-slot="chart-widget">
      <VStack>
        <HStack gap={2} hAlign="between" vAlign="center" padding={3}>
          <HStack gap={2} vAlign="center">
            <Heading level={headingLevel}>{title}</Heading>
            {chartType ? <Badge label={chartType} /> : null}
          </HStack>
          {actions ? (
            <HStack gap={1} vAlign="center">
              {actions}
            </HStack>
          ) : null}
        </HStack>
        <Divider />

        <VStack padding={3} minHeight={0}>
          {isLoading ? <Skeleton height={BODY_SKELETON_HEIGHT} radius={2} /> : children}
        </VStack>

        {insights.length > 0 ? (
          <>
            <Divider />
            <VStack gap={1} padding={3} data-slot="chart-widget-takeaways">
              {insights.map((item, index) => (
                <HStack
                  key={`${index}-${item.text.slice(0, 16)}`}
                  gap={1.5}
                  vAlign="start"
                >
                  <Icon icon={Lightbulb} size="sm" color="warning" />
                  <Text type="supporting">{item.text}</Text>
                </HStack>
              ))}
            </VStack>
          </>
        ) : null}

        {hasDetails ? (
          <>
            <Divider />
            <HStack hAlign="end" padding={3} data-slot="chart-widget-details">
              <Button
                variant="ghost"
                size="sm"
                label={detailsLabel}
                href={detailsHref}
                onClick={detailsHref ? undefined : onDetails}
                endContent={<Icon icon={ChevronRight} size="sm" />}
              />
            </HStack>
          </>
        ) : null}

        {hasFooter ? (
          <>
            <Divider />
            <HStack gap={2} vAlign="center" padding={3} data-slot="chart-widget-footer">
              <Text type="code" color="secondary" maxLines={1}>
                {query}
              </Text>
              {durationMs != null ? (
                <Text type="supporting" color="secondary" hasTabularNumbers>
                  {formatDuration(durationMs)}
                </Text>
              ) : null}
            </HStack>
          </>
        ) : null}
      </VStack>
    </Card>
  );
}
