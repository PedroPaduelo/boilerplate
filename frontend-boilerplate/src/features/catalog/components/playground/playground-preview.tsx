/**
 * Painel de PREVIEW: o bloco renderizado pelo mesmo motor do dashboard real
 * (`BlockRenderer`), com a moldura `ChartWidget` aplicada.
 *
 * Quando o JSON dos dados está quebrado o preview é PAUSADO (em vez de sumir
 * ou renderizar lixo): o `EmptyState` explica o motivo e o que fazer.
 */
import { FileWarning } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { BlockRenderer } from '@/shared/render-engine';
import type { BlockRendererProps } from '@/shared/render-engine';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../../lib/catalog-entries';

export interface PlaygroundPreviewProps {
  entry: CatalogEntry;
  block: BlockRendererProps['block'];
  result: BlockRendererProps['result'];
}

export function PlaygroundPreview({ entry, block, result }: PlaygroundPreviewProps) {
  const { manifest } = entry.definition;
  const isPaused = Boolean(entry.shape) && result === undefined;

  return (
    <VStack gap={3} padding={4}>
      <VStack gap={1}>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Heading level={3}>Pré-visualização</Heading>
          <Badge variant="neutral" label={KIND_LABEL[entry.kind]} />
          {entry.shape ? <Badge variant="blue" label={SHAPE_LABEL[entry.shape]} /> : null}
        </HStack>
        <Text type="supporting" maxLines={2}>
          {manifest.description}
        </Text>
      </VStack>

      {isPaused ? (
        <EmptyState
          icon={<Icon icon={FileWarning} size="lg" />}
          title="Preview pausado"
          description="O JSON dos dados está inválido. Corrija na aba “Dados” para voltar a renderizar."
          headingLevel={4}
        />
      ) : (
        <Card padding={4}>
          <BlockRenderer block={block} result={result} framed />
        </Card>
      )}
    </VStack>
  );
}
