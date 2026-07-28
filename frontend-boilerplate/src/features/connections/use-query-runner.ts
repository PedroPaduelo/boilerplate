import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { useRunConnectionQuery } from './hooks';
import type { QueryResult } from './types';

/**
 * Estado do editor de query do workbench: SQL em edição, resultado, erro,
 * histórico da sessão e a duração da última execução (barra de status).
 *
 * NÃO tem mais `isOpen`/`open`/`close`: a consulta deixou de ser um modal e
 * passou a viver na aba "Dados", em split view (editor em cima, resultado
 * embaixo). O modal cobria a árvore de schema justamente quando o usuário
 * precisava conferir um nome de coluna para escrever a query.
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
  sql: string;
  result: QueryResult | null;
  /**
   * Erro da ÚLTIMA execução, exibido inline. O toast da mutação some sozinho —
   * quem está corrigindo um SQL precisa da mensagem parada na tela.
   */
  errorMessage: string | null;
  history: QueryHistoryEntry[];
  isPending: boolean;
  lastDurationMs: number | null;
  setSql: (sql: string) => void;
  /** Executa o SQL que está no editor. */
  run: () => void;
  /** Semeia o editor com um SQL e já executa (troca de tabela, histórico). */
  loadPreset: (sql: string) => void;
}

export function useQueryRunner(connectionId: string): QueryRunner {
  const runQuery = useRunConnectionQuery();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  const { mutate } = runQuery;

  /**
   * Recebe o SQL por parâmetro (em vez de ler o estado) para ficar ESTÁVEL:
   * `loadPreset` entra na lista de dependências do efeito que recarrega a
   * amostra ao trocar de tabela, e um callback instável ali viraria laço.
   */
  const execute = useCallback(
    (sqlText: string) => {
      const trimmed = sqlText.trim();
      if (!trimmed) return;
      mutate(
        { id: connectionId, sql: trimmed, maxRows: 100 },
        {
          onError: (error) => {
            setResult(null);
            setErrorMessage(getApiErrorMessage(error, 'Erro ao executar a query.'));
          },
          onSuccess: (queryResult) => {
            setResult(queryResult);
            setErrorMessage(null);
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
    },
    [connectionId, mutate],
  );

  const run = useCallback(() => execute(sql), [execute, sql]);

  const loadPreset = useCallback(
    (presetSql: string) => {
      setSql(presetSql);
      setResult(null);
      setErrorMessage(null);
      execute(presetSql);
    },
    [execute],
  );

  return {
    sql,
    result,
    errorMessage,
    history,
    isPending: runQuery.isPending,
    lastDurationMs,
    setSql,
    run,
    loadPreset,
  };
}
