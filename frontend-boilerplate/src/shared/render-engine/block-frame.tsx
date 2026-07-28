/**
 * BlockFrame — a MOLDURA padrão de todo bloco de visualização do dashboard.
 *
 * Vive no render-engine, e não em `shared/ui`, porque a moldura é uma decisão
 * do MOTOR (o que envolve um bloco de gráfico), não um primitivo de tela: quem
 * renderiza um bloco não escolhe a moldura, o engine é que a aplica.
 *
 * Anatomia (`05-tooltip-legenda-css.md` §4 da referência de gráficos):
 *   1. HEADER    — ícone/etiqueta + título + subtítulo + descrição + ações.
 *                  Padding 24/24/0; título 15,75px/600; subtítulo 12,25px/400.
 *   2. CORPO     — o gráfico, o esqueleto ou o estado (vazio/erro/sem permissão).
 *   3. TAKEAWAYS — 0..N linhas de insight de negócio derivadas dos dados.
 *   4. FOOTER    — rodapé técnico: query SQL + duração da execução.
 *
 * CONTRATO COMUM: todo campo de texto (título, subtítulo, descrição, insight,
 * mensagem de vazio) aceita **Markdown** e **`{{variavel}}`** resolvida a
 * partir dos dados do bloco. A implementação é uma só — `ChartText` —, e a
 * moldura é quem a aplica, para que nenhum bloco precise repetir.
 */
import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { formatDuration } from '@/shared/lib/format';
import { ChartSkeleton, ChartText, buildChartScope, chartPlainText } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';

/**
 * Item de takeaway (insight de rodapé). `enabled` liga/desliga um item sem
 * removê-lo do estado — é o que o playground do catálogo manipula.
 */
export interface BlockFrameTakeaway {
  enabled: boolean;
  text: string;
}

/** Estado do bloco dentro da moldura. */
export type BlockFrameState = 'success' | 'loading' | 'empty' | 'error' | 'forbidden';

export interface BlockFrameProps {
  /** Título do card. Aceita Markdown e `{{variaveis}}`. */
  title: string;
  /** Subtítulo, abaixo do título. Aceita Markdown e `{{variaveis}}`. */
  subtitle?: string;
  /** Texto de ajuda/descrição. Aceita Markdown e `{{variaveis}}`. */
  description?: string;
  /** Nome do tipo de bloco, exibido como etiqueta ao lado do título. */
  chartType?: string;
  /** Ícone à esquerda do título. */
  icon?: ReactNode;
  /** Ações do card (seletor de período, menu) — à direita do cabeçalho. */
  actions?: ReactNode;
  /** Dados já resolvidos — origem das `{{variaveis}}` de todos os textos. */
  data?: unknown;
  /** Variáveis extras do bloco, somadas às derivadas dos dados. */
  scopeExtra?: ChartScope;

  /** Query SQL que alimentou o bloco (rodapé técnico). */
  query?: string;
  /** Duração da execução, em ms. */
  durationMs?: number;
  /** `false` esconde o rodapé técnico inteiro, mesmo com `query`. */
  showQuery?: boolean;

  /** Estado do bloco. Tem prioridade sobre `isLoading`. */
  state?: BlockFrameState;
  /** Enquanto `true`, o corpo vira esqueleto (atalho de `state="loading"`). */
  isLoading?: boolean;
  /** Mensagem de erro/permissão exibida no corpo. */
  error?: string;
  /** Mensagem do estado vazio. Aceita Markdown e `{{variaveis}}`. */
  emptyMessage?: string;

  takeaways?: BlockFrameTakeaway[];
  /**
   * Altura reservada ao corpo, por TIPO de bloco (`lib/block-sizing`). O
   * esqueleto e o gráfico ocupam a mesma caixa, então a chegada do dado não
   * muda a altura do card.
   */
  bodyMinHeight?: number;
  children?: ReactNode;
}

/** Usada quando o tipo não declara altura própria. */
const BODY_SKELETON_HEIGHT = 224;

/** Texto padrão do estado vazio. */
const EMPTY_TITLE = 'Sem dados';
const EMPTY_DESCRIPTION = 'A consulta deste bloco não retornou linhas.';

export function BlockFrame({
  title,
  subtitle,
  description,
  chartType,
  icon,
  actions,
  data,
  scopeExtra,
  query,
  durationMs,
  showQuery = true,
  state,
  isLoading = false,
  error,
  emptyMessage,
  takeaways,
  bodyMinHeight,
  children,
}: BlockFrameProps) {
  const resolved: BlockFrameState = state ?? (isLoading ? 'loading' : 'success');
  const scope = buildChartScope(data, scopeExtra);

  const visibleTakeaways = (takeaways ?? []).filter(
    (takeaway) => takeaway.enabled && takeaway.text.trim().length > 0,
  );
  const hasFooter = showQuery && Boolean(query);
  const bodyHeight = bodyMinHeight ?? BODY_SKELETON_HEIGHT;

  return (
    <Card padding={0} data-slot="block-frame" data-block-frame-state={resolved}>
      <VStack>
        <HStack
          className="chart-card__header"
          gap={2}
          vAlign="start"
          hAlign="between"
          data-slot="block-frame-header"
        >
          <HStack gap={2} vAlign="center">
            {icon}
            <VStack gap={0.5}>
              {/* Título do card: 15,75px/600 na referência — o `level={3}` do
                  tema (16px/600) é o degrau equivalente, e mantém o card
                  navegável por títulos para quem usa leitor de tela. */}
              <Heading level={3} maxLines={2}>
                <ChartText value={title} scope={scope} />
              </Heading>
              {subtitle ? (
                <Text type="supporting" color="secondary" maxLines={2}>
                  <ChartText value={subtitle} scope={scope} />
                </Text>
              ) : null}
              {description ? (
                <Text type="supporting" color="secondary">
                  <ChartText value={description} scope={scope} />
                </Text>
              ) : null}
            </VStack>
          </HStack>
          <HStack gap={2} vAlign="center">
            {actions}
            {chartType ? <Badge label={chartType} variant="neutral" /> : null}
          </HStack>
        </HStack>

        <VStack
          className="chart-body"
          minHeight={bodyHeight}
          justify="center"
          data-slot="block-frame-body"
        >
          <BlockFrameBody
            state={resolved}
            height={bodyHeight}
            title={chartPlainText(title, scope) || title}
            error={error}
            emptyMessage={emptyMessage}
            scope={scope}
          >
            {children}
          </BlockFrameBody>
        </VStack>

        {visibleTakeaways.length > 0 ? (
          <>
            <Divider />
            <VStack
              gap={1}
              paddingInline={6}
              paddingBlock={2}
              data-slot="block-frame-takeaways"
            >
              {visibleTakeaways.map((takeaway) => (
                <HStack key={takeaway.text} gap={1.5} vAlign="start">
                  <Icon icon={Lightbulb} size="sm" color="warning" />
                  <Text type="supporting" color="primary">
                    <ChartText value={takeaway.text} scope={scope} />
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
              paddingInline={6}
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

/** Corpo: o gráfico, ou o estado que o substitui. */
function BlockFrameBody({
  state,
  height,
  title,
  error,
  emptyMessage,
  scope,
  children,
}: {
  state: BlockFrameState;
  height: number;
  title: string;
  error?: string;
  emptyMessage?: string;
  scope: ChartScope;
  children?: ReactNode;
}) {
  if (state === 'loading') {
    return <ChartSkeleton height={height} label={`Carregando ${title}`} />;
  }

  if (state === 'error') {
    return (
      <Banner
        data-slot="block-error"
        status="error"
        title="Erro ao carregar o bloco"
        description={error}
      />
    );
  }

  if (state === 'forbidden') {
    return (
      <Banner
        data-slot="block-forbidden"
        status="warning"
        title="Sem permissão para ver estes dados"
        description={error}
      />
    );
  }

  if (state === 'empty') {
    const message = chartPlainText(emptyMessage, scope);
    return (
      <EmptyState
        data-slot="block-empty"
        isCompact
        title={message || EMPTY_TITLE}
        description={message ? undefined : EMPTY_DESCRIPTION}
      />
    );
  }

  return <>{children}</>;
}
