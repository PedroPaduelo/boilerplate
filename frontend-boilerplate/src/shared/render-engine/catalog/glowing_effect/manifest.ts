/**
 * Manifesto do bloco `glowing_effect` (layout) — borda com brilho que reage ao
 * ponteiro, envolvendo um card. Usa o Vitrine `GlowingEffect`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'glowing_effect',
  kind: 'layout',
  name: 'Efeito de Brilho',
  description: 'Borda com brilho que reage ao ponteiro — destaca um card.',
  source: 'vitrine:glowing-effect',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      variant: { type: 'string', enum: ['default', 'white'] },
    },
  },
  defaultProps: {
    title: 'Painel em destaque',
    description: 'Passe o mouse sobre o card para ativar o brilho.',
    variant: 'default',
  },
  version: '1.0.0',
} satisfies BlockManifest;
