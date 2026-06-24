/**
 * Bloco `dashboard_panel` — CONTAINER de layout. O `BlockRenderer` injeta o
 * sub-grid de filhos (já renderizados, grid de 12 colunas) via `children`; este
 * componente só desenha o shell (DashboardPanel com header + corpo) e coloca
 * `children` dentro.
 *
 * QUANDO RENDERIZA O HEADER:
 *   - `title` EXPLICITO e não-vazio → renderiza header (DashboardPanel) com
 *     `title` + `description` opcional.
 *   - `title` ausente / vazio / igual ao default ("Painel" legado) → NÃO
 *     renderiza header; vira um WRAPPER PURO (borda + padding) só com o
 *     `children`. Isso evita o header DUPLICADO quando o painel já está
 *     aninhado dentro de uma `section` que tem o mesmo título.
 *
 * Quando sem `children` (galeria do catálogo), mostra um placeholder com
 * mini-cards de exemplo pra ilustrar a composição (grade de indicadores).
 */
import { DashboardPanel } from '@/components/ui/dashboard-panel';
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DashboardPanelBlockProps = {
  title?: string;
  description?: string;
  variant?: 'card' | 'framed';
};

/** Títulos "default" herdados — se o autor não trocou, escondemos o header. */
const DEFAULT_TITLES = new Set(['Painel']);

function isExplicitTitle(raw: string | undefined): boolean {
  if (raw == null) return false;
  const t = raw.trim();
  if (t.length === 0) return false;
  if (DEFAULT_TITLES.has(t)) return false;
  return true;
}

export const Component: BlockComponent<DashboardPanelBlockProps> = ({
  props,
  children,
}) => {
  const variant = props.variant ?? 'card';
  const hasTitle = isExplicitTitle(props.title);
  const hasDescription =
    typeof props.description === 'string' && props.description.trim().length > 0;

  // Sem header explícito → wrapper PURO (borda + padding + grid interno).
  if (!hasTitle && !hasDescription) {
    return (
      <div
        data-slot="dashboard-panel-body-only"
        data-dashboard-panel-variant={variant}
        className={cn(
          'rounded-xl border border-border bg-card',
          variant === 'framed' ? 'p-0' : 'p-4 shadow-sm',
        )}
      >
        {children ?? <DashboardPanelPlaceholder />}
      </div>
    );
  }

  return (
    <DashboardPanel
      title={props.title!}
      description={props.description}
      variant={variant}
      bodyClassName={variant === 'framed' ? 'p-4' : 'pt-2'}
    >
      {children ?? <DashboardPanelPlaceholder />}
    </DashboardPanel>
  );
};

/** Placeholder (sem filhos) — comunica o conceito de grade de indicadores. */
function DashboardPanelPlaceholder() {
  return (
    <div data-slot="dashboard-panel-placeholder" className="grid grid-cols-12 gap-3">
      {[
        { span: 3, label: 'KPI' },
        { span: 3, label: 'KPI' },
        { span: 3, label: 'KPI' },
        { span: 3, label: 'KPI' },
        { span: 8, label: 'Gráfico' },
        { span: 4, label: 'Donut' },
      ].map((item, i) => (
        <div
          key={i}
          className="col-span-12"
          style={{ gridColumn: `span ${item.span} / span ${item.span}` }}
        >
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export const definition = defineBlock<DashboardPanelBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
