/**
 * Bloco `alert` (narrativo) — mensagem persistente em contexto: o `Banner` do
 * Astryx.
 *
 * COR E ÍCONE NÃO SÃO ESCOLHA DO BLOCO: derivam do `status` do Banner (o
 * contrato semântico do DS). A `variant` do manifesto é apenas traduzida para
 * esse status — nenhuma cor é declarada aqui.
 *
 * Props (ver manifest):
 *  - `variant`     — default | info | success | warning | error | destructive.
 *  - `title`       — título (required).
 *  - `description` — corpo (opcional).
 *  - `showIcon`    — `false` esvazia o slot do ícone (`icon={false}`), sem
 *                    esconder o banner.
 *  - `dismissible` — liga o botão de fechar NATIVO do Banner, que já se
 *                    auto-oculta ao ser acionado (por isso não há mais estado
 *                    local de visibilidade neste bloco).
 */
import { Banner } from '@astryxdesign/core/Banner';
import type { BannerStatus } from '@astryxdesign/core/Banner';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'error' | 'destructive';

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  showIcon?: boolean;
  dismissible?: boolean;
};

/**
 * Variante semântica do bloco → `status` do Banner (que resolve cor + ícone).
 * `default` cai em `info` (aviso neutro) e `destructive` em `error` — o DS não
 * separa "erro" de "destrutivo" no Banner: os dois são a mesma severidade.
 */
const STATUS_BY_VARIANT: Record<AlertVariant, BannerStatus> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  destructive: 'error',
};

export const Component: BlockComponent<AlertProps> = ({ props }) => {
  const variant: AlertVariant = props.variant ?? 'default';
  const showIcon = props.showIcon ?? true;

  return (
    <Banner
      data-slot="alert"
      data-alert-variant={variant}
      status={STATUS_BY_VARIANT[variant] ?? 'info'}
      title={props.title ?? 'Aviso'}
      description={props.description}
      icon={showIcon ? undefined : false}
      isDismissable={props.dismissible ?? false}
    />
  );
};

export const definition = defineBlock<AlertProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
