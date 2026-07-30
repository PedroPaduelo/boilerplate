/**
 * Estado do domínio → vocabulário VISUAL do design system.
 *
 * Fica isolado porque é uma decisão de semântica de cor, não de layout: risco
 * crítico é `error`, campanha atrasada é `error`, autorregularizado é
 * `success`. Espalhar isso pelos componentes faria a mesma situação aparecer
 * vermelha numa tabela e âmbar na outra.
 */
import type { BadgeProps } from '@astryxdesign/core/Badge';
import type { StatusDotVariant } from '@astryxdesign/core/StatusDot';
import type { Desfecho, Risco, StatusMalha } from '../types';

type BadgeVariant = BadgeProps['variant'];

/** Prioridade do caso. */
export const VARIANTE_RISCO: Record<Risco, BadgeVariant> = {
  critico: 'error',
  alto: 'warning',
  medio: 'info',
  baixo: 'neutral',
};

/**
 * Desfecho da cobrança. Os três finais seguem a convenção do negócio:
 * retificou e pagou = verde, reconheceu sem pagar = âmbar, ignorou = neutro
 * (é o caso que vira ação fiscal, e vermelho aqui gritaria antes da hora).
 */
export const VARIANTE_DESFECHO: Record<Desfecho, StatusDotVariant> = {
  aguardando: 'neutral',
  notificado: 'accent',
  retificou: 'warning',
  regularizado: 'success',
  sem_resposta: 'error',
};

/** Situação da campanha. */
export const VARIANTE_STATUS_MALHA: Record<StatusMalha, BadgeVariant> = {
  gerando: 'info',
  em_dia: 'success',
  notificada: 'info',
  atrasada: 'error',
  finalizada: 'neutral',
};
