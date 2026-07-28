/**
 * CHART FRAME — a casca comum de TODO gráfico do catálogo.
 *
 * Quatro obrigações que nenhum gráfico pode reinventar:
 *   1. CABEÇALHO — título, subtítulo, descrição, ícone/etiqueta e ações,
 *      todos aceitando Markdown e `{{variavel}}` dos dados (contrato comum);
 *   2. ESTADOS — carregando, vazio, erro e sem permissão. Um gráfico nunca
 *      desenha eixo vazio em silêncio;
 *   3. GEOMETRIA — a área de plotagem com o padding assimétrico da referência
 *      (8px à esquerda, onde o eixo Y já ocupa espaço; 20px nos demais lados);
 *   4. ACESSIBILIDADE — o desenho se anuncia como imagem de dados, medidor ou
 *      progresso, com equivalente textual irmão da região.
 *
 * O `summary` fica FORA da região com `role` de propósito: papéis como `img`
 * podam os descendentes da árvore de acessibilidade, então o equivalente
 * textual precisa ser irmão, não filho.
 *
 * Referência: `05-tooltip-legenda-css.md` §4–§6, `01-fundamentos.md` §7–§8.
 */
import type { ReactNode } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { ChartSkeleton } from './chart-skeleton';
import { ChartText } from './chart-text';
import { chartPlainText } from './chart-text-html';
import type { ChartScope } from './chart-template';

/** Mensagem padrão quando a consulta não devolveu linhas. */
export const CHART_EMPTY_MESSAGE = 'Sem dados para exibir';

/** Mensagem padrão do erro de execução. */
export const CHART_ERROR_MESSAGE = 'Erro ao carregar os dados';

/** Mensagem padrão de acesso negado. */
export const CHART_FORBIDDEN_MESSAGE = 'Sem permissão para ver estes dados';

/**
 * Papel ARIA da área de plotagem:
 * - `img`: gráfico (imagem de dados) — o padrão;
 * - `meter`: medida dentro de uma faixa conhecida (medidor radial);
 * - `progressbar`: progresso rumo a um total (círculo de progresso).
 */
export type ChartFrameRole = 'img' | 'meter' | 'progressbar';

/** Estado do gráfico. `success` desenha; os demais substituem o corpo. */
export type ChartFrameState = 'success' | 'loading' | 'empty' | 'error' | 'forbidden';

export interface ChartFrameProps {
  /** Rótulo acessível — vira o `aria-label` da região de plotagem. */
  label: string;
  /** Equivalente textual dos dados, exposto só a leitores de tela. */
  summary?: string;
  /** Altura da área de plotagem, em px (geometria do desenho). */
  height: number;
  /** Papel ARIA da região de plotagem. */
  role?: ChartFrameRole;
  /** Valor atual (medidor/progresso). */
  valueNow?: number;
  /** Mínimo da escala (medidor/progresso). */
  valueMin?: number;
  /** Máximo da escala (medidor/progresso). */
  valueMax?: number;
  /** Leitura do valor em texto (ex.: "73% de 100"). */
  valueText?: string;

  /* --- Cabeçalho (contrato comum — todos aceitam Markdown + {{variáveis}}) - */
  /** Título exibido acima do desenho. */
  title?: string;
  /** Subtítulo, uma linha abaixo do título. */
  subtitle?: string;
  /** Texto de ajuda/descrição, abaixo do subtítulo. */
  description?: string;
  /** Ícone ou etiqueta à esquerda do título. */
  icon?: ReactNode;
  /** Ações do card (seletor de período, menu) — à direita do cabeçalho. */
  actions?: ReactNode;
  /**
   * Nível do título. Default 4 porque o gráfico normalmente vive DENTRO de um
   * card que já tem o título de nível 3 (`BlockFrame`).
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Escopo de interpolação para os campos de texto (de `buildChartScope`). */
  scope?: ChartScope;

  /* --- Estados ----------------------------------------------------------- */
  /** Estado do gráfico. Tem prioridade sobre `isLoading`/`isEmpty`. */
  state?: ChartFrameState;
  /** Troca o gráfico pelo esqueleto (atalho de `state="loading"`). */
  isLoading?: boolean;
  /** Sem dados (atalho de `state="empty"`). */
  isEmpty?: boolean;
  /** Mensagem do estado vazio. */
  emptyMessage?: string;
  /** Mensagem do estado de erro. */
  errorMessage?: string;
  /** Versão enxuta (spark, medidor): o vazio vira uma linha de `Text`. */
  isCompact?: boolean;

  /* --- Geometria --------------------------------------------------------- */
  /** Centraliza a plotagem — para desenhos de largura fixa (anéis). */
  isCentered?: boolean;
  /** Circular (pizza, rosca, medidor): esqueleto redondo, corpo centralizado. */
  isCircular?: boolean;
  /** Sem o padding da referência — mini-gráficos coladinhos no card. */
  isBare?: boolean;

  /** Conteúdo abaixo da plotagem — normalmente a legenda. */
  footer?: ReactNode;
  /** A plotagem em si (recharts). */
  children: ReactNode;
}

/** Envolve a plotagem com cabeçalho, estados e contrato de a11y. */
export function ChartFrame({
  label,
  summary,
  height,
  role = 'img',
  valueNow,
  valueMin,
  valueMax,
  valueText,
  title,
  subtitle,
  description,
  icon,
  actions,
  headingLevel = 4,
  scope,
  state,
  isLoading = false,
  isEmpty = false,
  emptyMessage = CHART_EMPTY_MESSAGE,
  errorMessage,
  isCompact = false,
  isCentered = false,
  isCircular = false,
  isBare = false,
  footer,
  children,
}: ChartFrameProps) {
  const resolved: ChartFrameState =
    state ?? (isLoading ? 'loading' : isEmpty ? 'empty' : 'success');

  const plainLabel = chartPlainText(label, scope) || label;
  const header = renderHeader({
    title,
    subtitle,
    description,
    icon,
    actions,
    headingLevel,
    scope,
  });

  const body = renderBody({
    state: resolved,
    height,
    isCircular,
    isCompact,
    label: plainLabel,
    emptyMessage: chartPlainText(emptyMessage, scope) || emptyMessage,
    errorMessage,
  });

  if (body) {
    return (
      <VStack gap={3} width="100%" data-slot="chart" data-chart-state={resolved}>
        {header}
        {body}
      </VStack>
    );
  }

  return (
    <VStack gap={3} width="100%" data-slot="chart" data-chart-state="success">
      {header}
      <VStack
        className={isBare ? undefined : isCircular ? 'chart-body--center' : 'chart-body'}
        gap={2}
        width="100%"
      >
        <VStack
          role={role}
          aria-label={plainLabel}
          aria-valuenow={valueNow}
          aria-valuemin={valueMin}
          aria-valuemax={valueMax}
          aria-valuetext={valueText}
          height={height}
          width="100%"
          hAlign={isCentered || isCircular ? 'center' : 'stretch'}
        >
          {children}
        </VStack>
        {footer}
      </VStack>
      {summary ? <VisuallyHidden>{summary}</VisuallyHidden> : null}
    </VStack>
  );
}

/** Cabeçalho do gráfico. `null` quando nenhum campo foi preenchido. */
function renderHeader({
  title,
  subtitle,
  description,
  icon,
  actions,
  headingLevel,
  scope,
}: Pick<
  ChartFrameProps,
  'title' | 'subtitle' | 'description' | 'icon' | 'actions' | 'scope'
> & { headingLevel: NonNullable<ChartFrameProps['headingLevel']> }): ReactNode {
  const hasText = Boolean(title || subtitle || description);
  if (!hasText && !icon && !actions) return null;

  return (
    <HStack gap={2} hAlign="between" vAlign="start" data-slot="chart-header">
      <HStack gap={2} vAlign="center">
        {icon}
        <VStack gap={0.5}>
          {title ? (
            <Heading level={headingLevel} maxLines={2}>
              <ChartText value={title} scope={scope} />
            </Heading>
          ) : null}
          {subtitle ? (
            <Text type="supporting" color="secondary">
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
      {actions}
    </HStack>
  );
}

/** Corpo alternativo dos estados sem desenho. `null` quando há o que desenhar. */
function renderBody({
  state,
  height,
  isCircular,
  isCompact,
  label,
  emptyMessage,
  errorMessage,
}: {
  state: ChartFrameState;
  height: number;
  isCircular: boolean;
  isCompact: boolean;
  label: string;
  emptyMessage: string;
  errorMessage?: string;
}): ReactNode {
  if (state === 'loading') {
    return (
      <ChartSkeleton
        height={height}
        isCircular={isCircular}
        label={`Carregando ${label}`}
      />
    );
  }

  if (state === 'error') {
    return (
      <Banner
        data-slot="chart-error"
        status="error"
        title={CHART_ERROR_MESSAGE}
        description={errorMessage}
      />
    );
  }

  if (state === 'forbidden') {
    return (
      <Banner
        data-slot="chart-forbidden"
        status="warning"
        title={CHART_FORBIDDEN_MESSAGE}
        description={errorMessage}
      />
    );
  }

  if (state === 'empty') {
    return (
      <Center height={height} width="100%" data-slot="chart-empty">
        {isCompact ? (
          <Text type="supporting" color="secondary">
            {emptyMessage}
          </Text>
        ) : (
          <EmptyState isCompact title={emptyMessage} description={label} />
        )}
      </Center>
    );
  }

  return null;
}
