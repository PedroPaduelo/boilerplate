/**
 * Manifesto do bloco `mobius_loop` (layout/decorativo, sem dados) — ícone
 * animado de carregamento. Usa o Vitrine `MobiusLoopIcon`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'mobius_loop',
  kind: 'layout',
  name: 'Möbius Loop',
  description: 'Ícone animado (loop infinito) — ótimo como indicador de carregamento/processamento.',
  source: 'vitrine:mobius-loop-icon',
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
