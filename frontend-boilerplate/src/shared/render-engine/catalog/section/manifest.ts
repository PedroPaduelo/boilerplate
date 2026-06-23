/**
 * Manifesto do bloco `section` — CONTAINER RECURSIVO. Permite composição
 * hierárquica: uma seção que contém sub-blocos (KPIs, gráficos, textos e
 * até outras sub-seções). É a unidade de COMPOSIÇÃO que permite à IA montar
 * relatórios ricos com storytelling (sumário executivo → detalhamento → etc).
 *
 * Os sub-blocos são definidos em `block.blocks` (contrato recursivo) e injetados
 * como `children` pelo `BlockRenderer` num grid de 12 colunas.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'section',
  kind: 'layout',
  name: 'Seção (Container)',
  description:
    'Container hierárquico: agrupa sub-blocos num card com header (título + subtítulo) e corpo em grid de 12 colunas. Permite composição: seção dentro de seção, sumário executivo, etc.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: { type: 'string', description: 'Título da seção (header).' },
      subtitle: { type: 'string', description: 'Subtítulo / descrição curta.' },
      variant: {
        type: 'string',
        enum: ['card', 'framed'],
        description: "Estilo visual do container. Default: 'card'.",
      },
    },
  },
  defaultProps: {
    title: 'Seção',
    variant: 'card',
  },
  version: '1.0.0',
} satisfies BlockManifest;
