/**
 * Os campos do lote, em três passos.
 *
 * Por que passos e não um formulão: parametrizar uma malha é decidir três
 * coisas de natureza diferente — O QUE fiscalizar, QUEM fiscaliza e a
 * conferência final. Empilhar tudo numa tela só faz a data de prazo parecer
 * tão banal quanto o nome do lote, e ela não é: é dela que sai a contagem de
 * ciência do contribuinte.
 *
 * Quantidade e prazo são SELEÇÃO, não digitação: os valores praticados são
 * poucos e conhecidos, e escolher da lista evita o lote de 7 contribuintes
 * nascido de um zero a menos.
 */
import { Selector } from '@astryxdesign/core/Selector';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { formatCompactBRL, formatNumberBR } from '@/shared/lib/format';
import { CRITERIOS, EQUIPES, JANELA_PA, formatPA, nomeCriterio, nomeEquipe } from '../lib/dominio';
import type { CriterioId, ParametrosMalha } from '../types';

/** Tetos de lote praticados pela fiscalização. */
export const QUANTIDADES = [30, 50, 100, 150, 200, 300];

/** Prazos de ciência previstos na notificação. */
export const PRAZOS = [15, 30, 45, 60];

const ORDENACOES: { value: ParametrosMalha['ordenacao']; label: string }[] = [
  { value: 'maior-diferenca', label: 'Maior diferença apurada' },
  { value: 'maior-risco', label: 'Maior risco fiscal' },
  { value: 'mais-competencias', label: 'Mais competências irregulares' },
  { value: 'cnpj', label: 'CNPJ (crescente)' },
];

export interface PassosProps {
  parametros: ParametrosMalha;
  onChange: (parametros: ParametrosMalha) => void;
}

/** Passo 1 — o que vai ser fiscalizado. */
export function PassoLote({ parametros, onChange }: PassosProps) {
  return (
    <VStack gap={4}>
      <TextInput
        label="Nome do lote"
        value={parametros.nome}
        onChange={(nome) => onChange({ ...parametros, nome })}
        description="Como a campanha aparece nas listagens e nas notificações internas."
      />

      <Selector
        label="Critério de irregularidade"
        value={parametros.criterio}
        options={CRITERIOS.map((criterio) => ({ value: criterio.id, label: criterio.nome }))}
        onChange={(value) =>
          onChange({ ...parametros, criterio: (value || parametros.criterio) as CriterioId })
        }
        description={CRITERIOS.find((c) => c.id === parametros.criterio)?.descricao}
      />

      <HStack gap={3} wrap="wrap">
        <Selector
          label="Competência inicial"
          value={parametros.paInicial}
          options={JANELA_PA.map((pa) => ({ value: pa, label: formatPA(pa) }))}
          onChange={(value) => onChange({ ...parametros, paInicial: value || parametros.paInicial })}
        />
        <Selector
          label="Competência final"
          value={parametros.paFinal}
          options={JANELA_PA.map((pa) => ({ value: pa, label: formatPA(pa) }))}
          onChange={(value) => onChange({ ...parametros, paFinal: value || parametros.paFinal })}
        />
      </HStack>

      <HStack gap={3} wrap="wrap">
        <Selector
          label="Contribuintes no lote"
          value={String(parametros.quantidadeOptantes)}
          options={QUANTIDADES.map((quantidade) => ({
            value: String(quantidade),
            label: `Até ${quantidade} contribuintes`,
          }))}
          onChange={(value) =>
            onChange({
              ...parametros,
              quantidadeOptantes: Number(value) || parametros.quantidadeOptantes,
            })
          }
        />
        <Selector
          label="Priorização"
          value={parametros.ordenacao}
          options={ORDENACOES}
          onChange={(value) =>
            onChange({
              ...parametros,
              ordenacao: (value || parametros.ordenacao) as ParametrosMalha['ordenacao'],
            })
          }
        />
      </HStack>
    </VStack>
  );
}

/** Passo 2 — quem executa e em quanto tempo. */
export function PassoEquipe({ parametros, onChange }: PassosProps) {
  const equipe = EQUIPES.find((item) => item.id === parametros.equipeId);

  return (
    <VStack gap={4}>
      <Selector
        label="Equipe responsável"
        value={parametros.equipeId}
        options={EQUIPES.map((item) => ({ value: item.id, label: item.nome }))}
        onChange={(value) => onChange({ ...parametros, equipeId: value || parametros.equipeId })}
        description={
          equipe ? `${equipe.auditores} auditores disponíveis nesta equipe.` : undefined
        }
      />

      <Selector
        label="Prazo para autorregularização"
        value={String(parametros.prazoCiencia)}
        options={PRAZOS.map((dias) => ({ value: String(dias), label: `${dias} dias` }))}
        onChange={(value) =>
          onChange({ ...parametros, prazoCiencia: Number(value) || parametros.prazoCiencia })
        }
        description="Contado a partir da ciência da notificação no domicílio tributário eletrônico."
      />

      <Divider />

      <Text type="supporting">
        Ao fim do prazo, quem não apresentar declaração retificadora fica disponível para
        abertura de ordem de serviço e ação fiscal.
      </Text>
    </VStack>
  );
}

export interface PassoRevisaoProps {
  parametros: ParametrosMalha;
  totalRecorte: number;
  diferencaRecorte: number;
}

/** Passo 3 — a conferência antes de reter contribuinte. */
export function PassoRevisao({
  parametros,
  totalRecorte,
  diferencaRecorte,
}: PassoRevisaoProps) {
  const retidos = Math.min(totalRecorte, parametros.quantidadeOptantes);

  const linhas: [string, string][] = [
    ['Lote', parametros.nome],
    ['Critério', nomeCriterio(parametros.criterio)],
    ['Período de apuração', `${formatPA(parametros.paInicial)} a ${formatPA(parametros.paFinal)}`],
    ['Equipe', nomeEquipe(parametros.equipeId)],
    ['Prazo de autorregularização', `${parametros.prazoCiencia} dias`],
    [
      'Contribuintes a reter',
      `${formatNumberBR(retidos, 0)} de ${formatNumberBR(totalRecorte, 0)} no recorte`,
    ],
    ['Diferença apurada do recorte', formatCompactBRL(diferencaRecorte)],
  ];

  return (
    <VStack gap={3}>
      {linhas.map(([rotulo, valor]) => (
        <HStack key={rotulo} gap={4} hAlign="between" vAlign="start">
          <Text type="supporting">{rotulo}</Text>
          <Text weight="medium">{valor}</Text>
        </HStack>
      ))}
    </VStack>
  );
}
