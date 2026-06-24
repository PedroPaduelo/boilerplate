/**
 * Bloco `section` — CONTAINER RECURSIVO. O `BlockRenderer` injeta o sub-grid
 * de filhos (já renderizados) via `children`; este componente só desenha o
 * shell (DashboardPanel com header + corpo) e coloca `children` dentro.
 *
 * ESPAÇAMENTO (após fix de duplicação de header):
 *   - variant="card" (default): `bodyClassName="pt-0"` — o `DashboardPanel`
 *     já tem `p-5` no card variant (respiro uniforme nas 4 bordas) + um
 *     `mb-4` entre o header e o `children`. O `pt-0` aqui evita o DUPLO
 *     respiro vertical entre header e corpo (5px do `mb-4` ficam ok).
 *   - variant="framed": header tem `border-b px-4 py-2.5` e o corpo é flush;
 *     mantemos `p-4` no body para o grid interno respirar.
 *
 * Quando sem `children` (galeria do catálogo), mostra um placeholder com 3
 * mini-cards de exemplo pra ilustrar a composição.
 */
import { DashboardPanel } from '@/components/ui/dashboard-panel';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SectionProps = {
  title?: string;
  subtitle?: string;
  variant?: 'card' | 'framed';
};

const Component: BlockComponent<SectionProps> = ({ props, children }) => {
  return (
    <DashboardPanel
      title={props.title ?? 'Seção'}
      description={props.subtitle}
      variant={props.variant ?? 'card'}
      bodyClassName={props.variant === 'framed' ? 'p-4' : 'pt-0'}
    >
      {children ?? <SectionPlaceholder />}
    </DashboardPanel>
  );
};

function SectionPlaceholder() {
  return (
    <div data-slot="section-placeholder" className="grid grid-cols-12 gap-3">
      {[
        { span: 4, label: 'KPI' },
        { span: 4, label: 'Gráfico' },
        { span: 4, label: 'Tabela' },
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

export const definition = defineBlock<SectionProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
