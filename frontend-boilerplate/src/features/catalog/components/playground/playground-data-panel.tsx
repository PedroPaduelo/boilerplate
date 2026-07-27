/**
 * Aba "Dados" — de onde vem o que o preview desenha.
 *
 * Catálogo: variantes de fixture (`Selector`) + JSON editável, com o erro de
 * shape inline (`FieldStatus`).
 * `/charts/:id` (live): o JSON é o resultado REAL da query, então vira
 * `CodeBlock` read-only; a falha da execução aparece como `Banner` acionável.
 */
import { Banner } from '@astryxdesign/core/Banner';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Badge } from '@astryxdesign/core/Badge';
import { Heading, Text } from '@astryxdesign/core/Text';
import { SHAPE_LABEL, type CatalogEntry } from '../../lib/catalog-entries';
import type { FixtureVariant } from '../../lib/block-fixtures';
import type { UsePlaygroundDataReturn } from './use-playground-data';

export interface PlaygroundDataPanelProps {
  entry: CatalogEntry;
  variants: FixtureVariant[];
  data: UsePlaygroundDataReturn;
  /** Modo live: dados reais da query do gráfico. */
  isLive: boolean;
  isFetching: boolean;
  onRunQuery: () => void;
}

export function PlaygroundDataPanel({
  entry,
  variants,
  data,
  isLive,
  isFetching,
  onRunQuery,
}: PlaygroundDataPanelProps) {
  if (!entry.shape) {
    return (
      <VStack gap={3}>
        <Heading level={4}>Dados</Heading>
        <Text type="supporting">
          Bloco narrativo — não consome dados. O conteúdo vem das propriedades.
        </Text>
      </VStack>
    );
  }

  const activeVariant = variants.find((v) => v.id === data.variantId);

  return (
    <VStack gap={3}>
      <HStack gap={2} justify="between" vAlign="center">
        <Heading level={4}>Dados</Heading>
        <Badge variant="neutral" label={SHAPE_LABEL[entry.shape]} />
      </HStack>

      {data.liveError ? (
        <Banner
          status="error"
          title="A query falhou"
          description={data.liveError}
          endContent={
            <Button
              label="Tentar de novo"
              size="sm"
              isLoading={isFetching}
              onClick={onRunQuery}
            />
          }
        />
      ) : null}

      {isLive ? (
        <>
          <Text type="supporting">
            {isFetching
              ? 'Executando a query do gráfico…'
              : typeof data.liveRowCount === 'number'
                ? `Resultado real da query — ${data.liveRowCount} linha(s).`
                : 'Resultado real da query.'}
          </Text>
          <CodeBlock
            code={data.dataText}
            language="json"
            title="Resposta da query"
            width="100%"
            maxHeight={320}
            size="sm"
          />
        </>
      ) : (
        <>
          {variants.length > 0 ? (
            <Selector
              label="Conjunto de dados"
              size="sm"
              value={data.variantId ?? ''}
              placeholder="Personalizado (JSON editado)"
              description={activeVariant?.description}
              options={variants.map((v) => ({ value: v.id, label: v.label }))}
              onChange={(id) => {
                const next = variants.find((v) => v.id === id);
                if (next) data.applyVariant(next);
              }}
            />
          ) : null}

          <TextArea
            label="JSON dos dados"
            size="sm"
            rows={12}
            hasSpellCheck={false}
            value={data.dataText}
            status={data.dataError ? { type: 'error' } : undefined}
            onChange={data.setDataText}
          />

          {data.dataError ? (
            <FieldStatus
              type="error"
              variant="detached"
              message={`Inválido para o shape "${entry.shape}": ${data.dataError}`}
            />
          ) : (
            <Text type="supporting">
              JSON válido — o preview ao lado usa exatamente este dado.
            </Text>
          )}
        </>
      )}
    </VStack>
  );
}
