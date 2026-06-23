/**
 * Manifesto do bloco `h_bar_chart` (shape 'series', x categórico) — barras
 * HORIZONTAIS. Usa o Vitrine `HBarChart`. Bom para comparar poucas categorias
 * com rótulos longos.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent` no component.tsx).
 *
 * Prop `valueFormat` (ENTREGA 2): ENUM FECHADO com 5 valores canônicos do DS,
 * cada um casa 1:1 com um helper de `format.ts` via `formatValueByEnum()`.
 * O schema fecha como `<Select>` no playground (sem input livre) e a AJV
 * valida na borda. Default: `'compactBRL'` (consistente com o histórico).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'h_bar_chart',
  kind: 'chart',
  name: 'Barras Horizontais',
  description: 'Compara valores entre categorias em barras horizontais (rótulos longos cabem melhor).',
  source: 'vitrine:h-bar-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Modo de paleta (Turno 6 — multi IMPLEMENTADO via HBarChartDatum.barClassName).
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = TODAS as barras com a mesma cor (accent); "multi" = cicla chart-1..5 por item (helper paletteClass(i) via HBarChartDatum.barClassName) — accent custom é IGNORADO nesse modo (a paleta do DS vence); "none" = sem distinção (default do UI base).',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.background (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)). Em `palette: 'multi'` é IGNORADO
      // (ver ENTREGA 1 no component.tsx).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor base da barra (só usado em palette="single"; em "multi" a paleta cíclica do DS vence). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
      // (ENTREGA 2) valueFormat — ENUM FECHADO, default 'compactBRL'.
      // Cada valor carrega sua própria `description` via `oneOf`/`const`
      // — esse padrão dá ao MCP/IA a documentação por opção no
      // autocomplete (cada subschema tem `description` próprio).
      // O `enum` puro (acima, mantido para retrocompat com validadores
      // mais simples) e o `oneOf` (descrições por valor) coexistem: a
      // AJV aceita ambos os formatos.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description: 'Formato PT-BR do valor exibido no rótulo lateral + tooltip. ENUM FECHADO (sem input livre).',
        oneOf: [
          { const: 'BRL',           description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").' },
          { const: 'compactBRL',    description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi"). DEFAULT.' },
          { const: 'number',        description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8").' },
          { const: 'compactNumber', description: 'formatCompactNumberBR — número compacto (ex.: "2,61 bi").' },
          { const: 'percent',       description: 'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").' },
        ],
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: true },
      y: { type: 'number', required: true },
    },
    example: [
      { x: 'Centro', y: 1200 },
      { x: 'Norte', y: 980 },
    ],
  },
  defaultProps: { palette: 'single', accent: 'chart-1', valueFormat: 'compactBRL' },
  minColumns: 1,
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
