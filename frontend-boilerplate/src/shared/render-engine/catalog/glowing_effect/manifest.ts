/**
 * Manifesto do bloco `glowing_effect` (layout) — borda com brilho que reage ao
 * ponteiro, envolvendo um card.
 *
 * O anel é um COMPONENTE PRÓPRIO do bloco (`./glowing-effect`): o Astryx só
 * trata hover/foco com estados discretos. `variant` escolhe a paleta —
 * `default` usa a rampa de data-viz do tema, `white` é monocromático
 * (`--color-text-primary`). O giro desliga com `prefers-reduced-motion`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'glowing_effect',
  kind: 'layout',
  name: 'Efeito de Brilho',
  description: 'Borda com brilho que reage ao ponteiro — destaca um card.',
  source: 'custom',
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
