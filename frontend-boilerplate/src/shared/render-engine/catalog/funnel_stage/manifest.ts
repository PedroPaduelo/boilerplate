/**
 * Manifesto do bloco `funnel_stage` (shape 'table') — uma ETAPA de um funil
 * temporal (N1/N2/N3...), renderizada como um PAINEL COLAPSÁVEL próprio
 * (self-contained: NÃO recebe a moldura ChartWidget).
 *
 * Estrutura visual:
 *  - header (clicável, abre/fecha): rótulo da etapa (stageLabel), o valor da
 *    etapa, a taxa de conversão (% do universo), o volume e a barra de
 *    participação segmentada pelos desfechos — tudo visível mesmo com a etapa
 *    fechada;
 *  - (ao abrir) tabela de desfechos: ícone + título + descrição + quantidade +
 *    valor original + valor atualizado; linha de TOTAL; e NOTAS opcionais.
 *
 * Todo campo de texto (stageLabel, barLabel, emptyMessage e os textos que vêm
 * da consulta) aceita Markdown inline e `{{variavel}}` interpolada dos dados.
 *
 * Convenção de DADOS (shape table — cada linha tem a coluna `tipo`):
 *  - tipo='resumo'  → header/barra. Colunas: quantidade, pct (FRAÇÃO 0..1 =
 *                     participação no universo), valor (o valor grande do header).
 *  - tipo='desfecho'→ linha da tabela. Colunas: icone (nome lucide, ex.
 *                     'CircleCheck'), desfecho (título), descricao (subtítulo),
 *                     quantidade, quantidade_label (opcional, ex. 'acordos'),
 *                     valor_original, valor_atualizado.
 *  - tipo='total'   → rodapé. Colunas: desfecho (nome do total), quantidade,
 *                     valor_original, valor_atualizado.
 *  - tipo='nota'    → bloco de observação no fim. Colunas: desfecho, descricao,
 *                     valor_atualizado (opcional).
 * Monte com UNION ALL (cada parte é um SELECT pequeno) ordenando por uma coluna
 * auxiliar para o resumo vir primeiro, depois os desfechos, depois o total.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'funnel_stage',
  kind: 'chart',
  name: 'Etapa de Funil',
  description:
    'Painel COLAPSÁVEL de uma ETAPA de funil temporal (N1/N2/N3...). Header com resumo (quantidade + % do universo + valor), barra de participação segmentada e, ao expandir, tabela de desfechos (ícone + título + descrição + quantidade + valor original + valor atualizado) com linha de total e notas. Shape `table`: cada linha tem a coluna `tipo` (resumo|desfecho|total|nota) que define seu papel. Componha com UNION ALL (queries pequenas). Colunas por tipo: resumo{quantidade,pct(fração 0..1),valor}; desfecho{icone,desfecho,descricao,quantidade,quantidade_label?,valor_original,valor_atualizado}; total{desfecho,quantidade,valor_original,valor_atualizado}; nota{desfecho,descricao,valor_atualizado?}.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['stageLabel'],
    properties: {
      stageLabel: {
        type: 'string',
        description:
          'Rótulo da etapa no header (ex.: "N1 · MOMENTO LANÇAMENTO"). Aceita Markdown inline e {{variavel}}.',
      },
      accent: {
        type: 'string',
        enum: ['blue', 'red', 'green', 'amber', 'violet', 'slate'],
        description:
          'Cor da etapa: escolhe qual RAMPA sequencial do design system pinta a barra de participação (os segmentos vão do tom mais claro ao mais escuro, porque são partes ordenadas do mesmo total; o hover escurece um passo). blue (default) p/ fases iniciais; red p/ estoque/risco; amber/green/violet/slate p/ variações. Os textos seguem as cores de leitura do sistema, para não perder contraste.',
      },
      defaultOpen: {
        type: 'boolean',
        description:
          'Se a etapa começa expandida (mostrando a tabela). false (default) = só header + resumo + barra.',
      },
      barLabel: {
        type: 'string',
        description:
          'Legenda exibida sob a barra (ex.: "valor total lançado (VL_ORIGINAL)"). Aceita Markdown inline e {{variavel}}.',
      },
      emptyMessage: {
        type: 'string',
        description:
          'Mensagem exibida quando a consulta não devolve nenhuma linha com papel reconhecido. Default: "Sem dados para esta etapa". Aceita Markdown inline e {{variavel}}.',
      },
      valueFormat: {
        type: 'string',
        enum: ['BRL', 'compactBRL'],
        description:
          'Formato dos valores monetários. BRL = completo (R$ 3.745.086.826,03, default); compactBRL = compacto ("R$ 3,74 bi").',
      },
    },
  },
  dataContract: {
    shape: 'table',
    spec: {
      columns: { type: 'array', required: true },
      rows: { type: 'array', required: true },
    },
    example: {
      columns: [
        { key: 'tipo', label: 'tipo', type: 'string' },
        { key: 'desfecho', label: 'desfecho', type: 'string' },
        { key: 'quantidade', label: 'quantidade', type: 'number' },
        { key: 'valor_original', label: 'valor_original', type: 'number' },
        { key: 'valor_atualizado', label: 'valor_atualizado', type: 'number' },
      ],
      rows: [
        { tipo: 'resumo', quantidade: 10835362, pct: 1, valor: 3745086826.03 },
        {
          tipo: 'desfecho',
          icone: 'CircleCheck',
          desfecho: 'Pago como lançamento',
          descricao: 'Pago e nunca inscrito em Dívida Ativa.',
          quantidade: 8060686,
          valor_original: 2767231605.76,
          valor_atualizado: 5250514766.99,
        },
        {
          tipo: 'total',
          desfecho: 'Total lançado',
          quantidade: 10835362,
          valor_original: 3745086826.03,
          valor_atualizado: 8794434214.41,
        },
      ],
    },
  },
  /**
   * `accent` NÃO tem default aqui de propósito. O `BlockRenderer` mescla
   * `defaultProps` em toda renderização, então um default no manifesto chega ao
   * componente indistinguível de uma escolha do autor — e era por isso que toda
   * etapa de funil saía azul num catálogo inteiro verde, sem ninguém ter pedido
   * azul. Ausência = "não escolhi" = acento do produto (ver `DEFAULT_RAMP` no
   * componente); as seis cores do enum continuam valendo quando pedidas.
   */
  defaultProps: { defaultOpen: false, valueFormat: 'BRL' },
  maxRows: 50,
  version: '1.0.0',
} satisfies BlockManifest;
