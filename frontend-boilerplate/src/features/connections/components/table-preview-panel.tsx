import type { KeyboardEvent } from 'react';
import { Play } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import type { QueryResult } from '../types';
import { QueryResultTable } from './query-result-table';

/**
 * Aba "Dados" — o workspace de consulta, em SPLIT VIEW.
 *
 *   ┌──────────────────────────────┐
 *   │ editor SQL       [Executar]  │  painel de cima
 *   ├──────────────────────────────┤  ← divisor
 *   │ resultado (ordenável,        │  painel de baixo
 *   │ paginado)                    │
 *   └──────────────────────────────┘
 *
 * Antes isto era um MODAL, que cobria a árvore de schema exatamente quando o
 * usuário precisava conferir o nome de uma coluna para escrever a query. Aqui
 * árvore, editor e resultado ficam visíveis ao mesmo tempo.
 *
 * Atende os dois públicos com a mesma peça: ao selecionar uma tabela o SQL já
 * vem pronto e executado (o não técnico só lê o resultado, sem digitar nada);
 * o técnico edita o SELECT ali mesmo e roda com Ctrl/Cmd+Enter.
 *
 * A altura do editor é fixa por `rows` — o `TextArea` do DS não aceita altura
 * em pixel, então um divisor arrastável aqui seria falso.
 */
export interface TablePreviewPanelProps {
  sql: string;
  onSqlChange: (sql: string) => void;
  onRun: () => void;
  isPending: boolean;
  result: QueryResult | null;
  errorMessage: string | null;
  /** Conexão inativa: não consulta e explica o porquê. */
  isDisabled?: boolean;
  disabledReason?: string;
}

/** Linhas do preview pedidas ao backend (`maxRows` do runner). */
const PREVIEW_MAX_ROWS = 100;

export function TablePreviewPanel({
  sql,
  onSqlChange,
  onRun,
  isPending,
  result,
  errorMessage,
  isDisabled,
  disabledReason,
}: TablePreviewPanelProps) {
  const isEmpty = sql.trim().length === 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isEmpty && !isDisabled) onRun();
    }
  };

  if (isDisabled) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Consulta indisponível"
        description={disabledReason ?? 'Conexão inativa — reative para consultar.'}
      />
    );
  }

  return (
    <VStack gap={3}>
      {/* ---------------------------- editor ---------------------------- */}
      <VStack gap={2}>
        <TextArea
          label="Consulta SQL"
          value={sql}
          onChange={onSqlChange}
          onKeyDown={handleKeyDown}
          rows={6}
          hasSpellCheck={false}
          placeholder="SELECT * FROM public.minha_tabela LIMIT 50;"
          description="Somente SELECT/WITH · Ctrl/Cmd + Enter executa."
        />
        <HStack gap={2} justify="between" vAlign="center" wrap="wrap">
          <Text type="supporting" color="secondary" hasTabularNumbers>
            {result
              ? // Resultado no teto = quase certamente há mais linhas na
                // tabela. Dizer "100 linhas" leria como total.
                result.truncated || result.rowCount >= PREVIEW_MAX_ROWS
                ? `Primeiras ${PREVIEW_MAX_ROWS} linhas · ${result.durationMs}ms`
                : `${result.rowCount} ${
                    result.rowCount === 1 ? 'linha' : 'linhas'
                  } · ${result.durationMs}ms`
              : 'Nenhuma execução nesta sessão.'}
          </Text>
          <Button
            label="Executar"
            size="sm"
            variant="primary"
            icon={<Icon icon={Play} />}
            isLoading={isPending}
            isDisabled={isEmpty}
            tooltip={isEmpty ? 'Escreva uma consulta para executar' : undefined}
            onClick={onRun}
          />
        </HStack>
      </VStack>

      <Divider />

      {/* --------------------------- resultado --------------------------- */}
      {isPending ? (
        <VStack gap={1} aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} index={index} width="100%" height={32} radius={1} />
          ))}
        </VStack>
      ) : errorMessage ? (
        <Banner
          status="error"
          container="card"
          title="A consulta falhou"
          description={errorMessage}
          endContent={<Button label="Tentar novamente" size="sm" onClick={onRun} />}
        />
      ) : result ? (
        <QueryResultTable result={result} />
      ) : (
        <EmptyState
          isCompact
          headingLevel={4}
          title="Nenhum resultado ainda"
          description="Escreva uma consulta acima e execute para ver os dados."
        />
      )}
    </VStack>
  );
}
