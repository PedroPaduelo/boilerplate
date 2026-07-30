/**
 * As campanhas em andamento — o que aconteceu depois que alguém clicou em
 * "Gerar malha fiscal".
 *
 * A coluna que importa é a de valores: previsto × recuperado. É ela que
 * responde se a malha valeu a pena, e é por isso que a barra de
 * autorregularização fica ao lado do valor, e não numa tela de relatório
 * separada.
 */
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatCompactBRL, formatDate, formatNumberBR } from '@/shared/lib/format';
import { VARIANTE_STATUS_MALHA } from '../lib/aparencia';
import {
  ROTULO_STATUS_MALHA,
  formatPA,
  nomeCriterio,
  nomeEquipe,
} from '../lib/dominio';
import type { MalhaGerada } from '../types';

const COLUNAS = [
  'Lote',
  'Critério e período',
  'Equipe',
  'Retidos',
  'Previsto × recuperado',
  'Autorregularização',
  'Prazo',
  'Situação',
] as const;

const LINHAS_ESQUELETO = 4;

export interface MalhasTableProps {
  malhas: MalhaGerada[];
  isLoading: boolean;
  /** Lote recém-criado — ganha destaque por um momento. */
  destaqueId?: string | null;
}

export function MalhasTable({ malhas, isLoading, destaqueId }: MalhasTableProps) {
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={3}>Malhas em execução</Heading>
          <Text type="supporting">
            Campanhas abertas a partir dos recortes, com o previsto e o efetivamente
            recuperado até aqui.
          </Text>
        </VStack>

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
              : malhas.map((malha) => {
                  const taxa =
                    malha.notificados > 0
                      ? (malha.autorregularizados / malha.notificados) * 100
                      : 0;

                  return (
                    <TableRow key={malha.id}>
                      <TableCell>
                        <HStack gap={2} vAlign="center">
                          <Text weight="medium" hasTabularNumbers>
                            {malha.codigo}
                          </Text>
                          {malha.id === destaqueId ? (
                            <Badge variant="success" label="Nova" />
                          ) : null}
                        </HStack>
                      </TableCell>

                      <TableCell>
                        <VStack gap={0.5}>
                          <Text maxLines={1}>{nomeCriterio(malha.criterio)}</Text>
                          <Text type="supporting" hasTabularNumbers>
                            {formatPA(malha.paInicial)} a {formatPA(malha.paFinal)}
                          </Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <Text type="supporting" maxLines={1}>
                          {nomeEquipe(malha.equipeId)}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <Text hasTabularNumbers>
                          {formatNumberBR(malha.totalContribuintes, 0)}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <VStack gap={0.5}>
                          <Text weight="medium" hasTabularNumbers>
                            {formatCompactBRL(malha.valorApurado)}
                          </Text>
                          <Text type="supporting" hasTabularNumbers>
                            de {formatCompactBRL(malha.valorPrevisto)}
                          </Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <VStack gap={1} width={140}>
                          <ProgressBar
                            label={`Autorregularização da malha ${malha.codigo}`}
                            isLabelHidden
                            value={taxa}
                            variant={taxa >= 50 ? 'success' : 'accent'}
                          />
                          <Text type="supporting" hasTabularNumbers>
                            {formatNumberBR(taxa, 1)}% de {malha.notificados} notificados
                          </Text>
                        </VStack>
                      </TableCell>

                      <TableCell>
                        <Text type="supporting" hasTabularNumbers>
                          {formatDate(malha.termino) ?? '—'}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={VARIANTE_STATUS_MALHA[malha.status]}
                          label={ROTULO_STATUS_MALHA[malha.status]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </VStack>
    </Card>
  );
}
