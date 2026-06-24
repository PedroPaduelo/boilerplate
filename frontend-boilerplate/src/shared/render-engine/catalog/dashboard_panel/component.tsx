/**
 * Bloco `dashboard_panel` — CONTAINER de layout. O `BlockRenderer` injeta o
 * sub-grid de filhos (já renderizados, grid de 12 colunas) via `children`; este
 * componente só desenha o shell (DashboardPanel com header + corpo) e coloca
 * `children` dentro.
 *
 * Quando sem `children` (galeria do catálogo), mostra um placeholder com
 * mini-cards de exemplo pra ilustrar a composição (grade de indicadores).
 */
import { DashboardPanel } from '@/components/ui/dashboard-panel';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DashboardPanelBlockProps = {
  title?: string;
  description?: string;
  variant?: 'card' | 'framed';
};

export const Component: BlockComponent<DashboardPanelBlockProps> = ({
  props,
  children,
}) => {
  const variant = props.variant ?? 'card';
  return (
    <DashboardPanel
      title={props.title ?? 'Painel'}
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
