/**
 * Miniatura de UM bloco do catálogo.
 *
 * ANATOMIA — a mesma do `demo.html` da referência de design dos gráficos, que é
 * a folha em que os 18 tipos foram apresentados:
 *
 *   ┌───────────────────────────────────────────┐
 *   │ [Gráfico] [Série]        [copiar] [abrir] │ ← AÇÕES (topo)
 *   ├───────────────────────────────────────────┤
 *   │ Gráfico de Linhas                         │ ← título
 *   │ Série temporal: evolução ao longo do tempo│ ← subtítulo
 *   │ ┌──────────────────┐                      │
 *   │ │ line_chart · 5 props │                  │ ← etiqueta de código
 *   │ └──────────────────┘                      │
 *   │                                           │
 *   │            (o bloco desenhado)            │ ← palco
 *   └───────────────────────────────────────────┘
 *
 * O que mudou em relação à versão anterior: a descrição era um RODAPÉ abaixo do
 * preview e o tipo aparecia como texto solto; agora a descrição é o subtítulo do
 * cabeçalho e o tipo é a etiqueta monoespaçada da referência. O cartão passou a
 * ser lido de cima para baixo — quem é, o que faz, como se chama, como é.
 *
 * ALTURA FIXA DO PALCO (a decisão central deste card): a linha do CSS Grid
 * assume a altura do item mais alto, então um card que cresce com o conteúdo
 * abre buraco ao lado dos vizinhos — a galeria vira um serrote. O palco recorta
 * o excesso: a miniatura mostra o suficiente para reconhecer o bloco, e quem
 * quer ver inteiro abre o playground (que é a ação do card).
 *
 * PREVIEW SOB DEMANDA: o palco só monta o `BlockRenderer` quando entra no campo
 * de visão (`useInView`). São dezenas de blocos vivos na mesma página, alguns
 * com animação contínua — montar todos de uma vez mantinha a CPU ocupada e o
 * DOM em mutação permanente. Fora da tela, fica o esqueleto.
 */
import type { MouseEvent } from 'react';
import { Copy, Maximize2 } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { BlockRenderer } from '@/shared/render-engine';
import { useInView } from '@/shared/hooks/use-in-view';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../lib/catalog-entries';

export interface BlockPreviewCardProps {
  entry: CatalogEntry;
  onDetails: (entry: CatalogEntry) => void;
}

/**
 * Altura do palco do preview, em px.
 *
 * Depois da repaginação os gráficos do catálogo desenham em 320px (o padrão da
 * referência) e ainda somam a legenda no rodapé. 360 é a soma: o gráfico típico
 * aparece INTEIRO, como no `demo.html`, e só os blocos gigantes (tabelas
 * longas) são recortados.
 */
const STAGE_HEIGHT = 360;

export function BlockPreviewCard({ entry, onDetails }: BlockPreviewCardProps) {
  const { definition, kind, shape, block, result, propsCount, hasData } = entry;
  const { manifest } = definition;
  const { ref, isInView } = useInView<HTMLDivElement>({ rootMargin: '400px' });
  const toast = useAppToast();

  /**
   * Etiqueta do cabeçalho, no formato do `demo.html` (`chart-line · h 320`):
   * o identificador do bloco e a informação que decide se ele serve — quantas
   * props ele expõe, ou que ele não consome dados.
   */
  const tag = `${manifest.type} · ${
    hasData ? `${propsCount} ${propsCount === 1 ? 'prop' : 'props'}` : 'sem dados'
  }`;

  /**
   * O `ClickableCard` do Astryx isola os interativos aninhados (o clique num
   * botão não dispara o do cartão), mas o `copiar` ainda precisa parar a
   * propagação para não abrir o playground junto.
   */
  const handleCopy = async (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(manifest.type);
      toast.success(`Tipo "${manifest.type}" copiado.`);
    } catch {
      toast.error('Não foi possível copiar o tipo.');
    }
  };

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onDetails(entry);
  };

  return (
    <ClickableCard
      label={`Abrir playground de ${manifest.name}`}
      padding={0}
      onClick={() => onDetails(entry)}
    >
      <VStack gap={0} height="100%">
        {/* AÇÕES — o que o cartão é (à esquerda) e o que dá para fazer com ele
            (à direita). Fica ACIMA do cabeçalho para não competir com o título. */}
        <HStack
          gap={2}
          vAlign="center"
          hAlign="between"
          paddingInline={3}
          paddingBlock={2}
          data-slot="catalog-card-actions"
        >
          <HStack gap={1} wrap="wrap">
            <Badge variant="neutral" label={KIND_LABEL[kind]} />
            {shape ? <Badge variant="blue" label={SHAPE_LABEL[shape]} /> : null}
          </HStack>
          <HStack gap={1} vAlign="center">
            <IconButton
              label={`Copiar o tipo ${manifest.type}`}
              icon={<Icon icon={Copy} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={handleCopy}
            />
            <IconButton
              // Nome DIFERENTE do cartão de propósito: dois interativos com o
              // mesmo nome acessível fazem o leitor de tela anunciar o item
              // duas vezes, como se fossem destinos distintos.
              label={`Ver detalhes de ${manifest.name}`}
              icon={<Icon icon={Maximize2} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={handleOpen}
            />
          </HStack>
        </HStack>

        <Divider />

        {/* CABEÇALHO — título, subtítulo e etiqueta, na anatomia da referência
            (`05-tooltip-legenda-css.md` §4 + `demo.html`). */}
        <VStack gap={0} className="chart-card__header" data-slot="catalog-card-header">
          <Heading level={3} maxLines={1}>
            {manifest.name}
          </Heading>
          <Text type="supporting" color="secondary" maxLines={2}>
            {manifest.description}
          </Text>
          <span className="chart-card__tag">{tag}</span>
        </VStack>

        {/* PALCO — altura fixa e recorte: é o que iguala os cards da grade.
            `justify="center"` centra blocos baixos (KPI) no lugar de encostá-los
            no topo, o que fazia a grade parecer desalinhada mesmo alinhada. */}
        <VStack
          className="chart-body overflow-hidden"
          height={STAGE_HEIGHT}
          justify="center"
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
      </VStack>
    </ClickableCard>
  );
}
