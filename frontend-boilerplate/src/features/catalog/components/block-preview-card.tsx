/**
 * Miniatura de UM bloco do catálogo: cabeçalho (nome + tipo + selos) + preview
 * AO VIVO do componente com dados mockados (`BlockRenderer`) + descrição.
 *
 * É `ClickableCard` porque a grade é de MINIATURAS: cada card é um item
 * discreto que abre o playground daquele bloco. O `label` é o nome acessível do
 * alvo de clique — sem ele o leitor de tela anunciaria só "card".
 */
import { Badge } from '@astryxdesign/core/Badge';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { BlockRenderer } from '@/shared/render-engine';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../lib/catalog-entries';

export interface BlockPreviewCardProps {
  entry: CatalogEntry;
  onDetails: (entry: CatalogEntry) => void;
}

export function BlockPreviewCard({ entry, onDetails }: BlockPreviewCardProps) {
  const { definition, kind, shape, block, result, propsCount } = entry;
  const { manifest } = definition;

  return (
    <ClickableCard
      label={`Abrir playground de ${manifest.name}`}
      padding={4}
      onClick={() => onDetails(entry)}
    >
      <VStack gap={3}>
        <HStack gap={3} justify="between" align="start">
          <VStack gap={0.5}>
            <Heading level={3} maxLines={1}>
              {manifest.name}
            </Heading>
            <Text type="code" color="secondary">
              {manifest.type}
            </Text>
          </VStack>
          <HStack gap={1} wrap="wrap" justify="end">
            <Badge variant="neutral" label={KIND_LABEL[kind]} />
            {shape ? <Badge variant="blue" label={SHAPE_LABEL[shape]} /> : null}
          </HStack>
        </HStack>

        {/* Preview ao vivo com dados de exemplo (fixture) — o mesmo motor de
            render do dashboard, então o que aparece aqui é o que o usuário vê
            no relatório. */}
        <BlockRenderer block={block} result={result} />

        <VStack gap={1}>
          <Text type="supporting" maxLines={2}>
            {manifest.description}
          </Text>
          <Text type="supporting">
            {propsCount === 1
              ? '1 propriedade configurável'
              : `${propsCount} propriedades configuráveis`}
          </Text>
        </VStack>
      </VStack>
    </ClickableCard>
  );
}
