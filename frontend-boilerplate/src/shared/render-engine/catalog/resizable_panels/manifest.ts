/**
 * Manifesto do bloco `resizable_panels` — CONTAINER de layout em painéis
 * arrastáveis (split com divisória redimensionável).
 *
 * Cada SUB-BLOCO (`block.blocks`) vira UM painel; entre os painéis há uma
 * divisória (handle) que o usuário arrasta para redimensionar. A composição
 * segue o contrato unificado de container — `block.blocks` (mesma sintaxe de
 * `section`/`bento_grid`/dashboard). As props deste bloco são de CONFIGURAÇÃO
 * DO LAYOUT (não de conteúdo): `direction` e `defaultSizes`.
 *
 * Exemplo (IA via MCP) — filtros à esquerda, resultado à direita:
 *   { type:'resizable_panels', props:{ direction:'horizontal', defaultSizes:[30,70] },
 *     blocks:[
 *       { type:'donut',     dataBinding:{...} },
 *       { type:'bar_chart', dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'resizable_panels',
  kind: 'layout',
  name: 'Painéis Redimensionáveis',
  description:
    'Container de layout em painéis arrastáveis (split). Cada sub-bloco (`block.blocks`) vira um painel; uma divisória entre eles permite redimensionar. Suporta 2+ painéis. Props: direction (horizontal|vertical), defaultSizes (% inicial de cada painel).',
  source: 'vitrine:resizable',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      direction: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description:
          'Direção do split: `horizontal` = painéis lado a lado (divisória vertical, arrasta na largura); `vertical` = painéis empilhados (divisória horizontal, arrasta na altura). Default: horizontal.',
      },
      defaultSizes: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 100 },
        description:
          'Tamanho INICIAL de cada painel, em porcentagem (ex.: [30, 70]). A ordem casa com a ordem de `block.blocks`. Idealmente soma 100. Se ausente (ou tamanho diferente do número de filhos), os painéis são divididos igualmente.',
      },
    },
  },
  defaultProps: {
    direction: 'horizontal',
  },
  version: '2.0.0',
} satisfies BlockManifest;
