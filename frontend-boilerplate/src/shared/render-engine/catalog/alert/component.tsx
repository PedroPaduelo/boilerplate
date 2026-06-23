/**
 * Bloco `alert` (narrativo) — usa o Vitrine `Alert`. Título + descrição vêm das
 * props; o ícone deriva da variante.
 */
import { Info, TriangleAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AlertProps = {
  variant?: 'default' | 'destructive';
  title?: string;
  description?: string;
};

export const Component: BlockComponent<AlertProps> = ({ props }) => {
  const Icon = props.variant === 'destructive' ? TriangleAlert : Info;
  return (
    <Alert variant={props.variant ?? 'default'}>
      <Icon className="size-4" />
      <AlertTitle>{props.title ?? 'Aviso'}</AlertTitle>
      {props.description ? <AlertDescription>{props.description}</AlertDescription> : null}
    </Alert>
  );
};

export const definition = defineBlock<AlertProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
