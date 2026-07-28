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
import { BlockPlaceholder, BlockUnknown } from './block-body';
import { BlockBoundary } from './block-boundary';
import { BlockContainer } from './block-container';
import { BlockFrame, type BlockFrameTakeaway } from './block-frame';
import { chartBodyHeight } from './lib/block-sizing';
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
  className?: string;
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

export function BlockRenderer({
  block,
  result,
  data,
  framed = false,
  className,
}: BlockRendererProps) {
  const def = getBlock(block.type);
  if (!def) return <BlockUnknown type={block.type} className={className} />;

  const Component = def.Component;
  const props = {
    ...((def.manifest.defaultProps as Record<string, unknown>) ?? {}),
    ...((block.props as Record<string, unknown>) ?? {}),
  };

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

  return (
    <div
      data-slot="block"
      data-block-type={block.type}
      data-block-state={state}
      className={className}
    >
      <BlockBoundary type={block.type} resetKey={ownResult ?? props}>
        {shouldFrame ? (
          <BlockFrame
            title={explicitBlockTitle(block) ?? def.manifest.name}
            subtitle={explicitBlockText(block, 'subtitle')}
            description={explicitBlockText(block, 'description')}
            emptyMessage={explicitBlockText(block, 'emptyMessage')}
            chartType={def.manifest.name}
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
