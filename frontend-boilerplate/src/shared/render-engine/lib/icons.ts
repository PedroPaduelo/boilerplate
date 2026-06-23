/**
 * Lista CURADA de ícones (lucide-react) — PURA (sem React, sem lucide).
 *
 * Este arquivo é importado por `manifest.ts` (que precisa ser PURO — sem
 * runtime de React/lucide — porque o `build:catalog` do BE o coleta). Por
 * isso aqui só vive a LISTA de nomes + helpers de string. O RESOLVER que
 * converte nome → componente lucide vive em `lucide-resolver.ts` (importa
 * lucide), consumido só pelo FE (components/playground).
 *
 * Consumidores:
 *  - `manifest.propsSchema` → `icon: { enum: [...CATALOG_ICONS], ... }`
 *    (a IA/MCP lê o enum + description para saber QUAIS ícones existem).
 *  - `lucide-resolver.ts` → valida/resolve contra esta lista.
 */

/**
 * Set curado de ícones (PascalCase, chave do registry do lucide). Agrupado
 * por tema só para leitura — a ordem aqui é a ordem do dropdown. O set é
 * relevante para dashboards de gestão (financeiro, métricas, pessoas, status).
 */
export const CATALOG_ICONS = [
  // 💰 Financeiro
  'DollarSign',
  'Banknote',
  'Coins',
  'Wallet',
  'PiggyBank',
  'CreditCard',
  'Receipt',
  'Landmark',
  // 📈 Tendência / métricas
  'TrendingUp',
  'TrendingDown',
  'Activity',
  'BarChart3',
  'LineChart',
  'PieChart',
  'Target',
  'Gauge',
  'Percent',
  // 👥 Pessoas / lugares
  'Users',
  'UserCheck',
  'Building2',
  'MapPin',
  // 📄 Documentos / tempo
  'FileText',
  'ClipboardList',
  'Calendar',
  'Clock',
  // 🚦 Status
  'AlertTriangle',
  'CheckCircle2',
  'Info',
  'ArrowUpRight',
  'ArrowDownRight',
] as const;

/** Nome de ícone aceito (um dos curados). */
export type CatalogIcon = (typeof CATALOG_ICONS)[number];

/** `true` se `name` é um ícone curado do catálogo. */
export function isCatalogIcon(name: unknown): name is CatalogIcon {
  return (
    typeof name === 'string' && (CATALOG_ICONS as readonly string[]).includes(name)
  );
}
