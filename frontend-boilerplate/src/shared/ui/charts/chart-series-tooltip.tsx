/**
 * COMPONENTE PRÓPRIO — ponte entre o payload cru do recharts e o `ChartTooltip`
 * do DS. O recharts entrega uma lista de entradas com `dataKey`/`value`; aqui
 * ela vira linhas com o rótulo real da série e a cor da paleta. Fica separado
 * para que área, barras e linha compartilhem exatamente a mesma tradução em vez
 * de repetir o `content={...}` do `<Tooltip>` três vezes.
 */
import { ChartTooltip } from './chart-tooltip';
import { seriesIndexFromKey } from './chart-data';
import type { ChartSeries, ValueFormatter } from './types';
import type { ChartPalette } from './use-chart-palette';

/** Campos do payload do recharts que realmente consumimos. */
interface TooltipEntry {
  dataKey?: unknown;
  value?: unknown;
}

/** Narrowing seguro do payload (o recharts o tipa de forma muito ampla). */
function readEntry(entry: unknown): TooltipEntry {
  return entry && typeof entry === 'object' ? (entry as TooltipEntry) : {};
}

export interface ChartSeriesTooltipProps {
  /** `active` do recharts — sem isto o tooltip renderiza fora do hover. */
  isActive?: boolean;
  /** Categoria do ponto sob o cursor. */
  title?: string;
  /** Payload cru do recharts (`TooltipProps['payload']`). */
  entries?: readonly unknown[];
  /** Séries do gráfico, para recuperar rótulo e cor por índice. */
  series: ChartSeries[];
  /** Paleta ativa. */
  palette: ChartPalette;
  /** Formatador do valor exibido. */
  format: ValueFormatter;
}

/** Tooltip de gráficos cartesianos (área, barras, linha). */
export function ChartSeriesTooltip({
  isActive,
  title,
  entries,
  series,
  palette,
  format,
}: ChartSeriesTooltipProps) {
  if (!isActive || !entries || entries.length === 0) return null;

  const rows = entries.map((raw) => {
    const entry = readEntry(raw);
    const index = seriesIndexFromKey(String(entry.dataKey ?? ''));
    const item = index >= 0 ? series[index] : undefined;
    const value = Number(entry.value ?? 0);
    return {
      label: item?.label ?? String(entry.dataKey ?? ''),
      value: format(Number.isFinite(value) ? value : 0),
      color: item ? palette.varAt(index, item.color) : undefined,
    };
  });

  return <ChartTooltip title={title} rows={rows} />;
}
