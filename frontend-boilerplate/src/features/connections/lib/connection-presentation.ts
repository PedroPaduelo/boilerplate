import type { BadgeVariant } from '@astryxdesign/core/Badge';
import type { StatusDotVariant } from '@astryxdesign/core/StatusDot';
import type { Connection, ConnectionVisibility } from '../types';

/**
 * Tradu\u00e7\u00e3o de dado de dom\u00ednio \u2192 vocabul\u00e1rio visual do design system.
 *
 * Fica em `lib/` (e n\u00e3o dentro dos componentes) porque \u00e9 a mesma decis\u00e3o em
 * tr\u00eas telas \u2014 lista, workbench e barra de status \u2014 e porque \u00e9 pura: entra
 * string do backend, sai variante de token. Sem isto, cada tela reinventaria o
 * mapeamento e \"OK\" ficaria verde num lugar e cinza no outro.
 */

export interface ConnectionStatusView {
  variant: StatusDotVariant;
  label: string;
}

/** Status de conectividade reportado pelo backend \u2192 ponto de status + r\u00f3tulo. */
export function connectionStatusView(status: string): ConnectionStatusView {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'OK' || normalized === 'ACTIVE' || normalized === 'CONNECTED') {
    return { variant: 'success', label: 'Conectado' };
  }
  if (normalized === 'ERROR' || normalized === 'FAILED' || normalized === 'INACTIVE') {
    return { variant: 'error', label: 'Falha' };
  }
  return { variant: 'neutral', label: 'N\u00e3o testado' };
}

const VISIBILITY_LABELS: Record<ConnectionVisibility, string> = {
  PRIVATE: 'Privada',
  DEPARTMENT: 'Departamento',
  ORG: 'Organiza\u00e7\u00e3o',
};

export function visibilityLabel(visibility: ConnectionVisibility): string {
  return VISIBILITY_LABELS[visibility] ?? visibility;
}

export interface EnvironmentView {
  label: string;
  variant: BadgeVariant;
}

/**
 * Ambiente inferido do nome/banco (heur\u00edstica leve \u2014 o backend n\u00e3o tem o campo).
 * Serve para separar produ\u00e7\u00e3o do resto de relance na lista.
 */
export function environmentView(connection: Connection): EnvironmentView {
  const haystack = `${connection.name} ${connection.database}`.toLowerCase();
  if (haystack.includes('homolog')) return { label: 'Homolog', variant: 'orange' };
  if (haystack.includes('staging') || haystack.includes('hml')) {
    return { label: 'Staging', variant: 'blue' };
  }
  if (haystack.includes('dev') || haystack.includes('local')) {
    return { label: 'Dev', variant: 'neutral' };
  }
  return { label: 'Produ\u00e7\u00e3o', variant: 'red' };
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** Bytes \u2192 string curta (\"340 MB\", \"1.2 GB\"). `\u2014` quando n\u00e3o h\u00e1 valor. */
export function formatBytes(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return '\u2014';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    value >= 100 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${BYTE_UNITS[unit]}`;
}

/** Megabytes (unidade do view-model do schema) \u2192 string curta. */
export function formatSizeMB(sizeMB?: number | null): string {
  if (sizeMB == null || sizeMB <= 0) return '\u2014';
  return formatBytes(sizeMB * 1024 * 1024);
}

/** Contagem compacta: 8_400_000 \u2192 \"8.4M\". */
export function formatCount(value?: number | null): string {
  if (value == null) return '\u2014';
  if (value < 1_000) return String(value);
  if (value < 1_000_000) return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return `${(value / 1_000_000_000).toFixed(1)}B`;
}
