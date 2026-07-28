import type { KeyboardEvent } from 'react';
import { Play } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import type { QueryResult } from '../types';
import { QueryResultTable } from './query-result-table';

/**
 * Executor de query read-only.
 *
 * Erro de execução (SQL inválido, timeout) fica INLINE, parado na tela — quem
 * itera um SQL precisa da mensagem visível enquanto corrige (o toast da
 * mutação existe, mas some sozinho). O botão desabilita com motivo enquanto
 * não houver SQL, e Ctrl/Cmd+Enter executa sem tirar a mão do teclado.
 */
export interface QueryRunnerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  connectionName: string;
  sql: string;
  onSqlChange: (sql: string) => void;
  onRun: () => void;
  isPending: boolean;
  result: QueryResult | null;
  errorMessage: string | null;
}

export function QueryRunnerDialog({
  isOpen,
  onOpenChange,
  connectionName,
  sql,
  onSqlChange,
  onRun,
  isPending,
  result,
  errorMessage,
}: QueryRunnerDialogProps) {
  const isEmpty = sql.trim().length === 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isEmpty) onRun();
    }
  };

  return (
    // 1080px: resultados reais passam fácil de 10 colunas — em 880 a tabela
    // espremia tudo em truncados. O Dialog do DS limita ao viewport sozinho.
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={1080} purpose="form">
      <DialogHeader
        title="Executar query"
        subtitle={`${connectionName} · somente SELECT/WITH · máximo de 100 linhas no preview`}
        onOpenChange={onOpenChange}
        hasDivider
      />
      <VStack gap={3}>
        <TextArea
          label="SQL"
          value={sql}
          onChange={onSqlChange}
          onKeyDown={handleKeyDown}
          rows={6}
          hasSpellCheck={false}
          placeholder="SELECT * FROM public.minha_tabela LIMIT 50;"
          description="Ctrl/Cmd + Enter executa."
        />
        <HStack gap={2} vAlign="center" justify="between" wrap="wrap">
          <Text type="supporting" color="secondary" hasTabularNumbers>
            {result
              ? `${result.rowCount} ${result.rowCount === 1 ? 'linha' : 'linhas'} · ${
                  result.durationMs
                }ms${result.truncated ? ' · truncado' : ''}`
              : 'Nenhuma execução nesta sessão.'}
          </Text>
          <Button
            label="Executar"
            variant="primary"
            icon={<Icon icon={Play} />}
            isLoading={isPending}
            isDisabled={isEmpty}
            tooltip={isEmpty ? 'Escreva uma query para executar' : undefined}
            onClick={onRun}
          />
        </HStack>
        {errorMessage ? (
          <Banner
            status="error"
            container="card"
            title="A query falhou"
            description={errorMessage}
          />
        ) : null}
        {result ? <QueryResultTable result={result} /> : null}
      </VStack>
    </Dialog>
  );
}
