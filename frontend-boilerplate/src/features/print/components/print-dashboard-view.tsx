/**
 * P\u00e1gina de IMPRESS\u00c3O (T-J) \u2014 `/print/dashboards/:id` (rota p\u00fablica, n\u00edvel raiz,
 * FORA do `DashboardLayout`: sem sidebar, topbar ou a\u00e7\u00f5es).
 *
 * \u00c9 a p\u00e1gina que o servi\u00e7o headless (Playwright, no backend) abre para gerar o
 * PDF. Layout LIMPO: apenas cabe\u00e7alho (t\u00edtulo + marca + data), resumo dos filtros
 * aplicados e o render do dashboard (reusa o `DashboardRenderer` \u2014 T-I).
 *
 * Autentica\u00e7\u00e3o: via TOKEN DE SERVI\u00c7O passado na query string (`?token=`). Sem
 * token v\u00e1lido a p\u00e1gina N\u00c3O carrega dados e mostra um estado de bloqueio
 * (`[data-print-error="unauthorized"]`).
 *
 * Sinaliza\u00e7\u00e3o de pronto: quando a hidrata\u00e7\u00e3o termina, o n\u00f3 raiz ganha
 * `data-print-ready="true"` \u2014 \u00e9 o seletor que o Playwright aguarda antes de
 * chamar `page.pdf()`.
 */
import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { DashboardLayout } from '@dashboards/contracts';
import { DashboardRenderer } from '@/shared/render-engine';
import { parsePrintParams } from '../lib/print-params';
import { usePrintDashboard } from '../use-print-dashboard';

/** Marca de \u00f3rg\u00e3o exibida no cabe\u00e7alho do relat\u00f3rio (texto neutro no MVP). */
const BRAND = 'Prefeitura';

export function PrintDashboardView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { token, mode, filters } = useMemo(
    () => parsePrintParams(searchParams),
    [searchParams],
  );

  const { status, detail, data } = usePrintDashboard({ id, token, mode, filters });

  const appliedFilters = useMemo(
    () =>
      Object.entries(filters).filter(
        ([, v]) => v !== null && v !== undefined && v !== '',
      ),
    [filters],
  );

  if (status === 'unauthorized') {
    return (
      <div
        data-print-root
        data-print-error="unauthorized"
        className="flex min-h-screen items-center justify-center bg-white p-10 text-center"
      >
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-neutral-900">
            Acesso n\u00e3o autorizado
          </h1>
          <p className="text-sm text-neutral-500">
            Esta p\u00e1gina de impress\u00e3o exige um token de servi\u00e7o v\u00e1lido.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        data-print-root
        data-print-error="load"
        className="flex min-h-screen items-center justify-center bg-white p-10 text-center"
      >
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-neutral-900">
            N\u00e3o foi poss\u00edvel montar o relat\u00f3rio
          </h1>
          <p className="text-sm text-neutral-500">
            Verifique se o dashboard existe e est\u00e1 acess\u00edvel neste modo.
          </p>
        </div>
      </div>
    );
  }

  const title = detail?.title ?? 'Relat\u00f3rio';
  const layout = (detail?.layout ?? { filters: [], rows: [] }) as DashboardLayout;
  const now = new Date();

  return (
    <div
      data-print-root
      data-print-ready={status === 'ready' ? 'true' : 'false'}
      className="min-h-screen bg-white text-neutral-900"
    >
      <div className="mx-auto max-w-5xl px-8 py-8">
        <header className="mb-6 border-b border-neutral-200 pb-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <div className="text-right text-xs text-neutral-500">
              <div className="font-semibold text-neutral-700">{BRAND}</div>
              <div>{now.toLocaleString()}</div>
            </div>
          </div>

          {appliedFilters.length > 0 ? (
            <div
              data-slot="print-applied-filters"
              className="mt-3 flex flex-wrap gap-2"
            >
              {appliedFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600"
                >
                  {key}: {formatFilterValue(value)}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <DashboardRenderer layout={layout} data={data} />
      </div>
    </div>
  );
}

function formatFilterValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
