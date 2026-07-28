/**
 * Aba "Dados" — de onde vem o que o preview desenha.
 *
 * Vale para TODO bloco, inclusive os narrativos/layout: mesmo sem contrato de
 * dados, qualquer campo de texto pode interpolar `{{variavel}}`, e o vocabulário
 * dessas variáveis nasce de um dado. Por isso o bloco sem `dataContract` recebe
 * um JSON LIVRE (não validado) que só alimenta a interpolação — a UI diz isso
 * com todas as letras para ninguém esperar que o bloco desenhe esse dado.
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
import { PlaygroundVariables } from './playground-variables';
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
  const activeVariant = variants.find((v) => v.id === data.variantId);
  const hasContract = entry.hasData;

  return (
    <VStack gap={3}>
      <HStack gap={2} justify="between" vAlign="center">
        <Heading level={4}>Dados</Heading>
        <Badge
          variant={hasContract ? 'neutral' : 'blue'}
          label={
            hasContract && entry.shape ? SHAPE_LABEL[entry.shape] : 'Só para variáveis'
          }
        />
      </HStack>

      {hasContract ? null : (
        <Text type="supporting">
          Este bloco não consome dados: ele desenha o que está nas propriedades. O JSON
          abaixo NÃO é validado e serve só para alimentar as variáveis dos textos do
          cabeçalho.
        </Text>
      )}

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
            className="app-code-field"
            label="JSON dos dados"
            size="sm"
            rows={12}
            hasSpellCheck={false}
            value={data.dataText}
            placeholder={'{ "total": 1234, "cliente": "ACME" }'}
            description={
              hasContract
                ? undefined
                : 'Cada chave vira uma variável: {"total": 1234} habilita {{total}}.'
            }
            status={data.dataError ? { type: 'error' } : undefined}
            onChange={data.setDataText}
          />

          {data.dataError ? (
            <FieldStatus
              type="error"
              variant="detached"
              message={
                hasContract && entry.shape
                  ? `Inválido para o shape "${entry.shape}": ${data.dataError}`
                  : `JSON inválido: ${data.dataError}`
              }
            />
          ) : (
            <Text type="supporting">
              {hasContract
                ? 'JSON válido — o preview ao lado usa exatamente este dado.'
                : 'JSON válido — as variáveis abaixo já valem nos textos do cabeçalho.'}
            </Text>
          )}
        </>
      )}

      <PlaygroundVariables data={data.parsedData} />
    </VStack>
  );
}
