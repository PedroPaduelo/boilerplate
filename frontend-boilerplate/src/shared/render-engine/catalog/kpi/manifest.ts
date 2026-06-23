/**
 * Manifesto do bloco `kpi` — métrica única (escalar). Alinhado ao
 * `kpiManifest`/`baseManifests` de @dashboards/contracts (fonte da verdade).
 * PURO (sem React): é o objeto que o `build:catalog` (BE) coleta.
 *
 * Props canônicas (MCP-ready — cada uma com `description`):
 *  - `label`         → sobrescreve o rótulo vindo do dado (`data.label`).
 *  - `valueFormat`   → ENUM com `auto` + os 5 formatos canônicos do DS.
 *                      `auto` (default) mantém o `formatKpiValue` (escolhe o
 *                      melhor display pela unidade/magnitude); os demais
 *                      FORÇAM o formato via `formatValueByEnum()`.
 *  - `accent`        → cor de destaque (enum DS, classe Tailwind ou cor CSS),
 *                      resolvida por `resolveAccent()` no component.tsx.
 *  - `icon`          → nome de ícone lucide (PascalCase ou kebab-case).
 *  - `showDelta`     → mostra/esconde a variação.
 *  - `deltaPolarity` → `up-good` (subir = verde) | `up-bad` (subir = vermelho).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { CATALOG_ICONS } from '../../lib/icons';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'kpi',
  kind: 'chart',
  name: 'KPI',
  description: 'Métrica única (escalar) com rótulo e variação opcional.',
  source: 'vitrine:kpi-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Rótulo — sobrescreve `data.label` quando presente.
      label: {
        type: 'string',
        description: 'Rótulo da métrica. Sobrescreve o rótulo vindo do dado (data.label).',
      },
      // Formato do valor — ENUM FECHADO: 'auto' (default) + 5 canônicos do DS.
      valueFormat: {
        type: 'string',
        enum: ['auto', ...VALUE_FORMATS],
        default: 'auto',
        description: 'Formato PT-BR do valor exibido. "auto" (default) escolhe o melhor display pela unidade/magnitude (formatKpiValue); os demais FORÇAM o formato. ENUM FECHADO (sem input livre).',
        oneOf: [
          { const: 'auto',          description: 'formatKpiValue — escolhe automático: moeda compacta p/ unit BRL/USD/EUR, número compacto p/ magnitude ≥ 10 mil, número cheio caso contrário. DEFAULT.' },
          { const: 'BRL',           description: 'formatBRL — moeda BRL completa (ex.: "R$ 1.284.000,00").' },
          { const: 'compactBRL',    description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 1,28 mi").' },
          { const: 'number',        description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.284.000").' },
          { const: 'compactNumber', description: 'formatCompactNumberBR — número compacto (ex.: "1,28 mi").' },
          { const: 'percent',       description: 'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").' },
        ],
      },
      // COR de destaque — enum DS + (via resolveAccent) classe Tailwind / cor CSS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor de destaque do card (rail lateral + chip do ícone). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500) ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)). Resolvida por resolveAccent().',
      },
      // Ícone lucide — ENUM CURADO (set relevante p/ dashboards). A IA/MCP lê
      // o enum p/ saber QUAIS ícones existem. PascalCase (chave do lucide).
      icon: {
        type: 'string',
        enum: [...CATALOG_ICONS],
        description: 'Ícone lucide-react exibido no canto do card. ENUM CURADO (set relevante p/ dashboards: financeiro/métricas/pessoas/status). Ex.: "DollarSign", "TrendingUp", "Users", "Landmark". Vazio = sem ícone.',
      },
      // Variação.
      showDelta: {
        type: 'boolean',
        default: true,
        description: 'Mostra a variação (delta) vs. período anterior. false = esconde.',
      },
      // Polaridade do delta — controla a cor (verde/vermelho).
      deltaPolarity: {
        type: 'string',
        enum: ['up-good', 'up-bad'],
        default: 'up-good',
        description: 'Polaridade da variação: "up-good" (default) = subir é bom (delta positivo verde); "up-bad" = subir é ruim (delta positivo vermelho, ex.: inadimplência, custo).',
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
    example: { value: 1284000, label: 'Total arrecadado', unit: 'BRL', delta: 0.12 },
  },
  defaultProps: { showDelta: true, valueFormat: 'auto', accent: 'chart-1', deltaPolarity: 'up-good' },
  version: '1.0.0',
} satisfies BlockManifest;
