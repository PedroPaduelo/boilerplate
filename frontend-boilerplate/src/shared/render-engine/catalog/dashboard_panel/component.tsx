/**
 * Bloco `dashboard_panel` (layout) — usa o Vitrine `DashboardPanel`.
 */
import { DashboardPanel } from '@/components/ui/dashboard-panel';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DashboardPanelBlockProps = {
  title?: string;
  description?: string;
  body?: string;
  variant?: 'card' | 'framed';
};

export const Component: BlockComponent<DashboardPanelBlockProps> = ({ props }) => {
  const variant = props.variant ?? 'card';
  return (
    <DashboardPanel
      title={props.title ?? 'Painel'}
      description={props.description}
      variant={variant}
      bodyClassName={variant === 'framed' ? 'p-4' : undefined}
    >
      <p className="text-sm text-muted-foreground">{props.body ?? ''}</p>
    </DashboardPanel>
  );
};

export const definition = defineBlock<DashboardPanelBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
