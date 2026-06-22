/**
 * DashboardRenderer — motor de render base (doc 03 / doc 32 §4).
 *
 * Recebe um `DashboardLayout` ({ filters, rows }) + (opcional) o payload de
 * DADOS batch e renderiza a tela: barra de filtros (esqueleto) + grid de
 * rows/blocos (12 colunas, `span` por bloco). Cada bloco é resolvido pelo
 * registry via `BlockRenderer`. Enquanto T-I não implementa os blocos reais,
 * tipos desconhecidos caem no placeholder — a tela inteira renderiza sem crashar.
 */
import type {
  DashboardLayout,
  DashboardDataPayload,
  Filter,
  Row,
  Block,
} from '@dashboards/contracts';
import { cn } from '@/shared/lib/utils';
import { BlockRenderer } from './block-renderer';

export interface DashboardRendererProps {
  layout: DashboardLayout;
  /** Payload de dados batch (mapa blockId → resultado). Opcional. */
  data?: DashboardDataPayload;
  className?: string;
}

export function DashboardRenderer({ layout, data, className }: DashboardRendererProps) {
  return (
    <div data-slot="dashboard" className={cn('flex flex-col gap-6', className)}>
      {layout.filters.length > 0 ? (
        <div
          data-slot="dashboard-filters"
          className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          {layout.filters.map((f: Filter) => (
            <span
              key={f.id}
              data-slot="dashboard-filter"
              data-filter-type={f.type}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
            >
              {f.label ?? f.id}
            </span>
          ))}
        </div>
      ) : null}

      {layout.rows.map((row: Row) => (
        <section key={row.id} data-slot="dashboard-row" className="flex flex-col gap-3">
          {row.title ? (
            <h2 className="text-lg font-semibold text-foreground">{row.title}</h2>
          ) : null}
          <div className="grid grid-cols-12 gap-4">
            {row.blocks.map((block: Block) => {
              const span = block.span ?? 12;
              return (
                <div
                  key={block.id}
                  data-slot="dashboard-cell"
                  style={{ gridColumn: `span ${span} / span ${span}` }}
                >
                  <BlockRenderer block={block} result={data?.blocks?.[block.id]} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
