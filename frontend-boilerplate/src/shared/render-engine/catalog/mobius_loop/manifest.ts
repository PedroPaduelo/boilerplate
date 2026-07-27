/**
 * Manifesto do bloco `mobius_loop` (layout/decorativo, sem dados) — ícone
 * animado de carregamento.
 *
 * A fita é um COMPONENTE PRÓPRIO do bloco (`./mobius-loop-icon`): o Astryx tem
 * `Spinner` e `Icon`, mas nenhum primitivo que faça morfose de traçado. Ela
 * pinta com `--color-accent` e para com `prefers-reduced-motion`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'mobius_loop',
  kind: 'layout',
  name: 'Möbius Loop',
  description:
    'Ícone animado (loop infinito) — ótimo como indicador de carregamento/processamento.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      size: { type: 'integer', minimum: 16, maximum: 240 },
      speed: { type: 'string', enum: ['slow', 'normal', 'fast'] },
    },
  },
  defaultProps: { size: 64, speed: 'normal' },
  version: '1.0.0',
} satisfies BlockManifest;
