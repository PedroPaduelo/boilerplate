/**
 * Manifesto do bloco `flip_words` (título animado, sem dados) — cicla palavras
 * com animação.
 *
 * A troca é um COMPONENTE PRÓPRIO do bloco (`./flip-words`): o Astryx só tem
 * tipografia estática. A palavra usa a cor de acento do tema, herda o tamanho
 * do `Heading` e o ciclo desliga com `prefers-reduced-motion` (a lista inteira
 * continua exposta a leitores de tela).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'flip_words',
  kind: 'title',
  name: 'Flip Words',
  description:
    'Título com palavra que troca animadamente — ótimo para capas/headers de relatório.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['words'],
    properties: {
      prefix: { type: 'string' },
      words: { type: 'array', items: { type: 'string' } },
      duration: { type: 'integer', minimum: 500 },
    },
  },
  defaultProps: {
    prefix: 'Dados que são',
    words: ['claros', 'rápidos', 'acionáveis'],
    duration: 2200,
  },
  version: '1.0.0',
} satisfies BlockManifest;
