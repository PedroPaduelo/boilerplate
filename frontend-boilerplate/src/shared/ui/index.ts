/**
 * `@/shared/ui` — primitivos de APRESENTAÇÃO sem equivalente no Astryx.
 *
 * O que mora aqui: visualização de dados (gráficos, medidores, rankings) e as
 * composições de indicador (KPI, ladrilho, moldura de widget). Todos são
 * componentes PRÓPRIOS — permitidos pelo contrato de migração — e cada arquivo
 * abre justificando por que existe.
 *
 * Regras que valem para tudo daqui:
 * - cor sempre de token do DS (`--color-data-*` nas séries, via
 *   `useChartPalette`); nunca hex, rgb ou oklch;
 * - apresentação pura: recebem `data` por prop, não buscam nada;
 * - todo gráfico cobre carregando e sem dados, e se anuncia para leitor de tela.
 */

export * from './charts';

export { AnimatedNumber } from './animated-number';
export type { AnimatedNumberProps } from './animated-number';
export { chartAccentCardVariant, chartAccentColor } from './chart-accent';
export type { ChartAccentCardVariant } from './chart-accent';
export { ChartDataTable } from './chart-data-table';
export type { ChartDataTableProps } from './chart-data-table';
export { ChartWidget } from './chart-widget';
export type { ChartWidgetProps, ChartWidgetTakeaway } from './chart-widget';
export { DeltaBadge } from './delta-badge';
export type { DeltaBadgeProps } from './delta-badge';
export { KpiCard } from './kpi-card';
export type { KpiCardProps } from './kpi-card';
export { MiddleTruncation } from './middle-truncation';
export type { MiddleTruncationProps, MiddleTruncationType } from './middle-truncation';
export { truncateMiddle } from './truncate-middle';
export { StatTile } from './stat-tile';
export type { StatTileProps } from './stat-tile';
