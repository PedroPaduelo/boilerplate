/**
 * Configuração do módulo `export` (T-J) — PDF server-side headless.
 *
 * Lida DIRETO de `process.env` (não some ao `@/lib/env` central) para manter o
 * módulo autossuficiente e não tocar o boot compartilhado — mesmo padrão do
 * módulo `mcp` (T-D). Todos os valores têm default seguro para dev.
 */
function readInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function readStr(raw: string | undefined, fallback: string): string {
  const v = (raw ?? '').trim();
  return v.length > 0 ? v : fallback;
}

export interface ExportConfig {
  /** Base URL do FRONTEND (onde vive a rota `/print/dashboards/:id`). */
  printBaseUrl: string;
  /** Marca exibida no cabeçalho do PDF. */
  brand: string;
  /** TTL (s) do token de serviço curto que autentica o headless. */
  tokenTtlSeconds: number;
  /** Timeout (ms) de navegação até a rota /print carregar. */
  navigationTimeoutMs: number;
  /** Timeout (ms) aguardando o marcador `[data-print-ready="true"]`. */
  readyTimeoutMs: number;
  /** TTL (s) do PDF/status guardados no Redis para download posterior. */
  resultTtlSeconds: number;
}

export function loadExportConfig(): ExportConfig {
  return {
    printBaseUrl: readStr(process.env.EXPORT_PRINT_BASE_URL, 'http://localhost:5173'),
    brand: readStr(process.env.EXPORT_BRAND, 'Prefeitura'),
    tokenTtlSeconds: readInt(process.env.EXPORT_TOKEN_TTL_SECONDS, 300),
    navigationTimeoutMs: readInt(process.env.EXPORT_NAV_TIMEOUT_MS, 30000),
    readyTimeoutMs: readInt(process.env.EXPORT_READY_TIMEOUT_MS, 30000),
    resultTtlSeconds: readInt(process.env.EXPORT_RESULT_TTL_SECONDS, 600),
  };
}

export const exportConfig = loadExportConfig();

/**
 * Monta a URL da rota de impressão do FE com o token de serviço + filtros.
 * Ex.: `http://localhost:5173/print/dashboards/abc?token=...&mode=published&filters=%7B...%7D`
 */
export function buildPrintUrl(
  baseUrl: string,
  dashboardId: string,
  opts: { token: string; mode: 'draft' | 'published'; filters: Record<string, unknown> },
): string {
  const base = baseUrl.replace(/\/+$/, '');
  const qs = new URLSearchParams();
  qs.set('token', opts.token);
  qs.set('mode', opts.mode);
  qs.set('filters', JSON.stringify(opts.filters ?? {}));
  return `${base}/print/dashboards/${encodeURIComponent(dashboardId)}?${qs.toString()}`;
}
