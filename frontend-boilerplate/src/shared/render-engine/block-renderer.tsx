/**
 * BlockRenderer — resolve `block.type` → `BlockDefinition` (registry) e
 * renderiza conciliando o estado dos DADOS (doc 20 / doc 03), com duas
 * capacidades além do "desenhar o componente":
 *
 *  1) COMPOSIÇÃO RECURSIVA (hierarquia): se `block.blocks` existir, o bloco é
 *     um CONTAINER (`grid`, `section`, `collapsible_block`, `sheet`). O
 *     BlockRenderer delega ao `BlockContainer`, que monta a GRADE dos filhos
 *     (recursiva, com as opções declaradas nas props do próprio container) e a
 *     injeta como `children` — o componente do container só desenha o "shell"
 *     (cabeçalho, superfície, disclosure).
 *
 *  2) ENCAPSULAMENTO VISUAL (frame): quando `framed`, blocos de VISUALIZAÇÃO
 *     (kind=chart, exceto KPIs/métricas que já são cards) são envolvidos no
 *     `BlockFrame` — header + corpo + takeaways + rodapé técnico.
 *
 * TAKEAWAYS: `def.deriveTakeaway?.(data)` pode devolver
 * `string | string[] | undefined`; a normalização vive em `block-state.ts`.
 *
 * Estados (doc 32 §4): skeleton | loading | success | error | empty — nenhum
 * deles é uma área em branco (ver `block-body.tsx`).
 */
import type { ReactNode } from 'react';
import type { Block, BlockDataResult, DashboardDataPayload } from '@dashboards/contracts';
import { resolveBlockPresentation } from '@dashboards/contracts';
import { Icon } from '@astryxdesign/core/Icon';
import { blockIcon } from '@/shared/ui';
import { BlockPlaceholder, BlockUnknown } from './block-body';
import { BlockBoundary } from './block-boundary';
import { BlockContainer } from './block-container';
import { BlockFrame, type BlockFrameTakeaway } from './block-frame';
import { chartBodyHeight, skeletonShapeFor } from './lib/block-sizing';
import {
  durationOf,
  explicitBlockText,
  explicitBlockTitle,
  normalizeTakeaway,
  resolveState,
  showSqlOf,
  takeawaysOf,
} from './block-state';
import { getBlock } from './registry';
import type { BlockData } from './types';

export interface BlockRendererProps {
  /** Bloco do layout (contrato LAYOUT). Pode ser folha ou container (`block.blocks`). */
  block: Block;
  /** Resultado de dados DESTE bloco (folha). Tem prioridade sobre `data`. */
  result?: BlockDataResult;
  /** Payload batch (map blockId→resultado) — resolve os filhos recursivamente. */
  data?: DashboardDataPayload;
  /**
   * Aplica a moldura (`BlockFrame`) nos blocos de visualização. O dashboard
   * passa `true`; a GALERIA do catálogo passa `false` (já tem o próprio card).
   */
  framed?: boolean;
  /**
   * Padrões de cor vindos do TEMA do dashboard (`layout.theme`). Valem só para
   * os blocos que não escolheram a sua — ver `applyThemeDefaults`.
   */
  themeDefaults?: { accent?: string; palette?: 'single' | 'multi' };
  className?: string;
}

/**
 * Aplica `accent`/`palette` do tema do dashboard SEM sobrescrever o que o
 * bloco declarou, e só quando o tipo de bloco realmente aceita a prop.
 *
 * As duas condições importam:
 *
 *  - "sem sobrescrever" porque o tema é o PADRÃO do dashboard, e a escolha mais
 *    específica (a do bloco) tem de vencer — é a mesma ordem de especificidade
 *    que já vale para altura (bloco > linha > derivação);
 *  - "só quando o tipo aceita" porque o `propsSchema` de cada bloco é validado:
 *    injetar `accent` num bloco que não o declara acrescentaria uma prop
 *    desconhecida — ruído no melhor caso, aviso de validação no pior.
 */
function applyThemeDefaults(
  props: Record<string, unknown>,
  propsSchema: unknown,
  defaults: { accent?: string; palette?: 'single' | 'multi' } | undefined,
): Record<string, unknown> {
  if (!defaults || (!defaults.accent && !defaults.palette)) return props;
  const accepted = (propsSchema as { properties?: Record<string, unknown> } | undefined)
    ?.properties;
  if (!accepted) return props;

  const next = { ...props };
  if (defaults.accent && accepted.accent && next.accent == null) {
    next.accent = defaults.accent;
  }
  if (defaults.palette && accepted.palette && next.palette == null) {
    next.palette = defaults.palette;
  }
  return next;
}

/**
 * Blocos de dados que JÁ são cards próprios (KPIs/métricas/medidores) — NÃO
 * recebem a moldura (evita card dentro de card).
 */
const SELF_CONTAINED = new Set<string>([
  'kpi',
  'metric_glow',
  'stat_tile',
  'signal_card',
  // funnel_stage desenha o próprio card colapsável (header + barra + tabela).
  'funnel_stage',
]);

/**
 * Cards SELF_CONTAINED cujo "título" do card é a prop `label` (ex.: o rótulo
 * acima do número do KPI). Para esses, o título do bloco/Chart vira o `label`
 * — senão o card cai no fallback genérico do componente ("KPI", "Sinal").
 */
const TITLE_AS_LABEL = new Set<string>([
  'kpi',
  'metric_glow',
  'stat_tile',
  'signal_card',
]);

/**
 * Realce de um card SELF_CONTAINED (KPI, ladrilho, medidor).
 *
 * Estes blocos não passam pelo `BlockFrame` — eles desenham o próprio `Card` —,
 * então `emphasis` não tinha por onde chegar neles. Isso era um buraco grande e
 * silencioso: "destaque de KPI" é justamente o caso mais comum do campo, e um
 * layout que pedia `emphasis: "featured"` num KPI não mudava um pixel.
 *
 * A variante alcança o CARD dentro do bloco sem que o motor precise conhecê-lo
 * pelo nome — mesma técnica (e mesma justificativa) do `CELL_FILL_CLASS` do
 * `block-grid`. Os valores saem de token, então acompanham claro e escuro.
 */
const SELF_CONTAINED_EMPHASIS: Record<string, string | undefined> = {
  featured: '[&>*]:border-[color:var(--color-accent)] [&>*]:shadow-[var(--shadow-med)]',
  // `muted` recua pelo fundo, que é o mesmo recurso que o `Card variant="muted"`
  // usa na moldura — hierarquia por peso, não por cor de categoria.
  muted: '[&>*]:bg-[var(--color-background-muted)]',
  default: undefined,
};

export function BlockRenderer({
  block,
  result,
  data,
  framed = false,
  themeDefaults,
  className,
}: BlockRendererProps) {
  const def = getBlock(block.type);
  if (!def) return <BlockUnknown type={block.type} className={className} />;

  const Component = def.Component;
  // Ordem de especificidade: padrão do TIPO → padrão do DASHBOARD → escolha do
  // BLOCO. O tema entra no meio de propósito: manda em quem não opinou, obedece
  // a quem opinou.
  const props = applyThemeDefaults(
    {
      ...((def.manifest.defaultProps as Record<string, unknown>) ?? {}),
      ...((block.props as Record<string, unknown>) ?? {}),
    },
    def.manifest.propsSchema,
    themeDefaults,
  );

  if (TITLE_AS_LABEL.has(block.type) && (props.label == null || props.label === '')) {
    const title = explicitBlockTitle(block);
    if (title) props.label = title;
  }

  // ----- CONTAINER (composição recursiva: grid / section / ...) -----
  const childBlocks = Array.isArray(block.blocks) ? block.blocks : [];
  if (childBlocks.length > 0) {
    // Renderiza UM filho com a moldura/estado certos. É o que a grade padrão do
    // `BlockContainer` usa em cada célula — e também a válvula de escape
    // (`renderChild`) para um container que precise dispor os filhos à mão.
    const renderChild = (child: Block): ReactNode => (
      <BlockRenderer block={child} data={data} result={data?.blocks?.[child.id]} framed />
    );
    return (
      <BlockBoundary type={block.type} resetKey={props}>
        <BlockContainer
          block={block}
          Component={Component}
          props={props}
          childBlocks={childBlocks}
          renderChild={renderChild}
          className={className}
        />
      </BlockBoundary>
    );
  }

  // ----- FOLHA -----
  const ownResult = result ?? data?.blocks?.[block.id];
  const state = resolveState(Boolean(def.manifest.dataContract), ownResult);
  const dataVal =
    ownResult?.state === 'success' ? (ownResult.data as BlockData) : undefined;

  // Corpo SEM moldura (cards próprios: KPI, ladrilho, medidor). Com moldura,
  // quem desenha os estados é o `BlockFrame` — assim o cabeçalho continua
  // legível enquanto o dado não chega.
  const body =
    state === 'success' ? (
      <Component props={props} data={dataVal} state="success" />
    ) : (
      <BlockPlaceholder
        state={state}
        error={
          ownResult?.state === 'error'
            ? (ownResult.error?.message ?? 'Erro ao carregar o bloco')
            : undefined
        }
      />
    );

  // ----- MOLDURA -----
  // Só blocos de VISUALIZAÇÃO (kind=chart) que NÃO são cards próprios.
  const shouldFrame =
    framed && def.manifest.kind === 'chart' && !SELF_CONTAINED.has(block.type);

  /*
   * APRESENTAÇÃO declarada no layout (ícone, unidade, ênfase). A LEITURA é do
   * contrato (`resolveBlockPresentation`) — normalização defensiva de um JSON
   * escrito por agente —, e aqui só se traduz o nome semântico para o ícone
   * real. O ícone tem fallback POR TIPO: um `bar_chart` sem `icon` declarado já
   * nasce com a âncora visual certa, sem o agente precisar dizer nada.
   */
  const presentation = resolveBlockPresentation(block);
  const HeaderIcon = blockIcon(presentation.icon, block.type);

  // Cards próprios não têm moldura para carregar a ênfase — o realce vai no
  // invólucro do bloco. Nos emoldurados, quem cuida disso é o `BlockFrame`.
  const emphasisClass = shouldFrame
    ? undefined
    : SELF_CONTAINED_EMPHASIS[presentation.emphasis];

  return (
    <div
      data-slot="block"
      data-block-type={block.type}
      data-block-state={state}
      data-block-emphasis={presentation.emphasis}
      className={[className, emphasisClass].filter(Boolean).join(' ') || undefined}
    >
      <BlockBoundary type={block.type} resetKey={ownResult ?? props}>
        {shouldFrame ? (
          <BlockFrame
            title={explicitBlockTitle(block) ?? def.manifest.name}
            subtitle={explicitBlockText(block, 'subtitle')}
            description={explicitBlockText(block, 'description')}
            emptyMessage={explicitBlockText(block, 'emptyMessage')}
            chartType={def.manifest.name}
            icon={HeaderIcon ? <Icon icon={HeaderIcon} color="secondary" /> : undefined}
            unit={presentation.unit}
            emphasis={presentation.emphasis}
            data={dataVal}
            query={block.dataBinding?.query}
            durationMs={durationOf(ownResult)}
            // A moldura desenha TODOS os estados: assim o cabeçalho continua
            // legível enquanto o dado não chega (ou quando ele falha), em vez
            // de o card inteiro sumir e voltar.
            state={frameState(state)}
            error={
              ownResult?.state === 'error'
                ? (ownResult.error?.message ?? 'Erro ao carregar o bloco')
                : undefined
            }
            bodyMinHeight={chartBodyHeight(block.type)}
            // Esqueleto com a SILHUETA do tipo: carregando, a tela já diz o que
            // está chegando em vez de virar uma parede de retângulos iguais.
            skeletonShape={skeletonShapeFor(block.type)}
            takeaways={frameTakeaways(block, def.deriveTakeaway, dataVal, state, props)}
            showQuery={showSqlOf(block)}
          >
            {state === 'success' ? (
              <Component props={props} data={dataVal} state="success" />
            ) : null}
          </BlockFrame>
        ) : (
          body
        )}
      </BlockBoundary>
    </div>
  );
}

/** Estado do render → estado da moldura (o `skeleton` do motor é carregamento). */
function frameState(state: string): 'success' | 'loading' | 'empty' | 'error' {
  if (state === 'skeleton' || state === 'loading') return 'loading';
  if (state === 'empty') return 'empty';
  if (state === 'error') return 'error';
  return 'success';
}

/**
 * Takeaways da moldura: duas fontes mescladas em ORDEM — as declaradas no
 * bloco antes das derivadas dos dados —, o que permite ao playground
 * sobrescrever o insight automático por bloco.
 */
function frameTakeaways(
  block: Block,
  derive:
    | ((data: BlockData, props: Record<string, unknown>) => string | string[] | undefined)
    | undefined,
  data: BlockData | undefined,
  state: string,
  props: Record<string, unknown>,
): BlockFrameTakeaway[] {
  const derived =
    state === 'success' && data != null ? normalizeTakeaway(derive?.(data, props)) : [];
  return [...takeawaysOf(block), ...derived];
}
