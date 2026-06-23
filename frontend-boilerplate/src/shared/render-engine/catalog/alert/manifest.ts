/**
 * Manifesto do bloco `alert` (narrativo, sem dados) — aviso/destaque. Usa o
 * Vitrine `Alert` + `AlertTitle`/`AlertDescription`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'alert',
  kind: 'text',
  name: 'Alerta',
  description: 'Aviso/observação em destaque (título + descrição), com variante de cor.',
  source: 'vitrine:alert',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      variant: { type: 'string', enum: ['default', 'destructive'] },
      title: { type: 'string' },
      description: { type: 'string' },
    },
  },
  defaultProps: {
    variant: 'default',
    title: 'Atenção',
    description: 'A inadimplência da zona Leste ultrapassou 30% no período.',
  },
  version: '1.0.0',
} satisfies BlockManifest;
