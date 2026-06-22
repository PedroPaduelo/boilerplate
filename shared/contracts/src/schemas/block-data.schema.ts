/**
 * Shapes concretos de DADOS por bloco (o que chega ao componente já transformado).
 * Um por `dataContract.shape`. Usados para validar o `data` de cada BlockDataResult
 * e como contrato das fixtures que destravam o FE enquanto T-C (execução) não existe.
 *
 * Fonte: doc 20 (Camada 2) + doc 33 (base inicial: kpi/bar/line/donut/table).
 */

/** shape 'scalar' → KPI (métrica única). */
export const ScalarDataSchema = {
  $id: 'data-scalar.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ScalarData',
  type: 'object',
  additionalProperties: false,
  required: ['value'],
  properties: {
    value: { type: ['number', 'null'] },
    label: { type: 'string' },
    unit: { type: 'string' },
    delta: { type: 'number' },
    format: { type: 'string' },
  },
} as const;

/** shape 'series' → barras / linhas (x categórico ou temporal, y numérico, series opcional). */
export const SeriesDataSchema = {
  $id: 'data-series.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'SeriesData',
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['x', 'y'],
    properties: {
      x: { type: ['string', 'number'] },
      y: { type: ['number', 'null'] },
      series: { type: 'string' },
    },
  },
} as const;

/** shape 'categorical' → donut / distribuição (label + value). */
export const CategoricalDataSchema = {
  $id: 'data-categorical.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'CategoricalData',
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['label', 'value'],
    properties: {
      label: { type: 'string' },
      value: { type: ['number', 'null'] },
    },
  },
} as const;

/** shape 'table' → tabela (colunas + linhas). */
export const TableDataSchema = {
  $id: 'data-table.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'TableData',
  type: 'object',
  additionalProperties: false,
  required: ['columns', 'rows'],
  properties: {
    columns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'label'],
        properties: {
          key: { type: 'string', minLength: 1 },
          label: { type: 'string' },
          type: { type: 'string', enum: ['string', 'number', 'date', 'boolean'] },
        },
      },
    },
    rows: {
      type: 'array',
      items: { type: 'object' },
    },
  },
} as const;
