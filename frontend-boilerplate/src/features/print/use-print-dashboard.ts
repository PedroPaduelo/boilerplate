/**
 * Hook de carregamento da pagina de impressao (T-J) - `/print/dashboards/:id`.
 *
 * Estrategia (headless-friendly, SEM socket): para um contexto de impressao
 * deterministico, o hook NAO depende de eventos de socket. Em vez disso:
 *  1. carrega o layout (`GET /dashboards/:id?mode=`);
 *  2. dispara o batch (`POST /dashboards/:id/data`);
 *  3. enquanto houver bloco `queued|running` (modo published, cache frio),
 *     re-dispara o batch em intervalos - o worker preenche o cache e o proximo
 *     POST volta `success` (cache HIT). Para quando tudo estiver terminal ou ao
 *     atingir o teto de tentativas.
 *
 * Quando `status === 'ready'`, a pagina marca `[data-print-ready="true"]`, que e
 * o seletor pelo qual o Playwright sabe que pode gerar o PDF.
 *
 * Robustez: se o LAYOUT carrega mas os DADOS falham (ex.: bloco com erro, layout
 * legado nao-conforme), a pagina ainda fica PRONTA - o PDF sai com o layout e os
 * estados dos blocos. Um relatorio sempre e produzido quando o dashboard e
 * visivel. So vira `error` quando nem o layout pode ser carregado.
 */
import { useEffect, useRef, useState } from 'react';
import type { DashboardDataPayload } from '@dashboards/contracts';
import { createPrintClient } from './lib/print-client';
import { allBlocksSettled, type PrintMode } from './lib/print-params';

export interface PrintDashboardDetail {
  id: string;
  title: string;
  layout: { filters: unknown[]; rows: unknown[] };
  mode: 'draft' | 'published';
  status: string;
}

export type PrintStatus = 'loading' | 'ready' | 'error' | 'unauthorized';

export interface UsePrintDashboardResult {
  status: PrintStatus;
  detail: PrintDashboardDetail | undefined;
  data: DashboardDataPayload | undefined;
  errorMessage: string | undefined;
}

export interface UsePrintDashboardOptions {
  id: string | undefined;
  token: string | null;
  mode: PrintMode;
  filters: Record<string, unknown>;
  /** Maximo de tentativas de batch enquanto ha blocos pendentes (default 30). */
  maxPolls?: number;
  /** Intervalo (ms) entre tentativas de batch (default 800). */
  pollIntervalMs?: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function usePrintDashboard({
  id,
  token,
  mode,
  filters,
  maxPolls = 30,
  pollIntervalMs = 800,
}: UsePrintDashboardOptions): UsePrintDashboardResult {
  const [status, setStatus] = useState<PrintStatus>(token ? 'loading' : 'unauthorized');
  const [detail, setDetail] = useState<PrintDashboardDetail | undefined>();
  const [data, setData] = useState<DashboardDataPayload | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const cancelled = useRef(false);

  // Chave estavel dos filtros (proxy serializavel para o array de deps do effect).
  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    cancelled.current = false;
    // Sem token (ou sem id) o estado inicial ja e 'unauthorized'; nada a buscar.
    if (!token || !id) return;

    const client = createPrintClient(token);
    const activeFilters = JSON.parse(filtersKey) as Record<string, unknown>;

    void (async () => {
      // 1) Layout: se isto falhar nao ha o que renderizar -> estado de erro.
      try {
        const detailRes = await client.get<PrintDashboardDetail>(`/dashboards/${id}`, {
          params: { mode },
        });
        if (cancelled.current) return;
        setDetail(detailRes.data);
      } catch (err) {
        if (cancelled.current) return;
        setErrorMessage(err instanceof Error ? err.message : 'Falha ao carregar');
        setStatus('error');
        return;
      }

      // 2) Dados: melhor esforco. Mesmo se o batch falhar, a pagina fica PRONTA.
      try {
        let payload: DashboardDataPayload | undefined;
        for (let attempt = 0; attempt < maxPolls; attempt += 1) {
          const res = await client.post<DashboardDataPayload>(`/dashboards/${id}/data`, {
            mode,
            filters: activeFilters,
          });
          if (cancelled.current) return;
          payload = res.data;
          setData(payload);
          if (allBlocksSettled(payload)) break;
          await sleep(pollIntervalMs);
          if (cancelled.current) return;
        }
      } catch {
        // dados indisponiveis -> segue para 'ready' (PDF com layout/placeholder).
      }

      if (cancelled.current) return;
      setStatus('ready');
    })();

    return () => {
      cancelled.current = true;
    };
  }, [id, token, mode, filtersKey, maxPolls, pollIntervalMs]);

  return { status, detail, data, errorMessage };
}
