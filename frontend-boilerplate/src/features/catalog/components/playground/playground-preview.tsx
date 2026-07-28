/**
 * Painel de PREVIEW: o bloco renderizado pelo mesmo motor do dashboard real
 * (`BlockRenderer`), com a moldura `ChartWidget` aplicada.
 *
 * Quando o JSON dos dados está quebrado o preview é PAUSADO (em vez de sumir
 * ou renderizar lixo): o `EmptyState` explica o motivo e o que fazer.
 *
 * ESTADOS: o seletor do painel escolhe entre sucesso / carregando / vazio /
 * erro / sem permissão. Quase todos chegam pelo caminho REAL — um
 * `BlockDataResult` que o motor traduz em estado. Dois casos o motor não sabe
 * expressar (`sem permissão`, que não existe no contrato de dados, e qualquer
 * estado num bloco sem `dataContract`); aí o preview desenha a MOLDURA direto,
 * avisando que é simulação.
 */
import { FileWarning } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { BlockRenderer, chartBodyHeight } from '@/shared/render-engine';
import type { BlockRendererProps } from '@/shared/render-engine';
// A moldura do motor: o barril exporta só os TIPOS dela, mas é ela que o
// dashboard desenha — reimplementá-la aqui daria um preview que mente.
import { BlockFrame } from '@/shared/render-engine/block-frame';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../../lib/catalog-entries';
import {
  PLAYGROUND_STATE_LABEL,
  PREVIEW_ERROR_MESSAGE,
  PREVIEW_FORBIDDEN_MESSAGE,
  isStateFromResult,
  type PreviewBlock,
} from './playground-helpers';
import type { PlaygroundState } from './types';

export interface PlaygroundPreviewProps {
  entry: CatalogEntry;
  block: PreviewBlock;
  result: BlockRendererProps['result'];
  /** Estado escolhido no painel. */
  state: PlaygroundState;
  /** Dado do editor — escopo das `{{variaveis}}` na moldura simulada. */
  data: unknown;
}

export function PlaygroundPreview({
  entry,
  block,
  result,
  state,
  data,
}: PlaygroundPreviewProps) {
  const { manifest } = entry.definition;
  const isPaused = entry.hasData && result === undefined;
  const isSimulated = !isStateFromResult(entry, state);

  return (
    <VStack gap={3} padding={4}>
      <VStack gap={1}>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Heading level={3}>Pré-visualização</Heading>
          <Badge variant="neutral" label={KIND_LABEL[entry.kind]} />
          {entry.shape ? <Badge variant="blue" label={SHAPE_LABEL[entry.shape]} /> : null}
          {state === 'success' ? null : (
            <Badge variant="warning" label={`Estado: ${PLAYGROUND_STATE_LABEL[state]}`} />
          )}
        </HStack>
        <Text type="supporting" maxLines={2}>
          {manifest.description}
        </Text>
        {isSimulated ? (
          <Text type="supporting">
            Estado desenhado pela moldura padrão — o motor de dados não produz “
            {PLAYGROUND_STATE_LABEL[state].toLowerCase()}” para este bloco.
          </Text>
        ) : null}
      </VStack>

      {isPaused && !isSimulated ? (
        <EmptyState
          icon={<Icon icon={FileWarning} size="lg" />}
          title="Preview pausado"
          description="O JSON dos dados está inválido. Corrija na aba “Dados” para voltar a renderizar."
          headingLevel={4}
        />
      ) : (
        <Card padding={4}>
          {isSimulated ? (
            <SimulatedFrame
              block={block}
              state={state}
              data={data}
              name={manifest.name}
            />
          ) : (
            <BlockRenderer block={block} result={result} framed />
          )}
        </Card>
      )}
    </VStack>
  );
}

/** Mensagem do corpo — só os dois estados de bloqueio a exibem. */
function simulatedMessage(state: PlaygroundState): string | undefined {
  if (state === 'forbidden') return PREVIEW_FORBIDDEN_MESSAGE;
  if (state === 'error') return PREVIEW_ERROR_MESSAGE;
  return undefined;
}

/**
 * A moldura do motor, alimentada direto pelo estado escolhido — o caminho para
 * "sem permissão" e para os blocos que não declaram contrato de dados.
 */
function SimulatedFrame({
  block,
  state,
  data,
  name,
}: {
  block: PreviewBlock;
  state: PlaygroundState;
  data: unknown;
  name: string;
}) {
  return (
    <BlockFrame
      title={block.title ?? name}
      subtitle={block.subtitle}
      description={block.description}
      emptyMessage={block.emptyMessage}
      chartType={name}
      data={data}
      state={state}
      error={simulatedMessage(state)}
      query={block.dataBinding?.query}
      showQuery={block.showSql !== false}
      takeaways={block.takeaways}
      bodyMinHeight={chartBodyHeight(block.type)}
    />
  );
}
