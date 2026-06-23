/**
 * Manifesto do bloco `donut` — distribuição de um total entre categorias
 * (shape 'categorical'). Alinhado a @dashboards/contracts.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccentForStroke` no component.tsx).
 *
 * Prop `valueFormat` (ENTREGA 3): ENUM FECHADO com 5 valores canônicos do DS,
 * cada um casa 1:1 com um helper de `format.ts` via `formatValueByEnum()`. O
 * schema fecha como `<Select>` no playground (sem input livre) e a AJV valida
 * na borda. Default: `'compactBRL'` (consistente com o histórico do bloco).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'donut',
  kind: 'chart',
  name: 'Donut',
  description: 'Distribuição de um total entre categorias (label + value).',
  source: 'vitrine:donut-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Exibe legenda à direita (uma linha por categoria com bolinha, valor e %).
      showLegend: {
        type: 'boolean',
        default: true,
        description: 'Exibe legenda clicável ao lado (uma linha por categoria com bolinha, valor absoluto e percentual). Em listas longas (6+ categorias) vira grade de 2 colunas com rolagem.',
      },
      // Rótulo exibido no centro do donut quando NÃO há hover (ex.: "Total").
      centerLabel: {
        type: 'string',
        description: 'Rótulo exibido no centro do donut quando NÃO há hover em nenhum segmento (abaixo dele aparece o VALOR TOTAL, soma das fatias). Default: "Total".',
      },
      // Modo de paleta — donut cicla nativamente; `single` colapsa tudo em
      // uma cor (accent), `multi` cicla chart-1..5, `none` = sem cor.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = TODAS as fatias na MESMA cor (accent), variando a opacidade por fatia para mantê-las distinguíveis; "multi" = cicla chart-1..5 por categoria (accent custom é IGNORADO — a paleta do DS vence); "none" = sem cor (currentColor herdado, sem distinção).',
      },
      // COR — string livre; resolveAccentForStroke() decide se vira classe
      // Tailwind (chart-N, primary, stroke-purple-500) ou style.stroke (#hex,
      // rgb(), gradient, oklch(), var(--chart-1)). Em `palette: 'multi'` é
      // IGNORADO (ver ENTREGA 1 no component.tsx).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor base aplicada aos segmentos (só usado em palette="single"; em "multi" a paleta cíclica do DS vence). Aceita enum DS (chart-1..5, primary), classe Tailwind (stroke-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
      // (ENTREGA 3) valueFormat — ENUM FECHADO, default 'compactBRL'.
      // Cada valor carrega sua própria `description` via `oneOf`/`const` — esse
      // padrão dá ao MCP/IA a documentação por opção no autocomplete. O `enum`
      // puro (retrocompat com validadores simples) e o `oneOf` coexistem.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description: 'Formato PT-BR do valor exibido no centro do donut (total/fatia) + legenda. ENUM FECHADO (sem input livre).',
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
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
    ],
  },
  defaultProps: { showLegend: true, palette: 'single', accent: 'chart-1', valueFormat: 'compactBRL' },
  version: '1.0.0',
} satisfies BlockManifest;
