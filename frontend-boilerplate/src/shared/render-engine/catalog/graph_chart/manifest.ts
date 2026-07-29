/**
 * Manifesto do bloco `graph_chart` (shape 'table') — GRAFO/rede: nós ligados
 * por arestas.
 *
 * Por que shape `table` e não um shape novo: `dataContract.shape` é um enum
 * FECHADO do contrato compartilhado (`scalar | series | categorical | table`),
 * validado com ajv no backend e lido pelo agente. Um grafo tem DUAS listas
 * (nós e ligações), e a forma já usada no catálogo para dado heterogêneo é a
 * do `funnel_stage`: shape `table` com uma coluna `tipo` dizendo o PAPEL de
 * cada linha. Mesma convenção aqui — quem já monta uma etapa de funil monta um
 * grafo sem aprender vocabulário novo.
 *
 * Convenção de DADOS (cada linha traz a coluna `tipo`):
 *  - tipo='no'     → um NÓ. Colunas: id (obrigatório), rotulo (texto exibido,
 *                    default = id), grupo (categoria → cor), valor (número →
 *                    tamanho do nó), camada (inteiro ≥ 0 → posição no layout
 *                    `layered`/`radial`).
 *  - tipo='aresta' → uma LIGAÇÃO dirigida. Colunas: origem, destino (ids),
 *                    valor (número → espessura), rotulo (texto do tooltip).
 *
 * Só a lista de ARESTAS já basta: um id citado em `origem`/`destino` que não
 * foi declarado como nó é criado automaticamente. Isso torna o caso mais comum
 * (`SELECT de, para, volume FROM fluxo`) uma consulta só, sem UNION.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'graph_chart',
  kind: 'chart',
  name: 'Grafo (rede)',
  description:
    'Rede de nós ligados por arestas, com AGLOMERADOS visíveis — mostra COMO as coisas se conectam e por onde o volume flui: grupos econômicos e vínculos entre contribuintes, funil de camadas (N1 → N2 → N3), encadeamento de processos. Aguenta centenas de nós: os satélites (nós de uma ligação só) formam uma coroa em volta do seu hub, o `grupo` puxa os seus para a mesma região da tela, e a marca encolhe conforme a rede cresce. Shape `table`: cada linha tem a coluna `tipo` (no|aresta) que define seu papel. Colunas por tipo: no{id, rotulo?, grupo?, valor?, camada?}; aresta{origem, destino, valor?, rotulo?}. Um id citado em `origem`/`destino` e não declarado vira nó automaticamente — para um fluxo simples basta a lista de arestas. Para declarar nós e arestas na mesma consulta, componha com UNION ALL. O tamanho do nó sai de `valor` (ou, sem ele, do número de ligações); a espessura da aresta sai do `valor` dela.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      layout: {
        type: 'string',
        enum: ['force', 'layered', 'radial'],
        default: 'force',
        description:
          'Como os nós são posicionados. "force" (default) = simulação de forças, o desenho orgânico de mapa de conhecimento: é o layout dos AGLOMERADOS — satélites em coroa ao redor do hub, grupos separados em regiões da tela — e o que se usa para EXPLORAR volume (quem se conecta com quem, quem é periférico, onde estão as pontes entre grupos). "layered" = uma COLUNA por camada, da esquerda para a direita — é o layout do FUNIL: use quando o dado tem `camada`, ou quando as arestas descrevem um fluxo com começo e fim (a camada é deduzida do caminho mais longo até o nó). "radial" = anéis concêntricos, uma camada por anel, do centro para fora: mesma leitura hierárquica do "layered" quando há muitos nós por camada. O desenho é DETERMINÍSTICO nos três: os mesmos dados produzem sempre o mesmo desenho (o painel não muda de forma a cada recarga, e a exportação em PDF sai igual à tela).',
      },
      dimension: {
        type: 'string',
        enum: ['2d', '3d'],
        default: '2d',
        description:
          'Projeção do desenho. "2d" (default) = o mapa plano. "3d" = NUVEM COM PROFUNDIDADE: os aglomerados viram esferas de satélites, quem está perto aparece maior e mais nítido, e ARRASTAR O MOUSE GIRA a nuvem (a rotação inicial é determinística, então painel salvo e PDF mostram sempre o mesmo enquadramento). Só vale com layout "force" — funil e anéis são leituras planas por definição, e com eles a prop é ignorada. Combina especialmente com `background: "dark"`.',
      },
      background: {
        type: 'string',
        enum: ['auto', 'dark'],
        default: 'auto',
        description:
          'Fundo da área de plotagem. "auto" (default) = a superfície do card, como os demais gráficos. "dark" = PALCO ESCURO de mapa estelar: a plotagem ganha o cinza mais profundo do design system, os nós ganham halo luminoso e o cromo clareia para ler sobre ele — o visual clássico de rede de conhecimento. Vale nas duas projeções.',
      },
      showLabels: {
        type: 'boolean',
        default: true,
        description:
          'Escreve o rótulo do nó abaixo dele. Em rede grande o próprio bloco AFINA os rótulos — acima de 16 nós, só os maiores recebem nome, porque duzentos textos de 12px cobririam o desenho —, e o resto continua identificável no tooltip. Desligue para o desenho puro, sem nenhum texto.',
      },
      showArrows: {
        type: 'boolean',
        default: true,
        description:
          'Desenha a ponta de seta no destino de cada ligação. Ligue quando o SENTIDO importa (fluxo, funil, dependência); desligue quando a ligação é apenas uma relação simétrica (coocorrência, similaridade).',
      },
      linkStyle: {
        type: 'string',
        enum: ['straight', 'curved'],
        default: 'straight',
        description:
          'Traçado das ligações: "straight" (default) = reta, a leitura mais limpa; "curved" = arco suave, que separa visualmente o par de ligações de ida e volta entre os mesmos dois nós e alivia o emaranhado quando muitas arestas partem do mesmo ponto.',
      },
      showLegend: {
        type: 'boolean',
        default: true,
        description:
          'Exibe a legenda de GRUPOS (uma marca de cor por grupo + o total do grupo) abaixo do desenho. Sem a coluna `grupo` nos dados — ou com cor única (ver `accent`) — não há o que distinguir e a legenda é omitida de qualquer forma.',
      },
      palette: {
        type: 'string',
        enum: ['single', 'multi'],
        default: 'multi',
        description:
          'Modo de paleta: "multi" (default) cicla a paleta categórica do design system, uma cor por GRUPO — é ela que separa as camadas/famílias de nós; "single" pinta todos os nós com a mesma cor (use quando a rede não tem grupos e a cor não carrega informação).',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      // SEM `default`: o BlockRenderer mescla `defaultProps` em toda
      // renderização e `accent` VENCE a paleta, então um default de fábrica
      // pintaria TODO grafo de uma cor só, apagando a distinção de grupos.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor de TODOS os nós. Declarar `accent` é pedir cor única e vence o modo de paleta — os grupos deixam de ser distinguíveis pela cor (e a legenda some), então use apenas quando a rede tiver um grupo só. OMITA (o padrão) para que cada grupo receba a próxima cor da paleta de dados do design system.',
      },
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'number',
        description:
          'Formato PT-BR dos valores exibidos na legenda, nos tooltips e na leitura de rodapé. ENUM FECHADO: BRL, compactBRL, number, compactNumber, percent. Default "number" (contagem): escolha "BRL"/"compactBRL" QUANDO A MEDIDA FOR DINHEIRO — o bloco não adivinha a natureza do dado.',
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
        { key: 'id', label: 'id', type: 'string' },
        { key: 'rotulo', label: 'rotulo', type: 'string' },
        { key: 'grupo', label: 'grupo', type: 'string' },
        { key: 'camada', label: 'camada', type: 'number' },
        { key: 'origem', label: 'origem', type: 'string' },
        { key: 'destino', label: 'destino', type: 'string' },
        { key: 'valor', label: 'valor', type: 'number' },
      ],
      rows: [
        {
          tipo: 'no',
          id: 'lancado',
          rotulo: 'Lançado',
          grupo: 'N1 · Lançamento',
          camada: 0,
          valor: 10835362,
        },
        {
          tipo: 'no',
          id: 'pago',
          rotulo: 'Pago',
          grupo: 'N2 · Cobrança',
          camada: 1,
          valor: 8060686,
        },
        {
          tipo: 'no',
          id: 'inscrito',
          rotulo: 'Inscrito em DA',
          grupo: 'N2 · Cobrança',
          camada: 1,
          valor: 2774676,
        },
        { tipo: 'aresta', origem: 'lancado', destino: 'pago', valor: 8060686 },
        { tipo: 'aresta', origem: 'lancado', destino: 'inscrito', valor: 2774676 },
      ],
    },
  },
  // `accent` NÃO tem default (ver a nota no schema).
  defaultProps: {
    layout: 'force',
    dimension: '2d',
    background: 'auto',
    showLabels: true,
    showArrows: true,
    linkStyle: 'straight',
    showLegend: true,
    palette: 'multi',
    valueFormat: 'number',
  },
  /**
   * Teto de LINHAS da consulta (nós + arestas somados).
   *
   * Era 600 na 1.0.0, calibrado para uma simulação que colocava TODO nó no laço
   * O(n²). Na 1.1.0 os satélites saem da simulação (viram coroa em volta do
   * hub), então o que custa é o ESQUELETO — algumas dezenas de nós numa rede de
   * centenas. O teto passa a ser o do DESENHO, não o do cálculo: acima disso o
   * SVG tem mais marcas do que a tela tem pixels, e o que se vê é uma mancha.
   */
  maxRows: 1500,
  version: '1.2.0',
} satisfies BlockManifest;
