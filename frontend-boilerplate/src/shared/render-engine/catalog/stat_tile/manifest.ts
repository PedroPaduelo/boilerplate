/**
 * Manifesto do bloco `stat_tile` (shape 'scalar') — ladrilho de estatística
 * compacto. Usa o Vitrine `StatTile`.
 *
 * Props (MCP-ready — toda prop com `description`):
 *  - `label`        (string)  — sobrescreve o rótulo derivado de `data.label`.
 *  - `valueFormat`  (enum)    — formato PT-BR do VALOR. ENUM FECHADO (5 valores
 *                               canônicos do DS), cada um casa 1:1 com um helper
 *                               de `format.ts` via `formatValueByEnum()`. Cada
 *                               valor carrega `description` própria via `oneOf`
 *                               (autocomplete por opção no MCP/IA). Substitui o
 *                               antigo `CURRENCY_PREFIX` hardcoded.
 *                               Default: `'compactNumber'`.
 *  - `accent`       (string)  — cor de destaque (barra lateral). Aceita enum DS
 *                               + classe Tailwind + cor CSS (resolvido em
 *                               runtime por `resolveAccent`).
 *  - `showDelta`    (boolean) — mostra/esconde a variação. Default `true`.
 *  - `deltaPolarity`(enum)    — `up-good` (subir = verde) | `up-bad` (subir =
 *                               vermelho). Default `up-good`.
 *  - `hint`         (string)  — texto auxiliar ao lado do delta.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'stat_tile',
  kind: 'chart',
  name: 'Stat Tile',
  description: 'Ladrilho compacto de estatística (valor + variação) para grades de KPIs.',
  source: 'vitrine:stat-tile',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      label: {
        type: 'string',
        description: 'Rótulo do ladrilho. Sobrescreve o `label` derivado dos dados (data.label). Se ausente, usa data.label e, por fim, o nome do bloco.',
      },
      // valueFormat — ENUM FECHADO, default 'compactNumber'. Substitui o
      // CURRENCY_PREFIX hardcoded. O `enum` puro (retrocompat com validadores
      // simples) e o `oneOf` (descrições por valor p/ o MCP/IA) coexistem — a
      // AJV aceita ambos.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactNumber',
        description: 'Formato PT-BR do valor exibido. ENUM FECHADO (sem input livre). Substitui o prefixo de moeda hardcoded.',
        oneOf: [
          { const: 'BRL',           description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").' },
          { const: 'compactBRL',    description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi").' },
          { const: 'number',        description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8").' },
          { const: 'compactNumber', description: 'formatCompactNumberBR — número compacto (ex.: "2,61 bi"). DEFAULT.' },
          { const: 'percent',       description: 'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").' },
        ],
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.background (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)). Pinta a barra lateral de destaque.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor de destaque (barra lateral). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
      showDelta: {
        type: 'boolean',
        default: true,
        description: 'Mostra a variação (delta) quando os dados trazem `delta`. `false` esconde a variação.',
      },
      deltaPolarity: {
        type: 'string',
        enum: ['up-good', 'up-bad'],
        default: 'up-good',
        description: 'Polaridade da variação: "up-good" (subir é bom → positivo verde) | "up-bad" (subir é ruim → positivo vermelho).',
        oneOf: [
          { const: 'up-good', description: 'Subir é bom: delta positivo = verde, negativo = vermelho. DEFAULT.' },
          { const: 'up-bad',  description: 'Subir é ruim: delta positivo = vermelho, negativo = verde.' },
        ],
      },
      hint: {
        type: 'string',
        description: 'Texto auxiliar exibido ao lado do delta (ex.: "vs. ontem").',
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
    example: { value: 8420, label: 'Eventos hoje', delta: 0.06 },
  },
  defaultProps: {
    valueFormat: 'compactNumber',
    accent: 'chart-1',
    showDelta: true,
    deltaPolarity: 'up-good',
  },
  version: '1.0.0',
} satisfies BlockManifest;
