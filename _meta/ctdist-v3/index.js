// shared/contracts/src/schemas/dashboard-layout.schema.ts
var DashboardLayoutSchema = {
  $id: "dashboard-layout.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DashboardLayout",
  type: "object",
  additionalProperties: false,
  required: ["filters", "rows"],
  properties: {
    filters: {
      type: "array",
      items: { $ref: "#/$defs/filter" }
    },
    rows: {
      type: "array",
      items: { $ref: "#/$defs/row" }
    }
  },
  $defs: {
    filter: {
      type: "object",
      additionalProperties: false,
      required: ["id", "type", "label"],
      properties: {
        id: { type: "string", minLength: 1 },
        type: {
          type: "string",
          enum: ["date_range", "select", "multiselect", "search", "number_range"]
        },
        label: { type: "string" },
        // `default` é o valor inicial do filtro; shape depende do tipo → livre.
        default: {}
      }
    },
    dataBindingParam: {
      type: "object",
      additionalProperties: false,
      required: ["filterId", "as"],
      properties: {
        filterId: { type: "string", minLength: 1 },
        as: { type: "string", minLength: 1 }
      }
    },
    dataBinding: {
      type: "object",
      additionalProperties: false,
      required: ["connectionId", "query"],
      properties: {
        connectionId: { type: "string", minLength: 1 },
        query: { type: "string", minLength: 1 },
        params: {
          type: "array",
          items: { $ref: "#/$defs/dataBindingParam" }
        },
        // mapeamento resultado->shape do bloco: ref nomeada OU objeto declarativo → livre.
        transform: {},
        ttlSeconds: { type: "integer", minimum: 0 }
      }
    },
    block: {
      type: "object",
      additionalProperties: false,
      required: ["id", "type", "span"],
      properties: {
        id: { type: "string", minLength: 1 },
        // referencia um `type` do CATÁLOGO (catalogType). Ex.: kpi, bar_chart, rich_text, section.
        type: { type: "string", minLength: 1 },
        // largura no grid de 12 colunas (relativa ao container pai — row ou bloco-container).
        span: { type: "integer", minimum: 1, maximum: 12 },
        // altura no mosaico: quantas linhas o bloco ocupa em containers com grid
        // (ex.: bento_grid). Opcional — default 1. Mesma sintaxe de span p/ a IA.
        rowSpan: { type: "integer", minimum: 1 },
        // título do card (header do "frame" — chart-widget). Opcional: se ausente, o
        // render usa o `manifest.name` do tipo. Permite a IA nomear o card no relatório.
        title: { type: "string" },
        // subtítulo do header do card (linha de apoio abaixo do título). Opcional.
        subtitle: { type: "string" },
        // props visuais do bloco (validadas pelo manifest.propsSchema do catálogo).
        props: { type: "object" },
        // ausente em blocos narrativos (title / rich_text) e em containers (section).
        dataBinding: { $ref: "#/$defs/dataBinding" },
        // COMPOSIÇÃO RECURSIVA (hierarquia): blocos-container (ex.: `section`, `bento`)
        // agrupam sub-blocos num grid interno de 12 colunas. Cada filho é um `block`
        // (folha ou outro container) — permite "seção dentro de seção" / relatórios ricos.
        blocks: {
          type: "array",
          items: { $ref: "#/$defs/block" }
        }
      }
    },
    row: {
      type: "object",
      additionalProperties: false,
      required: ["id", "blocks"],
      properties: {
        id: { type: "string", minLength: 1 },
        title: { type: "string" },
        blocks: {
          type: "array",
          items: { $ref: "#/$defs/block" }
        }
      }
    }
  }
};
var DashboardConfigSchema = {
  $id: "dashboard-config.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DashboardConfig",
  type: "object",
  additionalProperties: false,
  required: ["id", "version", "status", "title", "ownerId", "visibility", "filters", "rows"],
  properties: {
    id: { type: "string", minLength: 1 },
    version: { type: "integer", minimum: 1 },
    status: { type: "string", enum: ["draft", "published"] },
    title: { type: "string", minLength: 1 },
    ownerId: { type: "string", minLength: 1 },
    departmentId: { type: ["string", "null"] },
    visibility: { type: "string", enum: ["PRIVATE", "DEPARTMENT", "ORG"] },
    filters: {
      type: "array",
      items: { $ref: "dashboard-layout.json#/$defs/filter" }
    },
    rows: {
      type: "array",
      items: { $ref: "dashboard-layout.json#/$defs/row" }
    }
  }
};

// shared/contracts/src/schemas/block-manifest.schema.ts
var BlockManifestSchema = {
  $id: "block-manifest.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockManifest",
  type: "object",
  additionalProperties: false,
  required: ["type", "kind", "name", "description", "source"],
  properties: {
    // identificador do bloco no catálogo (catalogType). Ex.: 'bar_chart'.
    type: { type: "string", minLength: 1 },
    kind: { type: "string", enum: ["chart", "text", "title", "layout"] },
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    // origem do componente: slug Vitrine ('vitrine:bar-chart') ou 'custom'.
    source: { type: "string", minLength: 1 },
    // JSON Schema NEUTRO das props visuais (objeto schema arbitrário).
    propsSchema: { type: "object" },
    dataContract: { $ref: "#/$defs/dataContract" },
    defaultProps: { type: "object" },
    minColumns: { type: "integer", minimum: 0 },
    maxRows: { type: "integer", minimum: 0 },
    version: { type: "string" }
  },
  $defs: {
    dataContract: {
      type: "object",
      additionalProperties: false,
      required: ["shape", "spec"],
      properties: {
        shape: { type: "string", enum: ["scalar", "series", "categorical", "table"] },
        // descrição dos campos esperados (x/y/series, columns, etc.).
        spec: { type: "object" },
        // exemplo de dado já no shape do bloco (preview/dev/IA).
        example: {}
      }
    }
  }
};

// shared/contracts/src/schemas/block-data.schema.ts
var ScalarDataSchema = {
  $id: "data-scalar.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ScalarData",
  type: "object",
  additionalProperties: false,
  required: ["value"],
  properties: {
    value: { type: ["number", "null"] },
    label: { type: "string" },
    unit: { type: "string" },
    delta: { type: "number" },
    format: { type: "string" }
  }
};
var SeriesDataSchema = {
  $id: "data-series.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SeriesData",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["x", "y"],
    properties: {
      x: { type: ["string", "number"] },
      y: { type: ["number", "null"] },
      series: { type: "string" }
    }
  }
};
var CategoricalDataSchema = {
  $id: "data-categorical.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CategoricalData",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["label", "value"],
    properties: {
      label: { type: "string" },
      value: { type: ["number", "null"] }
    }
  }
};
var TableDataSchema = {
  $id: "data-table.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "TableData",
  type: "object",
  additionalProperties: false,
  required: ["columns", "rows"],
  properties: {
    columns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label"],
        properties: {
          key: { type: "string", minLength: 1 },
          label: { type: "string" },
          type: { type: "string", enum: ["string", "number", "date", "boolean"] }
        }
      }
    },
    rows: {
      type: "array",
      items: { type: "object" }
    }
  }
};

// shared/contracts/src/schemas/data-payload.schema.ts
var blockDataResultDef = {
  type: "object",
  additionalProperties: false,
  required: ["blockId", "state"],
  properties: {
    blockId: { type: "string", minLength: 1 },
    state: { type: "string", enum: ["idle", "queued", "running", "success", "error"] },
    // shape do dado (espelha dataContract.shape do bloco). Presente quando state=success.
    shape: { type: "string", enum: ["scalar", "series", "categorical", "table"] },
    // dado já transformado para o shape do bloco (validar com os schemas de block-data).
    data: {},
    error: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" }
      }
    },
    meta: {
      type: "object",
      additionalProperties: true,
      properties: {
        cached: { type: "boolean" },
        ttlSeconds: { type: "integer", minimum: 0 },
        executedAt: { type: "string" },
        rowCount: { type: "integer", minimum: 0 },
        truncated: { type: "boolean" },
        durationMs: { type: "integer", minimum: 0 }
      }
    }
  }
};
var BlockDataResultSchema = {
  $id: "block-data-result.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockDataResult",
  ...blockDataResultDef
};
var DashboardDataPayloadSchema = {
  $id: "dashboard-data-payload.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DashboardDataPayload",
  type: "object",
  additionalProperties: false,
  required: ["dashboardId", "blocks"],
  properties: {
    dashboardId: { type: "string", minLength: 1 },
    version: { type: "integer", minimum: 1 },
    mode: { type: "string", enum: ["dev", "published"] },
    generatedAt: { type: "string" },
    blocks: {
      type: "object",
      additionalProperties: blockDataResultDef
    }
  }
};

// shared/contracts/src/schemas/socket-events.schema.ts
var SOCKET_EVENTS = {
  BLOCK_QUEUED: "block:queued",
  BLOCK_RUNNING: "block:running",
  BLOCK_DATA: "block:data",
  BLOCK_ERROR: "block:error"
};
var baseEvt = {
  type: "object",
  additionalProperties: false,
  required: ["dashboardId", "blockId"],
  properties: {
    dashboardId: { type: "string", minLength: 1 },
    blockId: { type: "string", minLength: 1 }
  }
};
var BlockQueuedEventSchema = {
  $id: "evt-block-queued.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockQueuedEvent",
  type: "object",
  additionalProperties: false,
  required: ["dashboardId", "blockId", "state"],
  properties: {
    ...baseEvt.properties,
    state: { type: "string", const: "queued" }
  }
};
var BlockRunningEventSchema = {
  $id: "evt-block-running.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockRunningEvent",
  type: "object",
  additionalProperties: false,
  required: ["dashboardId", "blockId", "state"],
  properties: {
    ...baseEvt.properties,
    state: { type: "string", const: "running" }
  }
};
var BlockDataEventSchema = {
  $id: "evt-block-data.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockDataEvent",
  type: "object",
  additionalProperties: false,
  required: ["dashboardId", "blockId", "result"],
  properties: {
    ...baseEvt.properties,
    result: { $ref: "block-data-result.json" }
  }
};
var BlockErrorEventSchema = {
  $id: "evt-block-error.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockErrorEvent",
  type: "object",
  additionalProperties: false,
  required: ["dashboardId", "blockId", "error"],
  properties: {
    ...baseEvt.properties,
    error: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

// shared/contracts/src/schemas/api-dto.schema.ts
var ApiErrorSchema = {
  $id: "api-error.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ApiError",
  type: "object",
  additionalProperties: false,
  required: ["error"],
  properties: {
    error: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: {}
      }
    }
  }
};
var DashboardSummarySchema = {
  $id: "dashboard-summary.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DashboardSummary",
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "status", "visibility", "ownerId", "updatedAt"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string", enum: ["draft", "published"] },
    visibility: { type: "string", enum: ["PRIVATE", "DEPARTMENT", "ORG"] },
    ownerId: { type: "string" },
    departmentId: { type: ["string", "null"] },
    updatedAt: { type: "string" }
  }
};
var DashboardDetailSchema = {
  $id: "dashboard-detail.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "DashboardDetail",
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "status", "visibility", "ownerId", "layout"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string", enum: ["draft", "published"] },
    visibility: { type: "string", enum: ["PRIVATE", "DEPARTMENT", "ORG"] },
    ownerId: { type: "string" },
    departmentId: { type: ["string", "null"] },
    version: { type: "integer", minimum: 1 },
    publishedAt: { type: ["string", "null"] },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    layout: { $ref: "dashboard-layout.json" }
  }
};
var CreateDashboardRequestSchema = {
  $id: "create-dashboard-request.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CreateDashboardRequest",
  type: "object",
  additionalProperties: false,
  required: ["title"],
  properties: {
    title: { type: "string", minLength: 1 },
    departmentId: { type: ["string", "null"] },
    visibility: { type: "string", enum: ["PRIVATE", "DEPARTMENT", "ORG"] },
    layout: { $ref: "dashboard-layout.json" }
  }
};
var UpdateDashboardRequestSchema = {
  $id: "update-dashboard-request.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "UpdateDashboardRequest",
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1 },
    departmentId: { type: ["string", "null"] },
    visibility: { type: "string", enum: ["PRIVATE", "DEPARTMENT", "ORG"] },
    layout: { $ref: "dashboard-layout.json" }
  }
};
var BlockDataRequestSchema = {
  $id: "block-data-request.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlockDataRequest",
  type: "object",
  additionalProperties: false,
  properties: {
    filters: { type: "object" },
    mode: { type: "string", enum: ["dev", "published"] },
    // restringir a recomputação a um subconjunto de blocos (ex.: mudou 1 filtro).
    blockIds: { type: "array", items: { type: "string" } }
  }
};

// shared/contracts/src/validation/validator.ts
import Ajv from "ajv";
import addFormats from "ajv-formats";
var ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
var asSchema = (s) => s;
for (const base of [DashboardLayoutSchema, BlockDataResultSchema]) {
  if (!ajv.getSchema(base.$id)) {
    ajv.addSchema(asSchema(base));
  }
}
function compile(schema) {
  const id = schema.$id;
  if (id) {
    const existing = ajv.getSchema(id);
    if (existing) return existing;
  }
  return ajv.compile(asSchema(schema));
}
var validateDashboardLayout = compile(DashboardLayoutSchema);
var validateDashboardConfig = compile(DashboardConfigSchema);
var validateBlockManifest = compile(BlockManifestSchema);
var validateScalarData = compile(ScalarDataSchema);
var validateSeriesData = compile(SeriesDataSchema);
var validateCategoricalData = compile(CategoricalDataSchema);
var validateTableData = compile(TableDataSchema);
var validateBlockDataResult = compile(BlockDataResultSchema);
var validateDashboardDataPayload = compile(DashboardDataPayloadSchema);
var validateBlockQueuedEvent = compile(BlockQueuedEventSchema);
var validateBlockRunningEvent = compile(BlockRunningEventSchema);
var validateBlockDataEvent = compile(BlockDataEventSchema);
var validateBlockErrorEvent = compile(BlockErrorEventSchema);
var validateApiError = compile(ApiErrorSchema);
var validateDashboardSummary = compile(DashboardSummarySchema);
var validateDashboardDetail = compile(DashboardDetailSchema);
var validateCreateDashboardRequest = compile(CreateDashboardRequestSchema);
var validateUpdateDashboardRequest = compile(UpdateDashboardRequestSchema);
var validateBlockDataRequest = compile(BlockDataRequestSchema);
function validateBlockDataByShape(shape, data) {
  const fn = shape === "scalar" ? validateScalarData : shape === "series" ? validateSeriesData : shape === "categorical" ? validateCategoricalData : validateTableData;
  const valid = fn(data);
  return { valid, errors: valid ? null : fn.errors ?? null };
}
function formatErrors(errors) {
  if (!errors || errors.length === 0) return "sem erros";
  return errors.map((e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim()).join("; ");
}
var ContractValidationError = class extends Error {
  errors;
  constructor(label, errors) {
    super(`Contrato inv\xE1lido (${label}): ${formatErrors(errors)}`);
    this.name = "ContractValidationError";
    this.errors = errors ?? [];
  }
};
function assertValid(validate, data, label = "payload") {
  if (!validate(data)) {
    throw new ContractValidationError(label, validate.errors);
  }
  return data;
}

// shared/contracts/src/socket/events.ts
function dashboardRoom(dashboardId) {
  return `dashboard:${dashboardId}`;
}

// shared/contracts/src/fixtures/manifests.ts
var kpiManifest = {
  type: "kpi",
  kind: "chart",
  name: "KPI",
  description: "M\xE9trica \xFAnica (escalar) com r\xF3tulo e varia\xE7\xE3o opcional.",
  source: "vitrine:kpi-card",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      accent: { type: "string" },
      icon: { type: "string" },
      showDelta: { type: "boolean" }
    }
  },
  dataContract: {
    shape: "scalar",
    spec: {
      value: { type: "number", required: true },
      label: { type: "string", required: false },
      delta: { type: "number", required: false }
    },
    example: { value: 1284e3, label: "Total arrecadado", unit: "BRL", delta: 0.12 }
  },
  defaultProps: { showDelta: true },
  version: "1.0.0"
};
var barChartManifest = {
  type: "bar_chart",
  kind: "chart",
  name: "Gr\xE1fico de Barras",
  description: "Compara valores entre categorias.",
  source: "vitrine:bar-chart",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      stacked: { type: "boolean" },
      orientation: { type: "string", enum: ["vertical", "horizontal"] }
    }
  },
  dataContract: {
    shape: "series",
    spec: {
      x: { type: "category", required: true },
      y: { type: "number", required: true },
      series: { type: "category", required: false }
    },
    example: [
      { x: "Jan", y: 120 },
      { x: "Fev", y: 90 }
    ]
  },
  defaultProps: { orientation: "vertical", stacked: false },
  minColumns: 1,
  maxRows: 5e3,
  version: "1.0.0"
};
var lineChartManifest = {
  type: "line_chart",
  kind: "chart",
  name: "Gr\xE1fico de Linhas",
  description: "S\xE9rie temporal: evolu\xE7\xE3o de um valor ao longo do tempo.",
  source: "vitrine:line-chart",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      smooth: { type: "boolean" },
      area: { type: "boolean" }
    }
  },
  dataContract: {
    shape: "series",
    spec: {
      x: { type: "temporal", required: true },
      y: { type: "number", required: true },
      series: { type: "category", required: false }
    },
    example: [
      { x: "2026-01", y: 12 },
      { x: "2026-02", y: 18 }
    ]
  },
  defaultProps: { smooth: true },
  maxRows: 5e3,
  version: "1.0.0"
};
var donutManifest = {
  type: "donut",
  kind: "chart",
  name: "Donut",
  description: "Distribui\xE7\xE3o de um total entre categorias (label + value).",
  source: "vitrine:donut-chart",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      showLegend: { type: "boolean" },
      centerLabel: { type: "string" }
    }
  },
  dataContract: {
    shape: "categorical",
    spec: {
      label: { type: "category", required: true },
      value: { type: "number", required: true }
    },
    example: [
      { label: "Quitado", value: 62 },
      { label: "Em aberto", value: 38 }
    ]
  },
  defaultProps: { showLegend: true },
  version: "1.0.0"
};
var tableManifest = {
  type: "table",
  kind: "chart",
  name: "Tabela",
  description: "Dados tabulares crus com colunas tipadas.",
  source: "vitrine:data-table",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      pageSize: { type: "integer", minimum: 1 },
      dense: { type: "boolean" }
    }
  },
  dataContract: {
    shape: "table",
    spec: {
      columns: { type: "array", required: true },
      rows: { type: "array", required: true }
    },
    example: {
      columns: [
        { key: "municipio", label: "Munic\xEDpio", type: "string" },
        { key: "valor", label: "Valor", type: "number" }
      ],
      rows: [{ municipio: "Centro", valor: 1e3 }]
    }
  },
  defaultProps: { pageSize: 10 },
  maxRows: 5e3,
  version: "1.0.0"
};
var titleManifest = {
  type: "title",
  kind: "title",
  name: "T\xEDtulo",
  description: "Bloco narrativo de t\xEDtulo/se\xE7\xE3o. Sem dados.",
  source: "custom",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    required: ["text"],
    properties: {
      text: { type: "string" },
      level: { type: "integer", minimum: 1, maximum: 6 },
      align: { type: "string", enum: ["left", "center", "right"] }
    }
  },
  defaultProps: { level: 2, align: "left" },
  version: "1.0.0"
};
var richTextManifest = {
  type: "rich_text",
  kind: "text",
  name: "Texto rico",
  description: "Bloco narrativo em markdown (an\xE1lise do relat\xF3rio). Sem dados.",
  source: "custom",
  propsSchema: {
    type: "object",
    additionalProperties: false,
    required: ["markdown"],
    properties: {
      markdown: { type: "string" }
    }
  },
  defaultProps: { markdown: "" },
  version: "1.0.0"
};
var baseManifests = [
  kpiManifest,
  barChartManifest,
  lineChartManifest,
  donutManifest,
  tableManifest,
  titleManifest,
  richTextManifest
];

// shared/contracts/src/fixtures/dashboard.ts
var dashboardConfigFixture = {
  id: "dash_divida_ativa_2026",
  version: 1,
  status: "draft",
  title: "D\xEDvida Ativa 2026",
  ownerId: "user_admin",
  departmentId: "dep_fazenda",
  visibility: "DEPARTMENT",
  filters: [
    {
      id: "f_periodo",
      type: "date_range",
      label: "Per\xEDodo",
      default: { from: "2026-01-01", to: "2026-12-31" }
    },
    {
      id: "f_situacao",
      type: "select",
      label: "Situa\xE7\xE3o",
      default: "todas"
    }
  ],
  rows: [
    {
      id: "row_intro",
      title: "Vis\xE3o geral",
      blocks: [
        {
          id: "blk_title",
          type: "title",
          span: 12,
          props: { text: "D\xEDvida Ativa \u2014 2026", level: 1, align: "left" }
        },
        {
          id: "blk_kpi_total",
          type: "kpi",
          span: 4,
          props: { showDelta: true },
          dataBinding: {
            connectionId: "conn_fazenda",
            query: "SELECT SUM(valor) AS value FROM divida_ativa WHERE ano = :periodo",
            params: [{ filterId: "f_periodo", as: "periodo" }],
            transform: "scalar",
            ttlSeconds: 86400
          }
        },
        {
          id: "blk_bar_mes",
          type: "bar_chart",
          span: 8,
          props: { orientation: "vertical", stacked: false },
          dataBinding: {
            connectionId: "conn_fazenda",
            query: "SELECT mes AS x, SUM(valor) AS y FROM divida_ativa GROUP BY mes",
            params: [{ filterId: "f_periodo", as: "periodo" }],
            ttlSeconds: 3600
          }
        }
      ]
    },
    {
      id: "row_evolucao",
      title: "Evolu\xE7\xE3o e distribui\xE7\xE3o",
      blocks: [
        {
          id: "blk_line",
          type: "line_chart",
          span: 7,
          props: { smooth: true, area: false },
          dataBinding: {
            connectionId: "conn_fazenda",
            query: "SELECT competencia AS x, SUM(valor) AS y FROM divida_ativa GROUP BY competencia ORDER BY competencia",
            ttlSeconds: 3600
          }
        },
        {
          id: "blk_donut",
          type: "donut",
          span: 5,
          props: { showLegend: true },
          dataBinding: {
            connectionId: "conn_fazenda",
            query: "SELECT situacao AS label, COUNT(*) AS value FROM divida_ativa GROUP BY situacao",
            params: [{ filterId: "f_situacao", as: "situacao" }],
            ttlSeconds: 3600
          }
        }
      ]
    },
    {
      id: "row_detalhe",
      title: "Detalhamento",
      blocks: [
        {
          id: "blk_rich",
          type: "rich_text",
          span: 12,
          props: {
            markdown: "## An\xE1lise\nA arrecada\xE7\xE3o cresceu **12%** frente ao per\xEDodo anterior."
          }
        },
        {
          id: "blk_table",
          type: "table",
          span: 12,
          props: { pageSize: 10, dense: false },
          dataBinding: {
            connectionId: "conn_fazenda",
            query: "SELECT municipio, SUM(valor) AS valor FROM divida_ativa GROUP BY municipio",
            ttlSeconds: 86400
          }
        }
      ]
    }
  ]
};
var dashboardLayoutFixture = {
  filters: dashboardConfigFixture.filters,
  rows: dashboardConfigFixture.rows
};

// shared/contracts/src/fixtures/data-payload.ts
var dashboardDataPayloadFixture = {
  dashboardId: "dash_divida_ativa_2026",
  version: 1,
  mode: "dev",
  generatedAt: "2026-06-22T00:00:00.000Z",
  blocks: {
    blk_kpi_total: {
      blockId: "blk_kpi_total",
      state: "success",
      shape: "scalar",
      data: { value: 1284e3, label: "Total arrecadado", unit: "BRL", delta: 0.12 },
      meta: { cached: false, ttlSeconds: 86400, rowCount: 1, durationMs: 42 }
    },
    blk_bar_mes: {
      blockId: "blk_bar_mes",
      state: "success",
      shape: "series",
      data: [
        { x: "Jan", y: 12e4 },
        { x: "Fev", y: 98e3 },
        { x: "Mar", y: 145e3 }
      ],
      meta: { cached: true, ttlSeconds: 3600, rowCount: 3, truncated: false }
    },
    blk_line: {
      blockId: "blk_line",
      state: "success",
      shape: "series",
      data: [
        { x: "2026-01", y: 12e4 },
        { x: "2026-02", y: 218e3 },
        { x: "2026-03", y: 363e3 }
      ]
    },
    blk_donut: {
      blockId: "blk_donut",
      state: "success",
      shape: "categorical",
      data: [
        { label: "Quitado", value: 62 },
        { label: "Em aberto", value: 38 }
      ]
    },
    blk_table: {
      blockId: "blk_table",
      state: "queued"
    }
  }
};
export {
  ApiErrorSchema,
  BlockDataEventSchema,
  BlockDataRequestSchema,
  BlockDataResultSchema,
  BlockErrorEventSchema,
  BlockManifestSchema,
  BlockQueuedEventSchema,
  BlockRunningEventSchema,
  CategoricalDataSchema,
  ContractValidationError,
  CreateDashboardRequestSchema,
  DashboardConfigSchema,
  DashboardDataPayloadSchema,
  DashboardDetailSchema,
  DashboardLayoutSchema,
  DashboardSummarySchema,
  SOCKET_EVENTS,
  ScalarDataSchema,
  SeriesDataSchema,
  TableDataSchema,
  UpdateDashboardRequestSchema,
  ajv,
  assertValid,
  barChartManifest,
  baseManifests,
  dashboardConfigFixture,
  dashboardDataPayloadFixture,
  dashboardLayoutFixture,
  dashboardRoom,
  donutManifest,
  formatErrors,
  kpiManifest,
  lineChartManifest,
  richTextManifest,
  tableManifest,
  titleManifest,
  validateApiError,
  validateBlockDataByShape,
  validateBlockDataEvent,
  validateBlockDataRequest,
  validateBlockDataResult,
  validateBlockErrorEvent,
  validateBlockManifest,
  validateBlockQueuedEvent,
  validateBlockRunningEvent,
  validateCategoricalData,
  validateCreateDashboardRequest,
  validateDashboardConfig,
  validateDashboardDataPayload,
  validateDashboardDetail,
  validateDashboardLayout,
  validateDashboardSummary,
  validateScalarData,
  validateSeriesData,
  validateTableData,
  validateUpdateDashboardRequest
};
//# sourceMappingURL=index.js.map
