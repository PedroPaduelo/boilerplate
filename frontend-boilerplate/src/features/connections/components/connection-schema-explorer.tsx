import { useMemo } from 'react';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Skeleton,
} from '@/components/ui';
import { DbSchemaExplorer } from '@/components/ui/db-schema-explorer';
import { useConnectionSchema } from '../hooks';
import { toDatabaseSchema } from '../lib/schema-mapper';
import type { Connection, ConnectionSchema } from '../types';

/**
 * View PRESENTACIONAL do schema explorer — recebe os dados já resolvidos e
 * renderiza o componente Vitrine `DbSchemaExplorer`. Sem rede/query: testável
 * de forma determinística com dados mock.
 */
export function SchemaExplorerView({
  schema,
  connection,
}: {
  schema: ConnectionSchema;
  connection: Pick<
    Connection,
    'id' | 'name' | 'database' | 'host' | 'port'
  >;
}) {
  const database = useMemo(
    () => toDatabaseSchema(schema, connection),
    [schema, connection],
  );

  if (schema.tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Database className="size-6" />
        </span>
        <p className="text-sm font-medium text-foreground">
          Nenhuma tabela encontrada
        </p>
        <p className="mx-auto max-w-xs text-xs text-muted-foreground">
          A introspecção não retornou tabelas para esta conexão.
        </p>
      </div>
    );
  }

  return <DbSchemaExplorer database={database} />;
}

interface ConnectionSchemaDialogProps {
  connection: Connection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog que busca o schema da conexão (lazy, só quando aberto) e exibe estados
 * de loading/erro/sucesso, delegando o render para `SchemaExplorerView`.
 */
export function ConnectionSchemaDialog({
  connection,
  open,
  onOpenChange,
}: ConnectionSchemaDialogProps) {
  const {
    data: schema,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useConnectionSchema(connection?.id, open && !!connection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/60 p-4">
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-4" />
            Schema · {connection?.name}
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            className="mr-6 gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Atualizar
          </Button>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Não foi possível carregar o schema
              </p>
              <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                {(error as Error)?.message ??
                  'Verifique a conectividade da conexão e tente novamente.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : schema && connection ? (
            <SchemaExplorerView schema={schema} connection={connection} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
