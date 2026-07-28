/**
 * DETALHAMENTO da etapa de funil: a tabela de desfechos, com a linha de total
 * no rodapé. É o que aparece quando o painel abre (as observações ficam em
 * `funnel-notes.tsx`).
 *
 * Extraído do componente do bloco por tamanho e por natureza — aqui é tabela de
 * verdade (`Table` do design system, com cabeçalho e rodapé semânticos), no
 * lugar da grade de `<div>`s que o legado montava com colunas fixas. Isso dá de
 * graça o que a grade não tinha: leitura por linha/coluna em leitor de tela e
 * densidade coerente com as outras tabelas do app.
 *
 * CONTRATO COMUM: os textos que vêm da consulta (título e descrição do
 * desfecho, rótulo da quantidade, título do total) passam por `ChartText` —
 * aceitam Markdown inline e `{{variavel}}`, como qualquer outro texto do
 * catálogo. Os números continuam texto puro: markdown em número formatado não
 * significa nada.
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
import { ChartText } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';
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
  /** Escopo de interpolação dos textos (de `buildChartScope`). */
  scope: ChartScope;
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
export function FunnelRows({ outcomes, total, money, scope }: FunnelRowsProps) {
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
                    <Text weight="medium">
                      <ChartText value={outcome.title} scope={scope} />
                    </Text>
                    {outcome.description ? (
                      <Text type="supporting" color="secondary">
                        <ChartText value={outcome.description} scope={scope} />
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
                        <ChartText value={outcome.quantityLabel} scope={scope} />
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
              <Text weight="semibold">
                <ChartText value={total.title} scope={scope} />
              </Text>
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
