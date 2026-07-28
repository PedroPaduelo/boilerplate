/**
 * CARD DE RESUMO COM TENDÊNCIA — o widget mais reutilizado da referência
 * (`04-widgets-prontos.md` §2 e §6). É o card que abre um painel: ícone,
 * título, número grande e a variação ancorada no canto.
 *
 * Duas peças moram aqui:
 *  - `SummaryCard`, a CASCA da referência (superfície, geometria e âncoras).
 *    É consumida também pelo `StatTile` e pelo cartão do bloco `metric_glow`
 *    — é a mesma composição em §2.4 da referência, que lista quatro variações
 *    do mesmo card mudando só o mini-gráfico;
 *  - `KpiCard`, o card completo (rótulo → número → variação → comparação).
 *
 * ---------------------------------------------------------------------------
 * LAYOUT (§2.1 / §2.2 / §6) — o que é medida da referência
 * ---------------------------------------------------------------------------
 *   padding ............ 24px   → `padding={6}` (a escala do DS é de 4px)
 *   box-shadow ......... none   → §2.1 sobrescreve a sombra padrão de card
 *   position ........... relative
 *   fundo .............. gradiente 135° de `lighter/0.48` → `light/0.48`
 *   texto .............. `darker` da mesma família
 *   ícone .............. 48×48, 24px abaixo
 *   tendência .......... absoluta em top/right 16px, gap 4px
 *   título ............. 12,25px/600, 8px abaixo
 *   valor .............. 17,5px/700, número abreviado
 *   coluna de texto .... flex-grow 1, min-width 112px
 *   mini-gráfico ....... 84×56, à direita e à base (slot `media`)
 *
 * ---------------------------------------------------------------------------
 * COR: FAMÍLIA DO DS, NUNCA HEX
 * ---------------------------------------------------------------------------
 * A referência descreve o card por TONS de uma família (`lighter`, `light`,
 * `dark`, `darker`). O tema publica exatamente esse quarteto por família, já
 * com a inversão do modo escuro embutida (`light-dark()`), sob os quatro slots
 * abaixo — e o nome da família é o mesmo da variante de cor do `Card`, que é o
 * que `chartAccentCardVariant()` devolve:
 *
 *   --color-background-<familia>  →  light-dark(--ds-color-<X>-lighter, -darker)
 *   --color-border-<familia>      →  light-dark(--ds-color-<X>-light,   -dark)
 *   --color-text-<familia>        →  light-dark(--ds-color-<X>-darker,  -lighter)
 *   --color-icon-<familia>        →  light-dark(--ds-color-<X>-dark,    -light)
 *
 * Ou seja: `lighter` e `light` (os dois pontos do gradiente) e `darker` (o
 * texto) saem de token, e no escuro o card escurece em vez de virar um bloco
 * claro no meio de uma tela escura. O gradiente em si vai em `style` porque é
 * COMPOSIÇÃO — o `Card` expõe `variant` (uma cor chapada), não uma rampa de
 * duas paradas a 48%.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { CardProps } from '@astryxdesign/core/Card';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import {
  CHART_EMPTY_MESSAGE,
  CHART_ERROR_MESSAGE,
  ChartText,
  interpolateText,
  type ChartScope,
} from './charts';
import { AnimatedNumber } from './animated-number';
import { DeltaBadge } from './delta-badge';

/* ========================================================================== *
 * Superfície — a família de cor do DS
 * ========================================================================== */

/**
 * As dez variantes de cor do `Card` que o tema publica como FAMÍLIA (cada uma
 * com o quarteto `--color-{background,border,text,icon}-<nome>` documentado no
 * topo). `default`, `transparent` e `muted` não são famílias — um card com
 * essas variantes fica no visual padrão, sem gradiente, que é o correto para
 * um indicador sem categoria.
 */
const COLOR_FAMILIES = [
  'blue',
  'cyan',
  'gray',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;

/** Família de cor do card — o vocabulário de `chartAccentCardVariant()`. */
type ColorFamily = (typeof COLOR_FAMILIES)[number];

/** A variante recebida descreve uma família de cor? */
function colorFamilyOf(variant: CardProps['variant']): ColorFamily | undefined {
  return variant && (COLOR_FAMILIES as readonly string[]).includes(variant)
    ? (variant as ColorFamily)
    : undefined;
}

/** Opacidade dos dois pontos do gradiente — 0.48 na referência (§2.1). */
const SURFACE_ALPHA = '48%';

/** Um tom da família com a opacidade da referência, sem sair de token. */
function tint(token: string): string {
  return `color-mix(in srgb, var(${token}) ${SURFACE_ALPHA}, transparent)`;
}

/**
 * A superfície do card (§2.1). `boxShadow: none` é explícito porque a
 * referência anota a sobrescrita; `isolation` cria o contexto de empilhamento
 * que faz a forma decorativa (`decoration`, `z-index: -1`) ficar ATRÁS do
 * conteúdo e ainda assim à frente do fundo do card.
 */
function surfaceStyle(family: ColorFamily | undefined): CSSProperties {
  const base: CSSProperties = {
    position: 'relative',
    boxShadow: 'none',
    isolation: 'isolate',
  };
  if (!family) return base;
  return {
    ...base,
    color: `var(--color-text-${family})`,
    backgroundImage: `linear-gradient(135deg, ${tint(
      `--color-background-${family}`,
    )}, ${tint(`--color-border-${family}`)})`,
  };
}

/** Bloco de tendência: absoluto no canto superior direito, 16px (§2.2). */
const TREND_STYLE: CSSProperties = {
  position: 'absolute',
  insetBlockStart: 'var(--spacing-4)',
  insetInlineEnd: 'var(--spacing-4)',
};

/**
 * Coluna de texto: cresce e nunca fica mais estreita que 112px (§2.2). Os dois
 * números existem por causa do mini-gráfico ao lado — é o que impede o título
 * de quebrar em quatro linhas quando o card estreita. Geometria de composição,
 * sem equivalente no DS.
 */
const TEXT_COLUMN_STYLE: CSSProperties = { flexGrow: 1, minWidth: 112 };

/** Forma decorativa: cobre o card inteiro, atrás do conteúdo (§2.1). */
const DECORATION_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  overflow: 'hidden',
  borderRadius: 'inherit',
  pointerEvents: 'none',
};

/* ========================================================================== *
 * SummaryCard — a casca da referência
 * ========================================================================== */

export interface SummaryCardProps {
  /** Família de cor do card — o valor devolvido por `chartAccentCardVariant()`. */
  variant?: CardProps['variant'];
  /** Ícone do topo. A caixa é de 48×48 e o respiro abaixo, de 24px (§2.2). */
  icon?: ReactNode;
  /** Bloco de tendência, ancorado no canto superior direito. */
  trend?: ReactNode;
  /** Mini-gráfico de 84×56, alinhado à direita e à base (§2.2). */
  media?: ReactNode;
  /** Forma decorativa desenhada ATRÁS do conteúdo (§2.1). */
  decoration?: ReactNode;
  /** Valor do `data-slot` do card — cada widget se identifica com o seu. */
  slot?: string;
  /** A coluna de texto: título, valor e o que mais o widget precisar. */
  children: ReactNode;
}

/** A casca do card de resumo: superfície, âncoras e geometria da referência. */
export function SummaryCard({
  variant,
  icon,
  trend,
  media,
  decoration,
  slot = 'summary-card',
  children,
}: SummaryCardProps) {
  const family = colorFamilyOf(variant);

  return (
    <Card
      // 24px — a escala de espaçamento do DS é de 4px por passo (§2.1).
      padding={6}
      data-slot={slot}
      data-color-family={family}
      style={surfaceStyle(family)}
    >
      {decoration ? (
        <span
          aria-hidden="true"
          data-slot="summary-card-decoration"
          style={DECORATION_STYLE}
        >
          {decoration}
        </span>
      ) : null}

      {trend ? (
        <div data-slot="summary-card-trend" style={TREND_STYLE}>
          {trend}
        </div>
      ) : null}

      <HStack gap={4} hAlign="between" vAlign="end" width="100%">
        {/* 24px entre o ícone e o texto (§2.2) — o `gap` só conta quando há ícone. */}
        <VStack gap={6} style={TEXT_COLUMN_STYLE}>
          {icon ? (
            <HStack
              // 48×48: `--spacing-12` é o passo de 48px da escala do DS.
              width="var(--spacing-12)"
              height="var(--spacing-12)"
              vAlign="center"
              data-slot="summary-card-icon"
            >
              {icon}
            </HStack>
          ) : null}
          {/* 8px entre título e valor (§2.2). */}
          <VStack gap={2}>{children}</VStack>
        </VStack>
        {media}
      </HStack>
    </Card>
  );
}

/* ========================================================================== *
 * KpiCard
 * ========================================================================== */

/** Estado do card. `success` desenha o número; os demais o substituem. */
export type KpiCardState = 'success' | 'loading' | 'empty' | 'error';

/**
 * Markdown inline dentro de um valor JÁ formatado. Quando aparece, o texto
 * vence a rolagem de dígito: `AnimatedNumber` desenha caractere a caractere e
 * não teria onde pendurar um `<strong>`.
 */
const INLINE_MARKUP = /[*_`~[\]]/;

export interface KpiCardProps {
  /** Nome da métrica (ex.: "Receita recorrente"). Aceita Markdown e `{{var}}`. */
  label: string;
  /** Valor numérico — anima dígito a dígito quando muda. */
  value?: number;
  /**
   * Valor JÁ formatado (ex.: "R$ 2,61 bi"). Vence `value`/`prefix`/`suffix`:
   * valores monetários longos ficam ilegíveis rolando casa a casa. Aceita
   * Markdown e `{{variavel}}`.
   */
  displayValue?: string;
  /** Prefixo colado no número (ex.: "R$"). */
  prefix?: string;
  /** Unidade colada no número (ex.: "%"). Aceita Markdown e `{{variavel}}`. */
  suffix?: string;
  /** Variação percentual vs. período anterior. */
  delta?: number;
  /** Texto ao lado da variação. Aceita Markdown e `{{variavel}}`. */
  hint?: string;
  /** Força a direção da variação. */
  trend?: 'up' | 'down';
  /** Se subir é bom (inverte a cor da variação quando `false`). */
  higherIsBetter?: boolean;
  /** Ícone do topo — passe o `Icon` do DS já montado (caixa de 48×48). */
  icon?: ReactNode;
  /** Cor de categorização do card (variantes do `Card` do DS). */
  variant?: CardProps['variant'];
  /** Estado do card. Tem prioridade sobre `isLoading`/`isEmpty`. */
  state?: KpiCardState;
  /** Troca o valor por `Skeleton` (atalho de `state="loading"`). */
  isLoading?: boolean;
  /** Sem dados (atalho de `state="empty"`). */
  isEmpty?: boolean;
  /** Mensagem do estado vazio. Aceita Markdown e `{{variavel}}`. */
  emptyMessage?: string;
  /** Detalhe do erro, exibido quando `state="error"`. */
  error?: string;
  /** Escopo de interpolação das `{{variaveis}}` (de `buildChartScope`). */
  scope?: ChartScope;
  /** Mini-gráfico de 84×56 à direita do texto (§2.2). */
  media?: ReactNode;
  /** Forma decorativa atrás do conteúdo (§2.1). */
  decoration?: ReactNode;
  /** `data-slot` do card — os irmãos do mesmo layout se identificam por ele. */
  slot?: string;
}

/** Card de indicador: rótulo, número em destaque e variação. */
export function KpiCard({
  label,
  value = 0,
  displayValue,
  prefix,
  suffix,
  delta,
  hint = 'vs. período anterior',
  trend,
  higherIsBetter = true,
  icon,
  variant,
  state,
  isLoading = false,
  isEmpty = false,
  emptyMessage = CHART_EMPTY_MESSAGE,
  error,
  scope,
  media,
  decoration,
  slot = 'kpi-card',
}: KpiCardProps) {
  const resolved: KpiCardState =
    state ?? (isLoading ? 'loading' : isEmpty ? 'empty' : 'success');
  const isSuccess = resolved === 'success';

  return (
    <SummaryCard
      variant={variant}
      slot={slot}
      icon={icon}
      media={isSuccess ? media : undefined}
      decoration={decoration}
      trend={
        isSuccess && delta !== undefined ? (
          <DeltaBadge
            appearance="trend"
            value={delta}
            trend={trend}
            higherIsBetter={higherIsBetter}
          />
        ) : undefined
      }
    >
      {/* Título: `label` = subtitle2 do tema = 12,25px/600 (§2.2). */}
      <Text type="label" color="inherit">
        <ChartText value={label} scope={scope} />
      </Text>

      {resolved === 'loading' ? (
        <Skeleton height={28} radius={1} />
      ) : resolved === 'error' ? (
        <Banner
          data-slot="kpi-card-error"
          status="error"
          title={CHART_ERROR_MESSAGE}
          description={error}
        />
      ) : resolved === 'empty' ? (
        <Text type="supporting" color="inherit">
          <ChartText value={emptyMessage} scope={scope} />
        </Text>
      ) : (
        <HStack gap={1} vAlign="end" data-slot="kpi-card-value">
          {/*
            17,5px/700 — os px reais da referência (§2.2), que no tema são
            `--font-size-xl` e `--font-weight-bold`. Nenhum `type` semântico
            cai nesse par (o `display-3` desta escala é 16px/600), então a
            sobreposição é deliberada e não uma briga com o tema.
          */}
          <Text type="body" size="xl" weight="bold" color="inherit" hasTabularNumbers>
            {renderValue({ value, displayValue, prefix, scope })}
          </Text>
          {suffix ? (
            <Text type="label" color="inherit">
              <ChartText value={suffix} scope={scope} />
            </Text>
          ) : null}
        </HStack>
      )}

      {isSuccess && hint ? (
        <Text type="supporting" color="inherit">
          <ChartText value={hint} scope={scope} />
        </Text>
      ) : null}
    </SummaryCard>
  );
}

/**
 * O número em si. Três caminhos, em ordem de precedência:
 *  1. sem valor formatado → o número rola dígito a dígito (`AnimatedNumber`);
 *  2. valor formatado COM Markdown → `ChartText`, que é quem sabe renderizá-lo;
 *  3. valor formatado sem Markdown → interpola as `{{variaveis}}` e continua
 *     rolando: é o caso comum dos blocos, e perder a animação por causa de um
 *     contrato de texto que ninguém usou ali seria uma regressão gratuita.
 */
function renderValue({
  value,
  displayValue,
  prefix,
  scope,
}: Pick<KpiCardProps, 'value' | 'displayValue' | 'prefix' | 'scope'>): ReactNode {
  if (displayValue === undefined) {
    return (
      <>
        {prefix}
        <AnimatedNumber value={value ?? 0} />
      </>
    );
  }
  if (INLINE_MARKUP.test(displayValue)) {
    return <ChartText value={displayValue} scope={scope} />;
  }
  return (
    <AnimatedNumber
      value={value ?? 0}
      display={interpolateText(displayValue, scope ?? {})}
    />
  );
}
