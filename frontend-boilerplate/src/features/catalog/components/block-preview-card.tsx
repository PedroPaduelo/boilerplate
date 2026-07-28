/**
 * Miniatura de UM bloco do catálogo.
 *
 * ANATOMIA FIXA (a decisão central deste card): cabeçalho → palco do preview →
 * rodapé. As três zonas têm altura previsível, então todos os cards da grade
 * têm a MESMA altura.
 *
 * Por que isso importa: antes o card crescia com o conteúdo do bloco, e como a
 * linha do CSS Grid assume a altura do item mais alto, um `data_table` de 731px
 * abria um buraco de 400px ao lado de um `kpi` de 300px. A galeria virava um
 * serrote. Agora o preview mora num PALCO de altura fixa que recorta o excesso
 * — a miniatura mostra o suficiente para reconhecer o bloco, e quem quer ver
 * inteiro abre o playground (que é justamente a ação do card).
 *
 * PREVIEW SOB DEMANDA: o palco só monta o `BlockRenderer` quando entra no campo
 * de visão (`useInView`). São 42 blocos vivos na mesma página, nove deles com
 * animação contínua (feixes com 50 traçados, caixas, brilho, morfose) — montar
 * todos de uma vez mantinha a CPU ocupada e o DOM em mutação permanente. Fora
 * da tela, fica o esqueleto.
 */
import { Badge } from '@astryxdesign/core/Badge';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { BlockRenderer } from '@/shared/render-engine';
import { useInView } from '@/shared/hooks/use-in-view';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../lib/catalog-entries';

export interface BlockPreviewCardProps {
  entry: CatalogEntry;
  onDetails: (entry: CatalogEntry) => void;
}

/**
 * Altura do palco do preview. Casa com a altura natural dos gráficos do
 * catálogo (a mesma referência do esqueleto do `BlockFrame`), de modo que um
 * gráfico típico aparece inteiro e só os blocos gigantes são recortados.
 */
const STAGE_HEIGHT = 208;

/**
 * Altura reservada ao rodapé. Corresponde a DUAS linhas de descrição (o teto
 * do `maxLines`) mais a linha de meta e o padding — assim uma descrição curta
 * não encolhe o card e desalinha a linha da grade.
 */
const FOOTER_MIN_HEIGHT = 84;

export function BlockPreviewCard({ entry, onDetails }: BlockPreviewCardProps) {
  const { definition, kind, shape, block, result, propsCount, hasData } = entry;
  const { manifest } = definition;
  const { ref, isInView } = useInView<HTMLDivElement>({ rootMargin: '400px' });

  return (
    <ClickableCard
      label={`Abrir playground de ${manifest.name}`}
      padding={0}
      onClick={() => onDetails(entry)}
    >
      <VStack gap={0} height="100%">
        <VStack gap={1} padding={3}>
          <HStack gap={2} justify="between" align="start">
            <Heading level={3} maxLines={1}>
              {manifest.name}
            </Heading>
            <HStack gap={1} wrap="wrap" justify="end">
              <Badge variant="neutral" label={KIND_LABEL[kind]} />
              {shape ? <Badge variant="blue" label={SHAPE_LABEL[shape]} /> : null}
            </HStack>
          </HStack>
          <Text type="code" color="secondary" maxLines={1}>
            {manifest.type}
          </Text>
        </VStack>

        <Divider />

        {/* PALCO — altura fixa e recorte: é o que iguala os cards da grade.
            `justify="center"` centra blocos baixos (KPI) no lugar de encostá-los
            no topo, o que fazia a grade parecer desalinhada mesmo alinhada. */}
        <VStack
          padding={3}
          height={STAGE_HEIGHT}
          justify="center"
          className="overflow-hidden"
          data-slot="catalog-preview-stage"
        >
          <div ref={ref}>
            {isInView ? (
              <BlockRenderer block={block} result={result} />
            ) : (
              <VStack gap={2} aria-hidden="true">
                <Skeleton width="40%" height={14} radius={1} />
                <Skeleton width="100%" height={120} radius={2} index={1} />
              </VStack>
            )}
          </div>
        </VStack>

        <Divider />

        <VStack gap={1} padding={3} minHeight={FOOTER_MIN_HEIGHT} justify="start">
          <Text type="supporting" maxLines={2}>
            {manifest.description}
          </Text>
          <Text type="supporting" color="secondary">
            {propsCount === 1 ? '1 propriedade' : `${propsCount} propriedades`}
            {hasData ? '' : ' · sem dados'}
          </Text>
        </VStack>
      </VStack>
    </ClickableCard>
  );
}
