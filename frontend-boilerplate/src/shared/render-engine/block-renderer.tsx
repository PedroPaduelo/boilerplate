/**
 * BlockRenderer — resolve `block.type` → `BlockDefinition` (registry) e renderiza
 * conciliando o estado dos DADOS (doc 20 / doc 03), com DUAS capacidades novas:
 *
 *  1) COMPOSIÇÃO RECURSIVA (hierarquia): se `block.blocks` existir, o bloco é um
 *     CONTAINER (ex.: `section`, `bento`). O BlockRenderer monta o sub-grid de
 *     12 colunas dos filhos (recursivo) e injeta como `children` no componente
 *     do container — que só desenha o "shell" (header + moldura).
 *
 *  2) ENCAPSULAMENTO VISUAL (frame): quando `framed`, blocos de VISUALIZAÇÃO
 *     (kind=chart, exceto KPIs/métricas que já são cards) são envolvidos no
 *     shell padrão `ChartWidget` — header (título + tipo) + corpo + footer
 *     (query SQL + duração). Padroniza todos os cards do dashboard.
 *
 * Estados (doc 32 §4): skeleton | loading | success | error | empty.
 */
import type { ReactNode } from 'react';
import type { Block, BlockDataResult, DashboardDataPayload } from '@dashboards/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartWidget } from '@/components/ui/chart-widget';
import { cn } from '@/shared/lib/utils';
import { getBlock } from './registry';
import type { BlockData, BlockRenderState } from './types';

export interface BlockRendererProps {
  /** Bloco do layout (do contrato LAYOUT). Pode ser folha ou container (`block.blocks`). */
  block: Block;
  /** Resultado de dados DESTE bloco (folha). Tem prioridade sobre `data`. */
  result?: BlockDataResult;
  /** Payload batch (map blockId→resultado) — usado p/ resolver filhos recursivamente. */
  data?: DashboardDataPayload;
  /**
   * Aplica o "frame" (shell `ChartWidget`) nos blocos de visualização. O dashboard
   * passa `true`; a GALERIA do catálogo passa `false` (ela já tem o próprio card).
   */
  framed?: boolean;
  className?: string;
}

/**
 * Blocos de dados que JÁ são cards próprios (KPIs/métricas/medidores) — NÃO
 * recebem o frame `ChartWidget` (evita card-dentro-de-card).
 */
const SELF_CONTAINED = new Set<string>([
  'kpi',
  'metric_glow',
  'stat_tile',
  'signal_card',
  'progress_bar',
  'progress_circle',
  'radial_gauge',
]);

function resolveState(
  hasDataContract: boolean,
  result: BlockDataResult | undefined,
): BlockRenderState {
  if (!hasDataContract) return 'success'; // narrativo / layout / container
  if (!result) return 'skeleton';
  switch (result.state) {
    case 'queued':
    case 'running':
      return 'loading';
    case 'error':
      return 'error';
    case 'idle':
      return 'skeleton';
    case 'success': {
      const d = result.data;
      const empty =
        d == null ||
        (Array.isArray(d) && d.length === 0) ||
        (typeof d === 'object' &&
          !Array.isArray(d) &&
          Object.keys(d as object).length === 0);
      return empty ? 'empty' : 'success';
    }
    default:
      return 'skeleton';
  }
}

/** Lê `meta.durationMs` de um BlockDataResult de forma segura (só existe no sucesso). */
function durationOf(result: BlockDataResult | undefined): number | undefined {
  if (result && typeof result === 'object' && 'meta' in result) {
    const meta = (result as { meta?: { durationMs?: number } }).meta;
    return meta?.durationMs;
  }
  return undefined;
}

export function BlockRenderer({
  block,
  result,
  data,
  framed = false,
  className,
}: BlockRendererProps) {
  const def = getBlock(block.type);

  // ----- tipo desconhecido (bloco ainda não implementado) -----
  if (!def) {
    return (
      <div
        data-slot="block-unknown"
        data-block-type={block.type}
        className={cn(
          'flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground',
          className,
        )}
      >
        Bloco não implementado: <code className="ml-1">{block.type}</code>
      </div>
    );
  }

  const Component = def.Component;
  const props = {
    ...((def.manifest.defaultProps as Record<string, unknown>) ?? {}),
    ...((block.props as Record<string, unknown>) ?? {}),
  };

  // ----- CONTAINER (composição recursiva: section / bento / ...) -----
  const childBlocks = Array.isArray(block.blocks) ? block.blocks : [];
  if (childBlocks.length > 0) {
    const childGrid = (
      <div data-slot="block-children" className="grid grid-cols-12 gap-4">
        {childBlocks.map((child) => {
          const span = child.span ?? 12;
          return (
            <div
              key={child.id}
              data-slot="block-child-cell"
              className="min-w-0"
              style={{ gridColumn: `span ${span} / span ${span}` }}
            >
              <BlockRenderer
                block={child}
                data={data}
                result={data?.blocks?.[child.id]}
                framed
              />
            </div>
          );
        })}
      </div>
    );
    return (
      <div
        data-slot="block"
        data-block-type={block.type}
        data-block-state="success"
        data-block-container="true"
        className={className}
      >
        <Component props={props} state="success" data={undefined}>
          {childGrid}
        </Component>
      </div>
    );
  }

  // ----- FOLHA -----
  const ownResult = result ?? data?.blocks?.[block.id];
  const hasDataContract = Boolean(def.manifest.dataContract);
  const state = resolveState(hasDataContract, ownResult);
  const dataVal =
    ownResult?.state === 'success' ? (ownResult.data as BlockData) : undefined;
  const error =
    ownResult?.state === 'error'
      ? (ownResult.error?.message ?? 'Erro ao carregar o bloco')
      : undefined;

  let body: ReactNode;
  if (state === 'skeleton' || state === 'loading') {
    body = <BlockSkeletonBody />;
  } else if (state === 'error') {
    body = (
      <div data-slot="block-error" className="text-sm text-destructive">
        {error}
      </div>
    );
  } else if (state === 'empty') {
    body = (
      <div data-slot="block-empty" className="text-sm text-muted-foreground">
        Sem dados
      </div>
    );
  } else {
    body = <Component props={props} data={dataVal} state="success" />;
  }

  // ----- FRAME (encapsulamento visual no padrão chart-widget) -----
  // Só blocos de VISUALIZAÇÃO (kind=chart) que NÃO são cards próprios (KPIs).
  const shouldFrame =
    framed && def.manifest.kind === 'chart' && !SELF_CONTAINED.has(block.type);

  if (shouldFrame) {
    const loading = state === 'skeleton' || state === 'loading';
    return (
      <div
        data-slot="block"
        data-block-type={block.type}
        data-block-state={state}
        className={className}
      >
        <ChartWidget
          title={block.title ?? def.manifest.name}
          query={block.dataBinding?.query}
          durationMs={durationOf(ownResult)}
          loading={loading}
        >
          {loading ? null : body}
        </ChartWidget>
      </div>
    );
  }

  return (
    <div
      data-slot="block"
      data-block-type={block.type}
      data-block-state={state}
      className={className}
    >
      {body}
    </div>
  );
}

function BlockSkeletonBody() {
  return (
    <div data-slot="block-skeleton" className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
