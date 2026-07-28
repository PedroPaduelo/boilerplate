/**
 * BlockFrame — a MOLDURA padrão de todo bloco de visualização do dashboard.
 *
 * Substitui o `ChartWidget` legado (shadcn/Tailwind) por composição do Astryx.
 * Vive no render-engine, e não em `shared/ui`, porque a moldura é uma decisão
 * do MOTOR (o que envolve um bloco de gráfico), não um primitivo de tela: quem
 * renderiza um bloco não escolhe a moldura, o engine é que a aplica.
 *
 * NOTA DE INTEGRAÇÃO: a trilha de `shared/ui` está criando um widget de painel
 * equivalente (`@/shared/ui/chart-widget`), com anatomia e props praticamente
 * iguais (`title`/`chartType`/`isLoading`/`takeaways`/`query`/`durationMs`/
 * `showQuery`). Se ele vencer na consolidação, esta moldura sai e o
 * `block-renderer` troca o import — as props já usam os mesmos nomes.
 *
 * Quatro zonas, todas opcionais exceto o corpo:
 *   1. HEADER    — título do bloco + tipo (`chartType`).
 *   2. CORPO     — o gráfico (ou o esqueleto, enquanto carrega).
 *   3. TAKEAWAYS — 0..N linhas de insight de negócio derivadas dos dados.
 *   4. FOOTER    — rodapé técnico: query SQL + duração da execução.
 */
import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { formatDuration } from '@/shared/lib/format';

/**
 * Item de takeaway (insight de rodapé). `enabled` liga/desliga um item sem
 * removê-lo do estado — é o que o playground do catálogo manipula.
 */
export interface BlockFrameTakeaway {
  enabled: boolean;
  text: string;
}

export interface BlockFrameProps {
  title: string;
  /** Nome do tipo de bloco, exibido como etiqueta ao lado do título. */
  chartType?: string;
  /** Query SQL que alimentou o bloco (rodapé técnico). */
  query?: string;
  /** Duração da execução, em ms. */
  durationMs?: number;
  /** Enquanto `true`, o corpo vira esqueleto. */
  isLoading?: boolean;
  takeaways?: BlockFrameTakeaway[];
  /** `false` esconde o rodapé técnico inteiro, mesmo com `query`. */
  showQuery?: boolean;
  /**
   * Altura reservada ao corpo, por TIPO de bloco (`lib/block-sizing`). O
   * esqueleto e o gráfico ocupam a mesma caixa, então a chegada do dado não
   * muda a altura do card — antes havia um número único (224 px) para todo o
   * catálogo, que era alto demais para um ranking e baixo demais para uma
   * série, e o card pulava nos dois casos.
   */
  bodyMinHeight?: number;
  children?: ReactNode;
}

/** Usada quando o tipo não declara altura própria. */
const BODY_SKELETON_HEIGHT = 224;

export function BlockFrame({
  title,
  chartType,
  query,
  durationMs,
  isLoading = false,
  takeaways,
  showQuery = true,
  bodyMinHeight,
  children,
}: BlockFrameProps) {
  const visibleTakeaways = (takeaways ?? []).filter(
    (takeaway) => takeaway.enabled && takeaway.text.trim().length > 0,
  );
  const hasFooter = showQuery && Boolean(query);

  return (
    <Card padding={0} data-slot="block-frame">
      <VStack>
        <HStack
          gap={2}
          vAlign="center"
          hAlign="between"
          paddingInline={4}
          paddingBlock={3}
        >
          <Heading level={3} maxLines={1}>
            {title}
          </Heading>
          {chartType ? <Badge label={chartType} variant="neutral" /> : null}
        </HStack>
        <Divider />

        <VStack
          paddingInline={4}
          paddingBlock={3}
          minHeight={bodyMinHeight}
          justify="center"
          data-slot="block-frame-body"
        >
          {isLoading ? (
            <Skeleton
              width="100%"
              height={bodyMinHeight ?? BODY_SKELETON_HEIGHT}
              radius={2}
            />
          ) : (
            children
          )}
        </VStack>

        {visibleTakeaways.length > 0 ? (
          <>
            <Divider />
            <VStack
              gap={1}
              paddingInline={4}
              paddingBlock={2}
              data-slot="block-frame-takeaways"
            >
              {visibleTakeaways.map((takeaway) => (
                <HStack key={takeaway.text} gap={1.5} vAlign="start">
                  <Icon icon={Lightbulb} size="sm" color="warning" />
                  <Text type="supporting" color="primary">
                    {takeaway.text}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </>
        ) : null}

        {hasFooter ? (
          <>
            <Divider />
            <HStack
              gap={2}
              vAlign="center"
              paddingInline={4}
              paddingBlock={2}
              data-slot="block-frame-footer"
            >
              <Text type="code" color="secondary" maxLines={1}>
                {query}
              </Text>
              {durationMs != null ? (
                <Text
                  type="supporting"
                  hasTabularNumbers
                  data-slot="block-frame-duration"
                >
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
