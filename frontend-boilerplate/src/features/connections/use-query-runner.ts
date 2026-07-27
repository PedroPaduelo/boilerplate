import { useCallback, useState } from 'react';
import { useRunConnectionQuery } from './hooks';
import type { QueryResult } from './types';

/**
 * Estado do executor de query do workbench: SQL em edição, resultado, histórico
 * da sessão e a duração da última execução (mostrada na barra de status).
 *
 * O histórico é de SESSÃO de propósito — SQL pode conter dado sensível; nada
 * disso vai para o localStorage.
 */

const HISTORY_LIMIT = 20;

export interface QueryHistoryEntry {
  id: string;
  sql: string;
  durationMs: number;
  rowCount: number;
  /** Epoch ms — renderizado como tempo relativo pelo `Timestamp`. */
  at: number;
}

export interface QueryRunner {
  isOpen: boolean;
  sql: string;
  result: QueryResult | null;
  history: QueryHistoryEntry[];
  isPending: boolean;
  lastDurationMs: number | null;
  open: (presetSql?: string) => void;
  close: () => void;
  setSql: (sql: string) => void;
  run: () => void;
}

export function useQueryRunner(connectionId: string): QueryRunner {
  const runQuery = useRunConnectionQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  const open = useCallback((presetSql?: string) => {
    if (presetSql) {
      setSql(presetSql);
      setResult(null);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const run = useCallback(() => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    runQuery.mutate(
      { id: connectionId, sql: trimmed, maxRows: 100 },
      {
        onSuccess: (queryResult) => {
          setResult(queryResult);
          setLastDurationMs(queryResult.durationMs);
          setHistory((previous) =>
            [
              {
                id: `q-${Date.now()}`,
                sql: trimmed,
                durationMs: queryResult.durationMs,
                rowCount: queryResult.rowCount,
                at: Date.now(),
              },
              ...previous,
            ].slice(0, HISTORY_LIMIT),
          );
        },
      },
    );
  }, [connectionId, runQuery, sql]);

  return {
    isOpen,
    sql,
    result,
    history,
    isPending: runQuery.isPending,
    lastDurationMs,
    open,
    close,
    setSql,
    run,
  };
}
