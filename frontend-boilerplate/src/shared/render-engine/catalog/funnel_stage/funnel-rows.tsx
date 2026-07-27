/**
 * Detalhamento da etapa de funil: a tabela de desfechos e a linha de total.
 *
 * Extraído do componente do bloco por tamanho e por natureza — aqui é tabela de
 * verdade (`Table` do design system, com cabeçalho e rodapé semânticos), no
 * lugar da grade de `<div>`s que o legado montava com colunas fixas. Isso dá de
 * graça o que a grade não tinha: leitura por linha/coluna em leitor de tela e
 * densidade coerente com as outras tabelas do app.
 */
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/HStack';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { formatNumberBR } from '@/shared/lib/format';
import { resolveLucideIcon } from '../../lib/lucide-resolver';
import type { FunnelOutcome, FunnelTotal } from './funnel-data';

export interface FunnelRowsProps {
  /** Desfechos da etapa, na ordem da consulta. */
  outcomes: FunnelOutcome[];
  /** Linha de fechamento, quando a consulta a declara. */
  total?: FunnelTotal;
  /** Formata os valores monetários (definido pela prop `valueFormat`). */
  money: (value: unknown) => string;
}

/** Número alinhado à direita — a coluna só é comparável se as casas alinham. */
function NumberCell({ children }: { children: React.ReactNode }) {
  return (
    <HStack hAlign="end" vAlign="center">
      {children}
    </HStack>
  );
}

/** Tabela de desfechos da etapa, com total no rodapé. */
export function FunnelRows({ outcomes, total, money }: FunnelRowsProps) {
  if (outcomes.length === 0 && !total) return null;

  return (
    <Table density="compact" dividers="rows" data-slot="funnel-rows">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Desfecho</TableHeaderCell>
          <TableHeaderCell>Quantidade</TableHeaderCell>
          <TableHeaderCell>Valor original</TableHeaderCell>
          <TableHeaderCell>Valor atualizado</TableHeaderCell>
        </TableRow>
      </TableHeader>

      <TableBody>
        {outcomes.map((outcome) => {
          const OutcomeIcon = resolveLucideIcon(outcome.icon);
          return (
            <TableRow key={outcome.key}>
              <TableCell>
                <HStack gap={2} vAlign="start">
                  {OutcomeIcon ? (
                    <Icon icon={OutcomeIcon} size="sm" color="secondary" />
                  ) : null}
                  <VStack gap={0.5}>
                    <Text weight="medium">{outcome.title}</Text>
                    {outcome.description ? (
                      <Text type="supporting" color="secondary">
                        {outcome.description}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>
              </TableCell>
              <TableCell>
                <NumberCell>
                  <VStack gap={0.5}>
                    <Text weight="medium" hasTabularNumbers justify="end">
                      {formatNumberBR(outcome.quantity, 0)}
                    </Text>
                    {outcome.quantityLabel ? (
                      <Text type="supporting" color="secondary" justify="end">
                        {outcome.quantityLabel}
                      </Text>
                    ) : null}
                  </VStack>
                </NumberCell>
              </TableCell>
              <TableCell>
                <NumberCell>
                  <Text color="secondary" hasTabularNumbers>
                    {money(outcome.original)}
                  </Text>
                </NumberCell>
              </TableCell>
              <TableCell>
                <NumberCell>
                  <Text weight="medium" hasTabularNumbers>
                    {money(outcome.updated)}
                  </Text>
                </NumberCell>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>

      {total ? (
        <TableFooter>
          <TableRow>
            <TableCell>
              <Text weight="semibold">{total.title}</Text>
            </TableCell>
            <TableCell>
              <NumberCell>
                <Text weight="semibold" hasTabularNumbers>
                  {formatNumberBR(total.quantity, 0)}
                </Text>
              </NumberCell>
            </TableCell>
            <TableCell>
              <NumberCell>
                <Text color="secondary" hasTabularNumbers>
                  {money(total.original)}
                </Text>
              </NumberCell>
            </TableCell>
            <TableCell>
              <NumberCell>
                <Text weight="semibold" hasTabularNumbers>
                  {money(total.updated)}
                </Text>
              </NumberCell>
            </TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}
