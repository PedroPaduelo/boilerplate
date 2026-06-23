/**
 * Manifesto do bloco `metric_glow` (shape 'scalar') — card de métrica com brilho.
 * Usa o Vitrine `MetricGlowCard`.
 *
 * Props (padrão canônico do catálogo — ver `h_bar_chart`):
 *  - `label`: sobrescreve o título do card (default: `data.label` → manifest.name).
 *  - `valueFormat`: ENUM FECHADO (5 formatos canônicos do DS) — casa 1:1 com
 *    `formatValueByEnum()` de `format.ts`. Substitui o `toLocaleString` cru.
 *  - `accent`: cor do brilho (enum DS + classe Tailwind + cor CSS), resolvido
 *    em runtime por `resolveAccent()`.
 *  - `showDelta`: liga/desliga a variação (%).
 *  - `deltaPolarity`: inverte a semântica verde/vermelho da variação.
 *
 * NOTA: a prop `width` (largura por coluna) ficou de fora desta entrega —
 * decisão arquitetural pendente.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'metric_glow',
  kind: 'chart',
  name: 'Métrica (glow)',
  description: 'Card de métrica única em destaque, com variação e efeito de brilho.',
  source: 'vitrine:metric-glow-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Rótulo — string livre; sobrescreve o `data.label`. Vazio = usa
      // `data.label` (ou `manifest.name` como último fallback).
      label: {
        type: 'string',
        description: 'Rótulo da métrica (sobrescreve o `label` vindo dos dados). Se vazio, usa o label dos dados ou o nome do bloco.',
      },
      // (valueFormat) ENUM FECHADO — default 'compactBRL'. Cada valor carrega
      // sua própria `description` via `oneOf`/`const` (doc por opção no
      // autocomplete do MCP/IA). O `enum` puro coexiste com o `oneOf` (a AJV
      // aceita ambos) — `enum` para validadores simples, `oneOf` para a doc.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description: 'Formato PT-BR do valor em destaque. ENUM FECHADO (sem input livre). Substitui a formatação crua antiga.',
        oneOf: [
          { const: 'BRL',           description: 'formatBRL — moeda BRL completa (ex.: "R$ 124.500,00").' },
          { const: 'compactBRL',    description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 124,5 mil"). DEFAULT.' },
          { const: 'number',        description: 'formatNumberBR — número PT-BR com milhar (ex.: "124.500").' },
          { const: 'compactNumber', description: 'formatCompactNumberBR — número compacto (ex.: "124,5 mil").' },
          { const: 'percent',       description: 'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").' },
        ],
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.background (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)). Aplicada ao halo/brilho do card.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor do brilho/destaque do card. Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
      // (showDelta) liga/desliga a variação percentual abaixo do valor.
      showDelta: {
        type: 'boolean',
        default: true,
        description: 'Mostra a variação percentual (%) abaixo do valor. `false` esconde a variação mesmo quando há `delta` nos dados.',
      },
      // (deltaPolarity) semântica de cor da variação. ENUM FECHADO.
      deltaPolarity: {
        type: 'string',
        enum: ['up-good', 'up-bad'],
        default: 'up-good',
        description: 'Semântica de cor da variação. ENUM FECHADO.',
        oneOf: [
          { const: 'up-good', description: 'Subir é bom: variação positiva = verde, negativa = vermelho. DEFAULT (ex.: receita, vendas).' },
          { const: 'up-bad',  description: 'Subir é ruim: variação positiva = vermelho, negativa = verde (ex.: inadimplência, custos, atrasos).' },
        ],
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      delta: { type: 'number', required: false },
    },
    example: { value: 124500, label: 'Receita do mês', unit: 'BRL', delta: 0.125 },
  },
  defaultProps: {
    valueFormat: 'compactBRL',
    accent: 'chart-1',
    showDelta: true,
    deltaPolarity: 'up-good',
  },
  version: '1.0.0',
} satisfies BlockManifest;
