/**
 * Bloco `callout` (narrativo) — usa o Vitrine `CalloutTremor`. O ícone deriva da
 * variante semântica.
 */
import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react';
import { CalloutTremor } from '@/components/ui/callout-tremor';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type CalloutVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
type CalloutProps = {
  variant?: CalloutVariant;
  title?: string;
  description?: string;
};

const ICONS: Record<CalloutVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

export const Component: BlockComponent<CalloutProps> = ({ props }) => {
  const variant = props.variant ?? 'info';
  return (
    <CalloutTremor variant={variant} title={props.title ?? 'Observação'} icon={ICONS[variant]}>
      {props.description}
    </CalloutTremor>
  );
};

export const definition = defineBlock<CalloutProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
