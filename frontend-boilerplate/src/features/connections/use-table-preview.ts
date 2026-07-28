import { useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { connectionsApi } from './api';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { buildSelectPreview } from './lib/ddl';
import type { QueryResult, RunQueryInput } from './types';

/**
 * Amostra de dados da tabela selecionada — o caminho SEM SQL do workbench.
 *
 * Existe para o usuário NÃO técnico: a pergunta nº 1 de quem audita ("o que
 * tem dentro desta tabela?") não pode exigir escrever `SELECT`. O hook roda o
 * mesmo preview que o botão "Consultar" pré-preenche (`SELECT … LIMIT 50`,
 * read-only, row cap do backend), mas exibe o resultado inline na aba Dados.
 *
 * Mutação própria (e não `useRunConnectionQuery`) de propósito: aquela reporta
 * erro por toast — certo para uma ação disparada pelo usuário, errado para uma
 * carga automática de aba. Aqui o erro fica em `errorMessage`, renderizado
 * INLINE onde o dado apareceria, com retry do lado.
 */

/** Linhas da amostra — o suficiente para "ver o dado" sem pesar o preview. */
export const PREVIEW_MAX_ROWS = 50;

export interface TablePreview {
  result: QueryResult | null;
  errorMessage: string | null;
  isPending: boolean;
  /** Recarrega a amostra (botão "Atualizar" e retry do banner de erro). */
  run: () => void;
}

export function useTablePreview(
  connectionId: string,
  schema: string,
  table: string,
  /** `false` bloqueia a carga automática (ex.: conexão inativa). */
  enabled: boolean,
): TablePreview {
  const mutation = useMutation({
    mutationFn: (input: RunQueryInput) => connectionsApi.runQuery(input),
  });
  const { mutate } = mutation;

  const run = useCallback(() => {
    mutate({
      id: connectionId,
      sql: buildSelectPreview(schema, table),
      maxRows: PREVIEW_MAX_ROWS,
    });
  }, [mutate, connectionId, schema, table]);

  // Auto-carrega ao montar. O painel é REMONTADO por `key` a cada troca de
  // tabela (ver TableInfoPanel), então "montar" == "selecionou esta tabela".
  useEffect(() => {
    if (enabled) run();
  }, [enabled, run]);

  return {
    result: mutation.data ?? null,
    errorMessage: mutation.isError
      ? getApiErrorMessage(mutation.error, 'Não foi possível carregar a amostra.')
      : null,
    isPending: mutation.isPending,
    run,
  };
}
