/**
 * A barra de escopo — onde o clique no gráfico vira decisão.
 *
 * Ela existe por dois motivos:
 *  1. ESCREVER o que foi selecionado. Um filtro que só existe como "estado do
 *     gráfico" faz a pessoa gerar um lote sem saber exatamente do que ele é;
 *  2. dar um caminho POR TECLADO para o mesmo recorte. O clique na fatia é
 *     atalho de mouse; estes três seletores são a rota acessível equivalente.
 *
 * É também onde mora a ação principal da tela: gerar a malha do recorte.
 */
import { Eraser, FileSearch } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { formatCompactBRL, formatNumberBR } from '@/shared/lib/format';
import { CRITERIOS, FAIXAS, JANELA_PA, formatPA } from '../lib/dominio';
import type { CriterioId, EscopoMalha, FaixaId } from '../types';

export interface MalhaEscopoProps {
  escopo: EscopoMalha;
  onChange: (escopo: EscopoMalha) => void;
  /** Contribuintes do recorte. `undefined` enquanto apura. */
  total: number | undefined;
  diferenca: number | undefined;
  isLoading: boolean;
  /** RBAC: sem `artifacts:manage` a pessoa consulta, mas não gera lote. */
  canGerar: boolean;
  onGerar: () => void;
}

const SEM_FILTRO = 'todos';

export function MalhaEscopo({
  escopo,
  onChange,
  total,
  diferenca,
  isLoading,
  canGerar,
  onGerar,
}: MalhaEscopoProps) {
  const temRecorte = Boolean(escopo.criterio || escopo.competencia || escopo.faixa);
  const semContribuintes = total === 0;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={3}>Escopo da fiscalização</Heading>
          <Text type="supporting">
            O recorte abaixo define quem entra no lote. Ele acompanha os cliques nos
            gráficos — e pode ser ajustado aqui.
          </Text>
        </VStack>

        <HStack gap={3} wrap="wrap" vAlign="end">
          <Selector
            label="Critério"
            value={escopo.criterio ?? SEM_FILTRO}
            options={[
              { value: SEM_FILTRO, label: 'Todos os critérios' },
              ...CRITERIOS.map((criterio) => ({ value: criterio.id, label: criterio.nome })),
            ]}
            onChange={(value) =>
              onChange({
                ...escopo,
                criterio: !value || value === SEM_FILTRO ? undefined : (value as CriterioId),
              })
            }
          />

          <Selector
            label="Competência"
            value={escopo.competencia ?? SEM_FILTRO}
            options={[
              { value: SEM_FILTRO, label: 'Todas as competências' },
              ...JANELA_PA.map((pa) => ({ value: pa, label: formatPA(pa) })),
            ]}
            onChange={(value) =>
              onChange({
                ...escopo,
                competencia: !value || value === SEM_FILTRO ? undefined : value,
              })
            }
          />

          <Selector
            label="Materialidade"
            value={escopo.faixa ?? SEM_FILTRO}
            options={[
              { value: SEM_FILTRO, label: 'Todas as faixas' },
              ...FAIXAS.map((faixa) => ({ value: faixa.id, label: faixa.rotulo })),
            ]}
            onChange={(value) =>
              onChange({
                ...escopo,
                faixa: !value || value === SEM_FILTRO ? undefined : (value as FaixaId),
              })
            }
          />
        </HStack>

        <Divider />

        <HStack gap={4} hAlign="between" vAlign="center" wrap="wrap">
          {isLoading || total === undefined ? (
            <Skeleton width={280} height={20} radius={1} />
          ) : (
            <Text type="body" hasTabularNumbers>
              <strong>{formatNumberBR(total, 0)}</strong>
              {' contribuintes no recorte · '}
              <strong>{formatCompactBRL(diferenca ?? 0)}</strong>
              {' de diferença apurada'}
            </Text>
          )}

          <HStack gap={2} wrap="wrap">
            <Button
              label="Limpar recorte"
              size="sm"
              icon={<Icon icon={Eraser} />}
              isDisabled={!temRecorte}
              onClick={() => onChange({})}
            />
            <Button
              variant="primary"
              label="Gerar malha fiscal"
              icon={<Icon icon={FileSearch} />}
              isDisabled={!canGerar || semContribuintes || isLoading}
              disabledMessage={
                !canGerar
                  ? 'Seu perfil pode consultar a malha, mas não gerar lotes de fiscalização.'
                  : semContribuintes
                    ? 'O recorte atual não retém nenhum contribuinte.'
                    : undefined
              }
              onClick={onGerar}
            />
          </HStack>
        </HStack>
      </VStack>
    </Card>
  );
}
