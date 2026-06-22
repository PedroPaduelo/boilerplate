/**
 * BlockRenderer — resolve `block.type` → `BlockDefinition` (via registry) e
 * renderiza o componente conciliando o estado dos DADOS (doc 20 / doc 03).
 *
 * Estados (doc 32 §4): skeleton | loading | success | error | empty.
 * - Blocos narrativos (sem `dataContract`: title/rich_text) renderizam direto.
 * - Blocos de dados dependem do `BlockDataResult` (fixtures de @dashboards/contracts
 *   enquanto T-C/execução real não existe).
 * - Tipo desconhecido (bloco ainda não implementado por T-I) → placeholder.
 */
import type { ReactNode } from 'react';
import type { Block, BlockDataResult } from '@dashboards/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { getBlock } from './registry';
import type { BlockData, BlockRenderState } from './types';

export interface BlockRendererProps {
  /** Bloco do layout (do contrato LAYOUT). */
  block: Block;
  /** Resultado de dados do bloco (do payload batch / socket). Opcional. */
  result?: BlockDataResult;
  className?: string;
}

function resolveState(
  hasDataContract: boolean,
  result: BlockDataResult | undefined,
): BlockRenderState {
  if (!hasDataContract) return 'success'; // narrativo (title / rich_text)
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

export function BlockRenderer({ block, result, className }: BlockRendererProps) {
  const def = getBlock(block.type);

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

  const hasDataContract = Boolean(def.manifest.dataContract);
  const state = resolveState(hasDataContract, result);
  const props = {
    ...((def.manifest.defaultProps as Record<string, unknown>) ?? {}),
    ...((block.props as Record<string, unknown>) ?? {}),
  };
  const data = result?.state === 'success' ? (result.data as BlockData) : undefined;
  const error =
    result?.state === 'error'
      ? (result.error?.message ?? 'Erro ao carregar o bloco')
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
    const Component = def.Component;
    body = <Component props={props} data={data} state="success" />;
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
