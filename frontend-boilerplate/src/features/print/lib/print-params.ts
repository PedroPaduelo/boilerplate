/**
 * Parsing PURO dos parâmetros da rota de impressão `/print/dashboards/:id` (T-J).
 *
 * O serviço headless (Playwright no backend) abre esta rota passando, via query
 * string:
 *  - `token`   → JWT de serviço de CURTA duração (gerado pelo módulo `export`).
 *               É o que autentica as chamadas à API a partir da página de
 *               impressão (não há sessão/login no contexto headless).
 *  - `mode`    → `published` (default) | `draft`.
 *  - `filters` → JSON (URI-encoded) com o mapa `filterId -> valor` aplicado, para
 *               o PDF refletir EXATAMENTE os filtros da tela.
 *
 * Mantido puro (sem React) para ser testável isoladamente.
 */
import type { DashboardDataPayload } from '@dashboards/contracts';

export type PrintMode = 'draft' | 'published';

export interface PrintParams {
  /** Token de serviço (curto). `null` ⇒ acesso não autenticado (bloqueia). */
  token: string | null;
  mode: PrintMode;
  filters: Record<string, unknown>;
}

/** Extrai e normaliza os parâmetros da query string da rota de impressão. */
export function parsePrintParams(search: URLSearchParams): PrintParams {
  const token = search.get('token');
  const modeRaw = search.get('mode');
  const mode: PrintMode = modeRaw === 'draft' ? 'draft' : 'published';

  let filters: Record<string, unknown> = {};
  const raw = search.get('filters');
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        filters = parsed as Record<string, unknown>;
      }
    } catch {
      // filtros inválidos → ignora (renderiza sem filtros)
    }
  }

  return { token, mode, filters };
}

/**
 * Verifica se TODOS os blocos do payload chegaram a um estado terminal
 * (`success` ou `error`). É o sinal de que a hidratação acabou e o PDF pode ser
 * gerado. Sem payload ⇒ ainda não pronto. Payload sem blocos ⇒ pronto (ex.: só
 * blocos narrativos, sem dados).
 */
export function allBlocksSettled(payload: DashboardDataPayload | undefined): boolean {
  if (!payload) return false;
  // Os tipos do contrato resolvem para `any` no FE; tipamos o elemento aqui.
  const blocks = Object.values(payload.blocks ?? {}) as Array<{ state?: string }>;
  return blocks.every((b) => b.state === 'success' || b.state === 'error');
}
