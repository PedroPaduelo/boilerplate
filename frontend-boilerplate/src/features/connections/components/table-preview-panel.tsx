import { RefreshCw, Terminal } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { useTablePreview, PREVIEW_MAX_ROWS } from '../use-table-preview';
import { QueryResultTable } from './query-result-table';

/**
 * Aba "Dados" do inspetor de tabela: amostra automática das primeiras linhas.
 *
 * É a resposta ao usuário não técnico — ver o conteúdo sem escrever SQL. Para
 * o técnico, o "Abrir no editor SQL" entrega a mesma consulta pré-preenchida
 * no executor, pronta para refinar (WHERE, colunas, joins).
 *
 * Estados: carregando (skeleton), erro (banner inline com retry — nada de
 * toast em carga automática), tabela vazia (que para um auditor é um achado,
 * não um erro) e conexão inativa (bloqueio com motivo).
 */
export interface TablePreviewPanelProps {
  connectionId: string;
  schema: string;
  table: string;
  /** Conexão inativa: não dispara consulta e explica o porquê. */
  isDisabled?: boolean;
  disabledReason?: string;
  /** Abre o executor SQL já com o SELECT da amostra. */
  onOpenSql: () => void;
}

export function TablePreviewPanel({
  connectionId,
  schema,
  table,
  isDisabled,
  disabledReason,
  onOpenSql,
}: TablePreviewPanelProps) {
  const preview = useTablePreview(connectionId, schema, table, !isDisabled);

  if (isDisabled) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Amostra indisponível"
        description={disabledReason ?? 'Conexão inativa — reative para consultar.'}
      />
    );
  }

  return (
    <VStack gap={2}>
      <HStack gap={2} justify="between" vAlign="center" wrap="wrap">
        <Text type="supporting" color="secondary" hasTabularNumbers>
          {preview.result
            ? // Amostra cheia = quase certeza de que há mais linhas na tabela.
              // Dizer "50 linhas" leria como o total — engana quem não é técnico.
              preview.result.truncated || preview.result.rowCount >= PREVIEW_MAX_ROWS
              ? `Primeiras ${PREVIEW_MAX_ROWS} linhas · ${preview.result.durationMs}ms`
              : `${preview.result.rowCount} ${
                  preview.result.rowCount === 1 ? 'linha' : 'linhas'
                } (tabela completa) · ${preview.result.durationMs}ms`
            : `Amostra de até ${PREVIEW_MAX_ROWS} linhas · somente leitura`}
        </Text>
        <HStack gap={1} vAlign="center">
          <Button
            label="Atualizar"
            size="sm"
            variant="ghost"
            icon={<Icon icon={RefreshCw} />}
            isLoading={preview.isPending}
            onClick={preview.run}
          />
          <Button
            label="Abrir no editor SQL"
            size="sm"
            variant="ghost"
            icon={<Icon icon={Terminal} />}
            onClick={onOpenSql}
          />
        </HStack>
      </HStack>

      {preview.isPending ? (
        <VStack gap={1} aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} index={index} width="100%" height={32} radius={1} />
          ))}
        </VStack>
      ) : preview.errorMessage ? (
        <Banner
          status="error"
          container="card"
          title="Não foi possível carregar a amostra"
          description={preview.errorMessage}
          endContent={<Button label="Tentar novamente" size="sm" onClick={preview.run} />}
        />
      ) : preview.result && preview.result.rows.length === 0 ? (
        <EmptyState
          isCompact
          headingLevel={4}
          title="Tabela sem registros"
          description="A tabela existe e está acessível, mas não tem nenhuma linha."
        />
      ) : preview.result ? (
        <QueryResultTable result={preview.result} />
      ) : null}
    </VStack>
  );
}
