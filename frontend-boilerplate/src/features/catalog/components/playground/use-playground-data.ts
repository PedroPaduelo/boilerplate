/**
 * Estado do painel "Dados" do playground.
 *
 * Duas origens, uma só fonte de verdade (`dataText`):
 *  - catálogo → fixtures (variantes) e edição manual do JSON;
 *  - `/charts/:id` (modo live) → o resultado REAL da query, read-only.
 *
 * O erro de validação é mantido junto do texto porque é ele que pausa o
 * preview: JSON inválido não vira `BlockDataResult`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CatalogEntry } from '../../lib/catalog-entries';
import type { FixtureVariant } from '../../lib/block-fixtures';
import {
  durationOfResult,
  initialDataFor,
  parseAndValidate,
  toJsonText,
} from './playground-helpers';
import type { LiveData } from './types';

interface UsePlaygroundDataOptions {
  entry: CatalogEntry;
  /** Variantes de fixture do bloco (vazio no modo live). */
  variants: FixtureVariant[];
  live?: LiveData;
}

export interface UsePlaygroundDataReturn {
  dataText: string;
  /** Mensagem de erro de sintaxe/shape, ou `null`. */
  dataError: string | null;
  /** Dado parseado (ou `undefined` quando o JSON está quebrado). */
  parsedData: unknown;
  /** Variante ativa; `null` quando o JSON foi editado à mão. */
  variantId: string | null;
  /** Erro da execução da query (modo live). */
  liveError: string | null;
  /** Nº de linhas devolvidas pela query (modo live). */
  liveRowCount: number | undefined;
  /** Duração da query real (modo live). */
  liveDurationMs: number | undefined;
  setDataText: (text: string) => void;
  applyVariant: (variant: FixtureVariant) => void;
  resetData: () => void;
}

export function usePlaygroundData({
  entry,
  variants,
  live,
}: UsePlaygroundDataOptions): UsePlaygroundDataReturn {
  const isLive = Boolean(live);
  const liveResult = live?.result;

  const initialText = useMemo(() => {
    const fallback = variants.find((v) => v.id === 'default');
    return toJsonText(fallback ? fallback.data : initialDataFor(entry));
    // Recalcula só quando o bloco muda — `variants` é derivado do tipo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.type]);

  const [dataText, setText] = useState(initialText);
  const [variantId, setVariantId] = useState<string | null>(
    variants.length > 0 ? 'default' : null,
  );

  // Trocar de bloco recarrega a fixture default.
  useEffect(() => {
    setText(initialText);
    setVariantId(variants.length > 0 ? 'default' : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  // Modo live: o dado vem da query; o texto do editor só reflete o resultado.
  useEffect(() => {
    if (!isLive || liveResult?.state !== 'success') return;
    setText(toJsonText(liveResult.data ?? null));
    setVariantId(null);
  }, [isLive, liveResult]);

  const { data: parsedData, error: dataError } = useMemo(
    () => parseAndValidate(entry.shape, dataText),
    [entry.shape, dataText],
  );

  const setDataText = useCallback((text: string) => {
    setText(text);
    setVariantId(null);
  }, []);

  const applyVariant = useCallback((variant: FixtureVariant) => {
    setVariantId(variant.id);
    setText(toJsonText(variant.data));
  }, []);

  const resetData = useCallback(() => {
    const fallback = variants.find((v) => v.id === 'default');
    if (fallback) {
      setVariantId(fallback.id);
      setText(toJsonText(fallback.data));
      return;
    }
    setVariantId(null);
    setText(toJsonText(initialDataFor(entry)));
  }, [entry, variants]);

  const liveError =
    isLive && liveResult?.state === 'error'
      ? (liveResult.error?.message ?? 'Falha ao executar a query')
      : null;

  const liveRowCount =
    isLive && liveResult?.state === 'success'
      ? (liveResult.meta as { rowCount?: number } | undefined)?.rowCount
      : undefined;

  return {
    dataText,
    dataError,
    parsedData,
    variantId,
    liveError,
    liveRowCount,
    liveDurationMs: isLive ? durationOfResult(liveResult) : undefined,
    setDataText,
    applyVariant,
    resetData,
  };
}
