/**
 * Contrato de LAYOUT (DashboardConfig / DashboardLayout) — Camada 1 do doc 20.
 *
 * JSON Schema NEUTRO (draft-07 compatível, sem Zod). É o JSON que o backend salva
 * (Dashboard.draftLayout / publishedLayout = { filters, rows }) e que o front
 * hidrata para desenhar filtros + grid de blocos.
 *
 * Fonte da verdade: docs/plano/20-contrato-dashboard.md (seção 1) + 30-modelagem-dados.md.
 */

/**
 * DashboardLayout = o objeto JSON embutido salvo em `draft_layout` / `published_layout`.
 * Contém apenas { filters, rows } — os metadados (id, version, status, title, owner,
 * visibility) ficam em colunas da tabela `dashboards` (ver modelagem 30) e compõem
 * o DashboardConfig completo (abaixo).
 */
export const DashboardLayoutSchema = {
  $id: 'dashboard-layout.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardLayout',
  type: 'object',
  additionalProperties: false,
  // `tabs` NÃO entra em `required`: é essa ausência que mantém válido todo
  // layout já salvo no banco (`{ filters, rows }`). Ver `$defs.tab`.
  required: ['filters', 'rows'],
  properties: {
    filters: {
      type: 'array',
      items: { $ref: '#/$defs/filter' },
    },
    rows: {
      type: 'array',
      items: { $ref: '#/$defs/row' },
    },
    // ABAS (opcional). Agrupa as `rows` acima em páginas navegáveis. É uma
    // PROJEÇÃO sobre `rows` (referencia por id), não um novo container de
    // blocos — ver a nota de decisão em `$defs.tab`.
    tabs: {
      type: 'array',
      items: { $ref: '#/$defs/tab' },
    },
  },
  $defs: {
    /**
     * Aba do dashboard. Ela NÃO carrega `rows` dentro de si — carrega os IDS
     * das rows que exibe (`rowIds`).
     *
     * PORQUÊ (decisão de arquitetura, doc 40): se as rows morassem dentro da
     * aba, `rows` deixaria de ser o único lugar onde vivem os blocos, e TODO
     * consumidor que hoje percorre `layout.rows` ficaria cego para os blocos
     * das abas — resolução de dados (`resolveBlocks`), validação de
     * `props.chartId`, injeção do título do chart, snapshot do publish, export
     * de PDF, MCP e agente. São 7 travessias, e cada uma esquecida vira falha
     * SILENCIOSA (bloco vazio, sem erro). Mantendo `rows` como lista canônica
     * e completa, nenhum desses caminhos precisa mudar.
     *
     * A leitura passa SEMPRE por `resolveDashboardTabs` (layout/tabs.ts), que
     * normaliza rowIds desconhecidos, duplicados e linhas órfãs.
     */
    tab: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'title', 'rowIds'],
      properties: {
        id: { type: 'string', minLength: 1 },
        // rótulo exibido na navegação lateral (obrigatório: aba sem nome é
        // inacessível — o leitor de tela anunciaria só a posição).
        title: { type: 'string', minLength: 1 },
        // ids de `rows` que compõem a aba, NA ORDEM de exibição.
        rowIds: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
        },
      },
    },
    filter: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'label'],
      properties: {
        id: { type: 'string', minLength: 1 },
        type: {
          type: 'string',
          enum: ['date_range', 'select', 'multiselect', 'search', 'number_range'],
        },
        label: { type: 'string' },
        // `default` é o valor inicial do filtro; shape depende do tipo → livre.
        default: {},
      },
    },
    dataBindingParam: {
      type: 'object',
      additionalProperties: false,
      required: ['filterId', 'as'],
      properties: {
        filterId: { type: 'string', minLength: 1 },
        as: { type: 'string', minLength: 1 },
      },
    },
    dataBinding: {
      type: 'object',
      additionalProperties: false,
      required: ['connectionId', 'query'],
      properties: {
        connectionId: { type: 'string', minLength: 1 },
        query: { type: 'string', minLength: 1 },
        params: {
          type: 'array',
          items: { $ref: '#/$defs/dataBindingParam' },
        },
        // mapeamento resultado->shape do bloco: ref nomeada OU objeto declarativo → livre.
        transform: {},
        ttlSeconds: { type: 'integer', minimum: 0 },
      },
    },
    block: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'span'],
      properties: {
        id: { type: 'string', minLength: 1 },
        // referencia um `type` do CATÁLOGO (catalogType). Ex.: kpi, bar_chart, rich_text, section.
        type: { type: 'string', minLength: 1 },
        // largura no grid de 12 colunas (relativa ao container pai — row ou bloco-container).
        span: { type: 'integer', minimum: 1, maximum: 12 },
        // altura no mosaico: quantas linhas o bloco ocupa em containers com grid
        // (ex.: bento_grid). Opcional — default 1. Mesma sintaxe de span p/ a IA.
        rowSpan: { type: 'integer', minimum: 1 },
        // ALTURA do bloco. Sobrepõe a altura da LINHA (`row.height`) só para
        // este bloco — é a exceção, não a regra: a decisão normal de altura é
        // da linha, para que vizinhos terminem do mesmo tamanho.
        //
        // Dois formatos, como no editor de painéis do Grafana ("Row height:
        // Standard | Short | Tall | Custom"): um DEGRAU nomeado (que acompanha
        // a calibragem do motor) ou um número em PIXELS (controle fino).
        height: { $ref: '#/$defs/blockHeight' },
        // título do card (header do "frame" — chart-widget). Opcional: se ausente, o
        // render usa o `manifest.name` do tipo. Permite a IA nomear o card no relatório.
        title: { type: 'string' },
        // subtítulo do header do card (linha de apoio abaixo do título). Opcional.
        subtitle: { type: 'string' },
        // props visuais do bloco (validadas pelo manifest.propsSchema do catálogo).
        props: { type: 'object' },
        // ausente em blocos narrativos (title / rich_text) e em containers (section).
        dataBinding: { $ref: '#/$defs/dataBinding' },
        // COMPOSIÇÃO RECURSIVA (hierarquia): blocos-container (ex.: `section`, `bento`)
        // agrupam sub-blocos num grid interno de 12 colunas. Cada filho é um `block`
        // (folha ou outro container) — permite "seção dentro de seção" / relatórios ricos.
        blocks: {
          type: 'array',
          items: { $ref: '#/$defs/block' },
        },
      },
    },
    row: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'blocks'],
      properties: {
        id: { type: 'string', minLength: 1 },
        title: { type: 'string' },
        // ALTURA DA LINHA. A linha é a unidade de decisão de altura (ver
        // `block-sizing` no render-engine): ela escolhe UM tamanho e todos os
        // seus blocos ficam com ele — é o que impede "um gráfico maior que o
        // vizinho". Ausente = derive dos tipos que a linha contém.
        height: { $ref: '#/$defs/blockHeight' },
        blocks: {
          type: 'array',
          items: { $ref: '#/$defs/block' },
        },
      },
    },
    /**
     * Altura declarada de uma linha (ou, excepcionalmente, de um bloco).
     *
     * DOIS FORMATOS de propósito, e a ordem importa:
     *
     *  - DEGRAU NOMEADO (`auto` | `compact` | `default` | `tall`) é o caminho
     *    normal. Ele não é um apelido para um número: é uma referência à
     *    calibragem do motor, que foi MEDIDA nos blocos renderizados. Quando
     *    essa medida mudar, todo dashboard que usa o degrau acompanha — o que
     *    um número congelado no JSON nunca faria.
     *  - PIXELS (120..1600) é a válvula de escape para o caso em que a pessoa
     *    olhou a tela e decidiu outra coisa. Um teto existe porque altura sem
     *    limite não é liberdade, é um bloco que ninguém consegue ver inteiro.
     *
     * `auto` NÃO é "sem altura": é "a altura do conteúdo manda" — o que só faz
     * sentido em linhas narrativas (título, texto). Reservar altura para texto
     * abre um buraco branco no meio do relatório.
     */
    blockHeight: {
      anyOf: [
        { type: 'string', enum: ['auto', 'compact', 'default', 'tall'] },
        { type: 'integer', minimum: 120, maximum: 1600 },
      ],
    },
  },
} as const;

/**
 * DashboardConfig = representação COMPLETA (API/MCP) do dashboard: metadados +
 * filters + rows, exatamente como no exemplo do doc 20 (seção 1).
 * Reaproveita os $defs do DashboardLayout via $ref por $id (sem duplicar contrato).
 */
export const DashboardConfigSchema = {
  $id: 'dashboard-config.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardConfig',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'version', 'status', 'title', 'ownerId', 'visibility', 'filters', 'rows'],
  properties: {
    id: { type: 'string', minLength: 1 },
    version: { type: 'integer', minimum: 1 },
    status: { type: 'string', enum: ['draft', 'published'] },
    title: { type: 'string', minLength: 1 },
    ownerId: { type: 'string', minLength: 1 },
    departmentId: { type: ['string', 'null'] },
    visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'] },
    filters: {
      type: 'array',
      items: { $ref: 'dashboard-layout.json#/$defs/filter' },
    },
    rows: {
      type: 'array',
      items: { $ref: 'dashboard-layout.json#/$defs/row' },
    },
    // Espelha `DashboardLayout.tabs` (opcional) — o config completo precisa
    // carregar as abas, senão o MCP/API devolveria um dashboard \"achatado\".
    tabs: {
      type: 'array',
      items: { $ref: 'dashboard-layout.json#/$defs/tab' },
    },
  },
} as const;
