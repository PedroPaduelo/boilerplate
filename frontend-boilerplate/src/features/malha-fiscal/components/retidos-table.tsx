/**
 * Quem exatamente cai no lote — a consequência do clique no gráfico, com nome
 * e CNPJ.
 *
 * A lista fica NA PÁGINA, e não num modal: quem seleção um recorte precisa ver
 * o gráfico e a consequência dele ao mesmo tempo. Modal esconderia justamente o
 * contexto que justifica a decisão.
 *
 * Dado denso e homogêneo é linha de tabela, nunca card por item: a varredura
 * vertical ("onde estão os críticos?") só existe em coluna alinhada.
 */
import { Search } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatBRL, formatNumberBR } from '@/shared/lib/format';
import { formatCnpj } from '../lib/cnpj';
import { ROTULO_DESFECHO, ROTULO_RISCO, formatPA } from '../lib/dominio';
import { VARIANTE_DESFECHO, VARIANTE_RISCO } from '../lib/aparencia';
import type { ContribuinteRetido } from '../types';

const COLUNAS = [
  'CNPJ',
  'Razão social',
  'Competências',
  'Diferença apurada',
  'ISS devido',
  'Risco',
  'Situação',
] as const;

/** Linhas exibidas enquanto a consulta corre — mesma altura das reais. */
const LINHAS_ESQUELETO = 6;

export interface RetidosTableProps {
  itens: ContribuinteRetido[];
  total: number | undefined;
  termo: string;
  onTermoChange: (termo: string) => void;
  isLoading: boolean;
}

export function RetidosTable({
  itens,
  total,
  termo,
  onTermoChange,
  isLoading,
}: RetidosTableProps) {
  const temResultado = itens.length > 0;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack gap={4} hAlign="between" vAlign="end" wrap="wrap">
          <VStack gap={1}>
            <Heading level={3}>Contribuintes retidos</Heading>
            <Text type="supporting">
              {isLoading || total === undefined
                ? 'Apurando o recorte…'
                : `${formatNumberBR(total, 0)} contribuintes no recorte · exibindo os ${formatNumberBR(
                    itens.length,
                    0,
                  )} de maior materialidade`}
            </Text>
          </VStack>

          <TextInput
            label="Buscar contribuinte"
            isLabelHidden
            placeholder="Buscar por CNPJ ou razão social"
            value={termo}
            onChange={onTermoChange}
            startIcon={Search}
            hasClear
            size="sm"
          />
        </HStack>

        {!isLoading && !temResultado ? (
          <EmptyState
            title="Nenhum contribuinte neste recorte"
            description={
              termo
                ? 'Nenhum CNPJ ou razão social corresponde à busca. Ajuste o termo ou limpe o campo.'
                : 'O critério, a competência e a faixa selecionados não retêm ninguém. Ajuste o recorte nos gráficos acima.'
            }
            headingLevel={4}
          />
        ) : (
          <Table density="balanced" dividers="rows" hasHover>
            <TableHeader>
              <TableRow isHeaderRow>
                {COLUNAS.map((coluna) => (
                  <TableHeaderCell key={coluna} scope="col">
                    {coluna}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading
                ? Array.from({ length: LINHAS_ESQUELETO }, (_, index) => (
                    <TableRow key={`esqueleto-${index}`}>
                      {COLUNAS.map((coluna) => (
                        <TableCell key={coluna}>
                          <Skeleton height={18} radius={1} index={index} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : itens.map((contribuinte) => (
                    <TableRow key={contribuinte.id}>
                      <TableCell>
                        <Text weight="medium" hasTabularNumbers>
                          {formatCnpj(contribuinte.cnpj)}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <VStack gap={0.5}>
                          <HStack gap={2} vAlign="center">
                            <Text weight="medium" maxLines={1}>
                              {contribuinte.razaoSocial}
                            </Text>
                            {contribuinte.reincidente ? (
                              <Badge variant="warning" label="Reincidente" />
                            ) : null}
                          </HStack>
                          <Text type="supporting" maxLines={1}>
                            {contribuinte.setor} · {contribuinte.bairro}
                          </Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <VStack gap={0.5}>
                          <Text hasTabularNumbers>{contribuinte.competencias.length}</Text>
                          <Text type="supporting" hasTabularNumbers>
                            {formatPA(contribuinte.competencias[0])} a{' '}
                            {formatPA(
                              contribuinte.competencias[contribuinte.competencias.length - 1],
                            )}
                          </Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <Text weight="medium" hasTabularNumbers>
                          {formatBRL(contribuinte.diferenca)}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <Text hasTabularNumbers>{formatBRL(contribuinte.issDevido)}</Text>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={VARIANTE_RISCO[contribuinte.risco]}
                          label={ROTULO_RISCO[contribuinte.risco]}
                        />
                      </TableCell>

                      <TableCell>
                        <HStack gap={2} vAlign="center">
                          <StatusDot
                            variant={VARIANTE_DESFECHO[contribuinte.desfecho]}
                            label={ROTULO_DESFECHO[contribuinte.desfecho]}
                          />
                          <Text type="supporting" maxLines={1}>
                            {ROTULO_DESFECHO[contribuinte.desfecho]}
                          </Text>
                        </HStack>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </VStack>
    </Card>
  );
}
