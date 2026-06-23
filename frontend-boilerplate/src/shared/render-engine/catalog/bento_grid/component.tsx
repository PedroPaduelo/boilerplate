/**
 * Bloco `bento_grid` — CONTAINER de layout em mosaico "bento".
 *
 * Usa o mecanismo de container do render-engine: o `BlockRenderer` injeta
 * `childBlocks` (sub-blocos crus) + `renderChild` (renderiza 1 filho). Este
 * componente DISPÕE os filhos num grid de N colunas, em mosaico — cada filho
 * ocupa `span` colunas (largura, 1..12) e `rowSpan` linhas (altura). Assim a
 * IA monta `block.blocks` com a MESMA sintaxe do dashboard/section, e o bento
 * vira o mosaico (1 destaque grande + vários menores).
 *
 * Sem filhos (galeria do catálogo), mostra um placeholder ilustrativo do
 * mosaico (células de tamanhos variados) para comunicar o conceito.
 */
import type { Block } from '@dashboards/contracts';
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type Gap = 'sm' | 'md' | 'lg';
type BentoGridProps = {
  columns?: number;
  gap?: Gap;
  autoRows?: Gap;
};

const GAP_CLASS: Record<Gap, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};
const AUTO_ROWS_CLASS: Record<Gap, string> = {
  sm: '[grid-auto-rows:8rem]',
  md: '[grid-auto-rows:11rem]',
  lg: '[grid-auto-rows:14rem]',
};

/** Tipo do filho com `rowSpan` (extensão do contrato Block; default 1). */
type ChildBlock = Block & { rowSpan?: number };

export const Component: BlockComponent<BentoGridProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const columns = Math.min(12, Math.max(1, props.columns ?? 12));
  const gap = GAP_CLASS[props.gap ?? 'md'];
  const autoRows = AUTO_ROWS_CLASS[props.autoRows ?? 'md'];

  // Sem filhos → placeholder ilustrativo (catálogo/galeria).
  if (!childBlocks?.length || !renderChild) {
    return <BentoPlaceholder columns={columns} gap={gap} autoRows={autoRows} />;
  }

  return (
    <div
      data-slot="bento-grid"
      className={cn('grid', gap, autoRows)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {(childBlocks as ChildBlock[]).map((child) => {
        const span = Math.min(columns, Math.max(1, child.span ?? columns));
        const rowSpan = Math.max(1, child.rowSpan ?? 1);
        return (
          <div
            key={child.id}
            data-slot="bento-cell"
            className="min-w-0"
            style={{
              gridColumn: `span ${span} / span ${span}`,
              gridRow: `span ${rowSpan} / span ${rowSpan}`,
            }}
          >
            {renderChild(child)}
          </div>
        );
      })}
    </div>
  );
};

/** Placeholder do mosaico (sem filhos) — comunica o conceito na galeria. */
function BentoPlaceholder({
  columns,
  gap,
  autoRows,
}: {
  columns: number;
  gap: string;
  autoRows: string;
}) {
  // Mosaico ilustrativo: 1 destaque grande + 4 menores.
  const cells = [
    { span: Math.ceil(columns / 2), rowSpan: 2, label: 'Gráfico em destaque' },
    { span: Math.floor(columns / 2), rowSpan: 1, label: 'KPI' },
    { span: Math.floor(columns / 2), rowSpan: 1, label: 'Donut' },
    { span: Math.floor(columns / 3), rowSpan: 1, label: 'Tabela' },
    { span: columns - Math.floor(columns / 3), rowSpan: 1, label: 'Linha' },
  ];
  return (
    <div
      data-slot="bento-grid-placeholder"
      className={cn('grid', gap, autoRows)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-xl border border-dashed border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-xs text-muted-foreground"
          style={{
            gridColumn: `span ${Math.min(columns, Math.max(1, c.span))} / span ${Math.min(columns, Math.max(1, c.span))}`,
            gridRow: `span ${c.rowSpan} / span ${c.rowSpan}`,
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

export const definition = defineBlock<BentoGridProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
