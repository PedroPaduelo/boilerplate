/**
 * BlockRenderer — resolve `block.type` → `BlockDefinition` (registry) e
 * renderiza conciliando o estado dos DADOS (doc 20 / doc 03), com duas
 * capacidades além do "desenhar o componente":
 *
 *  1) COMPOSIÇÃO RECURSIVA (hierarquia): se `block.blocks` existir, o bloco é
 *     um CONTAINER (ex.: `section`, `bento`). O BlockRenderer monta o sub-grid
 *     de 12 colunas dos filhos (recursivo) e o injeta como `children` no
 *     componente do container — que só desenha o "shell" (header + moldura).
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
import { BlockContainer } from './block-container';
import { BlockFrame, type BlockFrameTakeaway } from './block-frame';
import {
  durationOf,
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

  // ----- CONTAINER (composição recursiva: section / bento / ...) -----
  const childBlocks = Array.isArray(block.blocks) ? block.blocks : [];
  if (childBlocks.length > 0) {
    // Renderiza UM filho com a moldura/estado certos. Containers que dispõem
    // os filhos manualmente (bento, resizable, expandable) usam `renderChild`;
    // o grid padrão de 12 colunas do `BlockContainer` também.
    const renderChild = (child: Block): ReactNode => (
      <BlockRenderer block={child} data={data} result={data?.blocks?.[child.id]} framed />
    );
    return (
      <BlockContainer
        block={block}
        Component={Component}
        props={props}
        childBlocks={childBlocks}
        renderChild={renderChild}
        className={className}
      />
    );
  }

  // ----- FOLHA -----
  const ownResult = result ?? data?.blocks?.[block.id];
  const state = resolveState(Boolean(def.manifest.dataContract), ownResult);
  const dataVal =
    ownResult?.state === 'success' ? (ownResult.data as BlockData) : undefined;
  const isLoading = state === 'skeleton' || state === 'loading';

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
      {shouldFrame ? (
        <BlockFrame
          title={explicitBlockTitle(block) ?? def.manifest.name}
          chartType={def.manifest.name}
          query={block.dataBinding?.query}
          durationMs={durationOf(ownResult)}
          isLoading={isLoading}
          takeaways={frameTakeaways(block, def.deriveTakeaway, dataVal, state)}
          showQuery={showSqlOf(block)}
        >
          {isLoading ? null : body}
        </BlockFrame>
      ) : (
        body
      )}
    </div>
  );
}

/**
 * Takeaways da moldura: duas fontes mescladas em ORDEM — as declaradas no
 * bloco antes das derivadas dos dados —, o que permite ao playground
 * sobrescrever o insight automático por bloco.
 */
function frameTakeaways(
  block: Block,
  derive: ((data: BlockData) => string | string[] | undefined) | undefined,
  data: BlockData | undefined,
  state: string,
): BlockFrameTakeaway[] {
  const derived =
    state === 'success' && data != null ? normalizeTakeaway(derive?.(data)) : [];
  return [...takeawaysOf(block), ...derived];
}
