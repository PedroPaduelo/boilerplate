/**
 * Tipos TS derivados dos JSON Schemas via `json-schema-to-ts` (ZERO Zod).
 *
 * Os tipos são inferidos do schema `as const` — mudar o schema muda o tipo
 * automaticamente. Para schemas que usam $ref externo (por $id), o tipo é
 * composto à mão reaproveitando os tipos já derivados (sem reescrever contrato).
 */
import type { FromSchema } from 'json-schema-to-ts';
import type {
  BlockManifestSchema,
  ScalarDataSchema,
  SeriesDataSchema,
  CategoricalDataSchema,
  TableDataSchema,
  BlockDataResultSchema,
  DashboardDataPayloadSchema,
  BlockQueuedEventSchema,
  BlockRunningEventSchema,
  BlockDataEventSchema,
  BlockErrorEventSchema,
  ApiErrorSchema,
  DashboardSummarySchema,
  CreateDashboardRequestSchema,
  UpdateDashboardRequestSchema,
  BlockDataRequestSchema,
} from '../schemas';

// ---------- Camada 1: LAYOUT ----------
// Tipos MANUAIS: o `block` é RECURSIVO (campo `blocks` = filhos), e o
// `json-schema-to-ts` (FromSchema) não deriva `$ref` recursivo. O schema neutro
// (`DashboardLayoutSchema`) segue sendo a fonte de validação em RUNTIME (ajv);
// estes tipos espelham o schema 1:1.
export type FilterType =
  | 'date_range'
  | 'select'
  | 'multiselect'
  | 'search'
  | 'number_range';

export interface Filter {
  id: string;
  type: FilterType;
  label: string;
  /** valor inicial do filtro — shape depende do tipo. */
  default?: unknown;
}

export interface DataBindingParam {
  filterId: string;
  as: string;
}

export interface DataBinding {
  connectionId: string;
  query: string;
  params?: DataBindingParam[];
  /** mapeamento resultado→shape do bloco (ref nomeada ou objeto declarativo). */
  transform?: unknown;
  ttlSeconds?: number;
}

export interface Block {
  id: string;
  /** catalogType (ex.: kpi, bar_chart, rich_text, section). */
  type: string;
  /** largura no grid de 12 colunas do container pai (row ou bloco-container). */
  span: number;
  /**
   * altura no mosaico — quantas linhas o bloco ocupa em containers que usam
   * grid (ex.: bento_grid). Opcional; default 1. Lido pelo render-engine.
   */
  rowSpan?: number;
  /**
   * altura declarada do bloco (degrau nomeado ou pixels). Sobrepõe a da LINHA
   * — exceção pontual, não o caminho normal (ver `Row.height`).
   */
  height?: BlockHeight;
  /** título do card (header do frame). Se ausente, o render usa o `manifest.name`. */
  title?: string;
  /** subtítulo do header. */
  subtitle?: string;
  /**
   * Texto de apoio do cabeçalho — o "o que este gráfico responde", uma linha
   * abaixo do subtítulo. Aceita Markdown e `{{variaveis}}`, como todo texto do
   * card.
   *
   * O render-engine JÁ lia este campo; o contrato é que não o declarava, e com
   * `additionalProperties: false` isso significava que um layout com
   * `description` no bloco era REJEITADO na validação. Declarar aqui é fechar
   * essa lacuna, não abrir capacidade nova.
   */
  description?: string;
  /**
   * UNIDADE da métrica ("R$", "%", "processos", "dias"). Aparece junto do
   * título, discreta.
   *
   * Existe porque a unidade costuma ficar escondida no eixo (ou em lugar
   * nenhum): "12.480" pode ser reais, autos ou dias, e quem lê o card num
   * telão não vai inspecionar o eixo Y para descobrir. Fica FORA do título de
   * propósito — "Arrecadação (R$)" mistura o assunto com a escala, e some
   * quando o título é truncado.
   *
   * NÃO se aplica aos cartões de NÚMERO (kpi, stat_tile, metric_glow,
   * signal_card): eles já formatam a unidade dentro do próprio valor
   * ("R$ 2,61 bi"), e repeti-la ao lado do rótulo seria dizer duas vezes.
   */
  unit?: string;
  /**
   * Ícone semântico do card (ver `SEMANTIC_ICONS`). Ausente, a tela deriva um
   * do TIPO do bloco (ver `iconForBlockType`) — nenhum card fica sem âncora
   * visual, e o agente só escreve o campo quando quer contrariar o padrão.
   */
  icon?: SemanticIcon;
  /**
   * Peso visual do card na leitura da linha:
   *
   *   `featured` — o número que a página existe para mostrar (borda de acento
   *                e elevação): é o "destaque de KPI";
   *   `muted`    — apoio/contexto, recua para trás do conteúdo principal;
   *   `default`  — o resto.
   *
   * Hierarquia é o que separa um painel de uma parede de cards iguais. Sem um
   * campo para dizê-la, o único jeito de destacar um KPI seria torná-lo maior
   * — e tamanho já é decisão da LINHA (ver `block-sizing`), então destacar por
   * tamanho quebraria o alinhamento dos vizinhos.
   */
  emphasis?: BlockEmphasis;
  props?: Record<string, unknown>;
  dataBinding?: DataBinding;
  /** filhos (composição recursiva) — presente em blocos-container (section/bento). */
  blocks?: Block[];
}

/** Ver `Block.emphasis`. */
export type BlockEmphasis = 'default' | 'featured' | 'muted';

/**
 * Altura declarada de uma linha (ou, excepcionalmente, de um bloco): um degrau
 * nomeado — que acompanha a calibragem do motor — ou pixels (120..1600), a
 * válvula de escape para quem mediu na tela e decidiu outra coisa.
 */
export type BlockHeight = 'auto' | 'compact' | 'default' | 'tall' | number;

/**
 * Como as larguras dos blocos de uma linha são decididas.
 *
 *  `equal` (padrão) — faixas IGUAIS: ninguém termina maior que o vizinho por
 *                     acidente de ter escrito `span: 7` e `span: 5`;
 *  `span`           — a leitura literal do `span` na grade de 12 colunas, para
 *                     quando o desequilíbrio é a intenção (um gráfico grande e
 *                     um cartão estreito ao lado).
 *
 * Quebrar a regra do `equal` continua possível — só deixa de ser possível SEM
 * QUERER, que era o problema.
 */
export type RowItemSizing = 'equal' | 'span';

export interface Row {
  id: string;
  title?: string;
  /**
   * Uma linha sobre o que a seção mostra, abaixo do título. É o equivalente da
   * `description` da aba, um nível abaixo: dá contexto ao GRUPO de gráficos
   * sem obrigar cada card a repetir a mesma explicação.
   */
  description?: string;
  /**
   * Altura da LINHA. A linha é a unidade de decisão de altura: escolhe um
   * tamanho e todos os seus blocos ficam com ele. Ausente = derivada dos tipos.
   */
  height?: BlockHeight;
  /**
   * Número de COLUNAS da linha (1..6). Ausente, o motor encaixa quantas
   * couberem pelo piso de largura do tipo — o comportamento responsivo padrão.
   *
   * Declarar serve para a intenção editorial que a heurística não adivinha:
   * "estes quatro KPIs são uma faixa de quatro", mesmo que coubessem cinco.
   */
  columns?: number;
  /** Ver `RowItemSizing`. Ausente = `equal`. */
  itemSizing?: RowItemSizing;
  blocks: Block[];
}

/**
 * ABA do dashboard — agrupa `rows` em páginas navegáveis.
 *
 * A aba referencia as linhas por ID (`rowIds`) em vez de contê-las: `rows`
 * segue sendo a lista CANÔNICA e completa de linhas do layout. Ver a nota
 * longa em `$defs.tab` do `DashboardLayoutSchema` (e doc 40) para o porquê.
 */
/**
 * Vocabulário de ÍCONES do dashboard. Nomes SEMÂNTICOS (o que o item trata),
 * não nomes de biblioteca: quem escolhe é o agente, e ele decide por
 * significado ("isso é sobre dinheiro"), não por catálogo de SVG. A tela
 * traduz para o ícone real — trocar a biblioteca de ícones não mexe em nenhum
 * dashboard salvo.
 *
 * UM vocabulário só serve ABA e BLOCO. Dois enums (um para aba, outro para
 * card) divergiriam no primeiro ícone acrescentado, e o agente teria de
 * aprender duas listas para dizer a mesma coisa — "isto é sobre arrecadação"
 * é a mesma frase, esteja ela numa aba ou no cabeçalho de um gráfico.
 */
export const SEMANTIC_ICONS = [
  'overview',
  'chart',
  'trend',
  'table',
  'money',
  'tax',
  'users',
  'building',
  'calendar',
  'alert',
  'map',
  'document',
  'search',
  'target',
  'clock',
  'tag',
  'percent',
  'activity',
  'layers',
  'check',
  'database',
  'pie',
  'list',
  'settings',
] as const;

export type SemanticIcon = (typeof SEMANTIC_ICONS)[number];

/**
 * Nome histórico do vocabulário, de quando ele só servia às abas. Mantido como
 * ALIAS (mesmo array, mesmo tipo) porque `TAB_ICONS` já é lido pelo
 * normalizador e pelo backend: renomear sem alias trocaria um ganho de clareza
 * por um import quebrado em três pacotes.
 */
export const TAB_ICONS = SEMANTIC_ICONS;
export type TabIcon = SemanticIcon;

export interface Tab {
  id: string;
  title: string;
  /** ids de `rows` que compõem a aba, na ordem de exibição. */
  rowIds: string[];
  /**
   * Ícone semântico da aba (ver `TAB_ICONS`). OPCIONAL — sem ele a navegação
   * ainda funciona, com um marcador neutro.
   */
  icon?: TabIcon;
  /**
   * Uma linha explicando o que a aba responde ("Arrecadação de IPTU por mês").
   * Aparece abaixo do título no conteúdo e como dica na navegação. É o que
   * transforma uma lista de rótulos soltos em algo que se entende sem clicar.
   */
  description?: string;
  /**
   * Rótulo do GRUPO ao qual a aba pertence ("Arrecadação", "Fiscalização").
   * Abas com o mesmo grupo viram uma seção na navegação, na ordem em que
   * aparecem. Sem grupo, a aba fica na seção geral — é o que dá hierarquia a
   * um dashboard com muitas abas em vez de uma lista plana e longa.
   */
  group?: string;
  /**
   * Posição na navegação (menor primeiro). Sem ele, vale a ordem do array —
   * que é o que o agente controla quando escreve o layout inteiro de uma vez.
   *
   * Existe para o caso em que ele NÃO escreve de uma vez: acrescentar uma aba
   * a um dashboard já montado hoje só permite empilhar no fim. Com `order`, a
   * aba nova diz onde entra sem reescrever as outras. A ordem do GRUPO também
   * sai daqui (o menor `order` entre suas abas), então não há um segundo
   * registro de ordenação para discordar deste.
   */
  order?: number;
  /**
   * Nível na hierarquia: `1` (padrão) é aba de primeiro nível, `2` é uma
   * SUB-ABA — indentada e com peso tipográfico menor.
   *
   * Um só campo resolve "nível" e "peso" porque são a mesma informação lida de
   * dois jeitos: o que está subordinado é desenhado com menos ênfase. Campos
   * separados permitiriam a combinação sem sentido (subordinado em negrito).
   */
  level?: 1 | 2;
  /**
   * Desenha um separador ANTES desta aba. Serve para quebrar um bloco de itens
   * dentro do MESMO grupo (ex.: separar "Consolidado" dos detalhamentos) sem
   * inventar um grupo com título — que exigiria um rótulo que ninguém pediu.
   */
  divider?: boolean;
}

/**
 * Preferência de APARÊNCIA do dashboard — a decisão de tema que pertence ao
 * CONTEÚDO, não ao usuário.
 *
 * Os dois convivem por precedência, e a ordem importa: a escolha explícita de
 * quem está lendo vence sempre. Isto aqui é o PONTO DE PARTIDA de quem abre o
 * dashboard sem nunca ter escolhido nada — um painel de sala de controle nasce
 * escuro, um relatório para impressão nasce claro. Um dashboard que forçasse o
 * tema por cima da preferência salva seria um app discutindo com o usuário.
 */
export interface DashboardTheme {
  /** Aparência inicial. Só vale para quem ainda não escolheu uma. */
  colorMode?: 'light' | 'dark' | 'system';
  /**
   * Cor de acento PADRÃO dos blocos que não declararem a sua (nome de cor de
   * série do tema de gráfico, ex.: `teal`, `amber`). É o que dá identidade
   * cromática a um dashboard inteiro com um campo, em vez de repetir `accent`
   * em quinze blocos.
   */
  accent?: string;
  /**
   * Como os blocos categóricos pintam por padrão: `multi` = uma cor por
   * categoria, `single` = uma cor por série. Reusa o vocabulário que os blocos
   * já expõem em `props.palette` — um terceiro nome para a mesma ideia só
   * criaria tradução.
   */
  palette?: 'single' | 'multi';
}

export interface DashboardLayout {
  filters: Filter[];
  rows: Row[];
  /**
   * OPCIONAL — ausente nos dashboards já salvos. Um layout sem `tabs` é lido
   * como UMA aba implícita contendo todas as `rows` (ver `resolveDashboardTabs`).
   */
  tabs?: Tab[];
  /** OPCIONAL — preferência de aparência do dashboard (ver `DashboardTheme`). */
  theme?: DashboardTheme;
}

export type ArtifactStatus = 'draft' | 'published';
export type Visibility = 'PRIVATE' | 'DEPARTMENT' | 'ORG';

/** DashboardConfig completo (metadados + layout inline), como no doc 20. */
export type DashboardConfig = {
  id: string;
  version: number;
  status: ArtifactStatus;
  title: string;
  ownerId: string;
  departmentId?: string | null;
  visibility: Visibility;
} & DashboardLayout;

// ---------- Camada 2: CONTRATO DO BLOCO ----------
export type BlockManifest = FromSchema<typeof BlockManifestSchema>;
export type BlockKind = BlockManifest['kind'];
export type DataShape = 'scalar' | 'series' | 'categorical' | 'table';

// ---------- Shapes concretos de dados ----------
export type ScalarData = FromSchema<typeof ScalarDataSchema>;
export type SeriesData = FromSchema<typeof SeriesDataSchema>;
export type CategoricalData = FromSchema<typeof CategoricalDataSchema>;
export type TableData = FromSchema<typeof TableDataSchema>;
export type BlockData = ScalarData | SeriesData | CategoricalData | TableData;

// ---------- Payload de DADOS (batch) ----------
export type BlockState = 'idle' | 'queued' | 'running' | 'success' | 'error';
export type BlockDataResult = FromSchema<typeof BlockDataResultSchema>;
export type DashboardDataPayload = FromSchema<typeof DashboardDataPayloadSchema>;

// ---------- Eventos de Socket.IO ----------
export type BlockQueuedEvent = FromSchema<typeof BlockQueuedEventSchema>;
export type BlockRunningEvent = FromSchema<typeof BlockRunningEventSchema>;
export type BlockErrorEvent = FromSchema<typeof BlockErrorEventSchema>;
/** `result` usa $ref externo → composto à mão com BlockDataResult. */
export type BlockDataEvent = {
  dashboardId: string;
  blockId: string;
  result: BlockDataResult;
};

// ---------- DTOs de API ----------
export type ApiError = FromSchema<typeof ApiErrorSchema>;
export type DashboardSummary = FromSchema<typeof DashboardSummarySchema>;

/** `layout` usa $ref externo → composto com DashboardLayout. */
export type DashboardDetail = {
  id: string;
  title: string;
  status: ArtifactStatus;
  visibility: Visibility;
  ownerId: string;
  departmentId?: string | null;
  version?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  layout: DashboardLayout;
};

export type CreateDashboardRequest = Omit<
  FromSchema<typeof CreateDashboardRequestSchema>,
  'layout'
> & { layout?: DashboardLayout };

export type UpdateDashboardRequest = Omit<
  FromSchema<typeof UpdateDashboardRequestSchema>,
  'layout'
> & { layout?: DashboardLayout };

export type BlockDataRequest = FromSchema<typeof BlockDataRequestSchema>;
