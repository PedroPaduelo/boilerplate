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
 *     shell padrão `ChartWidget` — header (título + tipo) + corpo + rodapé
 *     (takeaways + query SQL + duração). Padroniza todos os cards do dashboard.
 *
 * TAKEAWAYS (canônico): `def.deriveTakeaway?.(data)` pode retornar
 *   `string | string[] | undefined`. O BlockRenderer normaliza p/ o array
 *   `{ enabled: true, text: ... }[]` que o `ChartWidget` aceita. Cada string
 *   vira uma linha com lâmpada; `undefined`/vazio = nenhuma linha.
 *
 * Estados (doc 32 §4): skeleton | loading | success | error | empty.
 */
import type { ReactNode } from 'react';
import type { Block, BlockDataResult, DashboardDataPayload } from '@dashboards/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartWidget,
  type ChartWidgetTakeaway,
} from '@/components/ui/chart-widget';
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
  // funnel_stage desenha o próprio card colapsável (header + barra + tabela).
  'funnel_stage',
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

/** Lê `block.takeaways` (lista editável pelo playground) de forma segura. */
function takeawaysOf(
  block: Block,
): ChartWidgetTakeaway[] | undefined {
  const raw = (block as { takeaways?: unknown }).takeaways;
  if (!Array.isArray(raw)) return undefined;
  // Filtra silenciosamente entradas malformadas (não é string/não tem enabled).
  return raw
    .map((t): ChartWidgetTakeaway | null => {
      if (t == null || typeof t !== 'object') return null;
      const obj = t as { enabled?: unknown; text?: unknown };
      if (typeof obj.text !== 'string') return null;
      return {
        enabled: Boolean(obj.enabled),
        text: obj.text,
      };
    })
    .filter((t): t is ChartWidgetTakeaway => t !== null);
}

/** Normaliza o retorno de `deriveTakeaway` (string | string[] | undefined)
 *  para o array que o ChartWidget consome. Aceita retrocompat: `string` vira
 *  `[{ enabled: true, text }]`. */
function normalizeTakeaway(
  raw: string | string[] | undefined,
): ChartWidgetTakeaway[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => ({ enabled: true, text: s }));
  }
  // string (legado) → 1 item
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  return [{ enabled: true, text: trimmed }];
}

/** Lê `block.showSql` (boolean) — `undefined` significa "default = true". */
function showSqlOf(block: Block): boolean {
  const raw = (block as { showSql?: unknown }).showSql;
  if (typeof raw === 'boolean') return raw;
  return true;
}

/**
 * Título EXPLÍCITO do bloco (sem fallback). Prioridade:
 *  1. `block.title` (o backend o preenche com o título do Chart referenciado;
 *     o autor também pode definir um título custom no bloco);
 *  2. `block.props.title` (rede de segurança — ex.: título setado via props).
 * Retorna `undefined` quando não há título explícito (o chamador decide o fallback).
 */
function explicitBlockTitle(block: Block): string | undefined {
  const title = (block as { title?: unknown }).title;
  if (typeof title === 'string' && title.trim().length > 0) return title;
  const propsTitle = (block.props as { title?: unknown } | undefined)?.title;
  if (typeof propsTitle === 'string' && propsTitle.trim().length > 0) {
    return propsTitle;
  }
  return undefined;
}

/** Título do bloco com fallback (ex.: nome genérico do tipo: "Barras Horizontais"). */
function resolveBlockTitle(block: Block, fallback: string): string {
  return explicitBlockTitle(block) ?? fallback;
}

/**
 * Cards SELF_CONTAINED cujo "título" do card é a prop `label` (ex.: o rótulo
 * em cima do número do KPI). Para esses, o título do bloco/Chart deve virar o
 * `label` — senão o card cai no fallback genérico do componente (ex.: "KPI",
 * "Sinal"). Só injetamos quando o autor NÃO definiu um `label` explícito.
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

  // Cards SELF_CONTAINED com título-via-`label` (KPI, métricas): se o autor não
  // setou um `label` explícito, usa o título do bloco/Chart como rótulo do card
  // — assim o KPI mostra "Universo lançado (N1)" em vez do genérico "KPI".
  if (
    TITLE_AS_LABEL.has(block.type) &&
    (props.label == null || props.label === '')
  ) {
    const title = explicitBlockTitle(block);
    if (title) props.label = title;
  }

  // ----- CONTAINER (composição recursiva: section / bento / ...) -----
  const childBlocks = Array.isArray(block.blocks) ? block.blocks : [];
  if (childBlocks.length > 0) {
    // Renderiza UM filho com a moldura/estado certos. Os containers que
    // dispõem os filhos manualmente (bento, resizable, expandable) usam esta
    // função via `renderChild`; o grid padrão abaixo também a usa.
    const renderChild = (child: Block): ReactNode => (
      <BlockRenderer
        block={child}
        data={data}
        result={data?.blocks?.[child.id]}
        framed
      />
    );
    // Grid PADRÃO de 12 colunas (retrocompat — `section`/`dashboard_panel`
    // usam via `children`). `span` = largura (1..12); `rowSpan` (opcional,
    // default 1) = altura, para layouts mosaico/bento.
    const childGrid = (
      <div data-slot="block-children" className="grid grid-cols-12 gap-4">
        {childBlocks.map((child) => {
          const span = child.span ?? 12;
          const rowSpan = (child as { rowSpan?: number }).rowSpan ?? 1;
          return (
            <div
              key={child.id}
              data-slot="block-child-cell"
              className="min-w-0"
              style={{
                gridColumn: `span ${span} / span ${span}`,
                gridRow: rowSpan > 1 ? `span ${rowSpan} / span ${rowSpan}` : undefined,
              }}
            >
              {renderChild(child)}
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
        <Component
          props={props}
          state="success"
          data={undefined}
          childBlocks={childBlocks}
          renderChild={renderChild}
        >
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
    // Takeaways: 2 fontes, mescladas em ORDEM (takeaways explícitas primeiro
    // → derivadas do bloco depois). Isso permite o playground sobrescrever
    // o `deriveTakeaway` por bloco. Filtra por enabled no ChartWidget.
    const blockTakeaways = takeawaysOf(block) ?? [];
    const derivedTakeaways =
      state === 'success' && dataVal != null
        ? normalizeTakeaway(def.deriveTakeaway?.(dataVal))
        : [];
    const allTakeaways: ChartWidgetTakeaway[] = [
      ...blockTakeaways,
      ...derivedTakeaways,
    ];
    const showSql = showSqlOf(block);
    return (
      <div
        data-slot="block"
        data-block-type={block.type}
        data-block-state={state}
        className={className}
      >
        <ChartWidget
          title={resolveBlockTitle(block, def.manifest.name)}
          chartType={def.manifest.name}
          query={block.dataBinding?.query}
          durationMs={durationOf(ownResult)}
          loading={loading}
          takeaways={allTakeaways}
          showSql={showSql}
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