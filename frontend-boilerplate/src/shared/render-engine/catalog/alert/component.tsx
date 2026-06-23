/**
 * Bloco `alert` (narrativo) — usa o Vitrine `Alert`. Título + descrição vêm das
 * props; o ícone deriva da variante semântica.
 *
 * Props (ver manifest):
 *  - `variant`     — default | info | success | warning | error | destructive
 *                    (cor + ícone).
 *  - `title`       — título (required).
 *  - `description` — corpo (opcional).
 *  - `showIcon`    — mostra/oculta o ícone semântico (default true).
 *  - `dismissible` — adiciona um X que fecha o alerta (estado local).
 */
import { useState } from 'react';
import {
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  CircleAlert,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AlertVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'destructive';

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  showIcon?: boolean;
  dismissible?: boolean;
};

/** Ícone semântico (lucide-react) por variante. */
const ICON_BY_VARIANT: Record<AlertVariant, LucideIcon> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  destructive: CircleAlert,
};

export const Component: BlockComponent<AlertProps> = ({ props }) => {
  const variant: AlertVariant = props.variant ?? 'default';
  const showIcon = props.showIcon ?? true;
  const dismissible = props.dismissible ?? false;
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const Icon = ICON_BY_VARIANT[variant] ?? Info;

  return (
    <Alert variant={variant} className={cn(dismissible && 'pr-10')}>
      {showIcon ? <Icon className="size-4" /> : null}
      <AlertTitle>{props.title ?? 'Aviso'}</AlertTitle>
      {props.description ? <AlertDescription>{props.description}</AlertDescription> : null}
      {dismissible ? (
        <button
          type="button"
          aria-label="Fechar alerta"
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      ) : null}
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
