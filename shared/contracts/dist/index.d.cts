import { FromSchema } from 'json-schema-to-ts';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';

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
declare const DashboardLayoutSchema: {
    readonly $id: "dashboard-layout.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "DashboardLayout";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["filters", "rows"];
    readonly properties: {
        readonly filters: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "#/$defs/filter";
            };
        };
        readonly rows: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "#/$defs/row";
            };
        };
        readonly tabs: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "#/$defs/tab";
            };
        };
    };
    readonly $defs: {
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
        readonly tab: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["id", "title", "rowIds"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly title: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly rowIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                };
            };
        };
        readonly filter: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["id", "type", "label"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly type: {
                    readonly type: "string";
                    readonly enum: readonly ["date_range", "select", "multiselect", "search", "number_range"];
                };
                readonly label: {
                    readonly type: "string";
                };
                readonly default: {};
            };
        };
        readonly dataBindingParam: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["filterId", "as"];
            readonly properties: {
                readonly filterId: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly as: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
            };
        };
        readonly dataBinding: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["connectionId", "query"];
            readonly properties: {
                readonly connectionId: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly query: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly params: {
                    readonly type: "array";
                    readonly items: {
                        readonly $ref: "#/$defs/dataBindingParam";
                    };
                };
                readonly transform: {};
                readonly ttlSeconds: {
                    readonly type: "integer";
                    readonly minimum: 0;
                };
            };
        };
        readonly block: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["id", "type", "span"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly type: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly span: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly maximum: 12;
                };
                readonly rowSpan: {
                    readonly type: "integer";
                    readonly minimum: 1;
                };
                readonly title: {
                    readonly type: "string";
                };
                readonly subtitle: {
                    readonly type: "string";
                };
                readonly props: {
                    readonly type: "object";
                };
                readonly dataBinding: {
                    readonly $ref: "#/$defs/dataBinding";
                };
                readonly blocks: {
                    readonly type: "array";
                    readonly items: {
                        readonly $ref: "#/$defs/block";
                    };
                };
            };
        };
        readonly row: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["id", "blocks"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly title: {
                    readonly type: "string";
                };
                readonly blocks: {
                    readonly type: "array";
                    readonly items: {
                        readonly $ref: "#/$defs/block";
                    };
                };
            };
        };
    };
};
/**
 * DashboardConfig = representação COMPLETA (API/MCP) do dashboard: metadados +
 * filters + rows, exatamente como no exemplo do doc 20 (seção 1).
 * Reaproveita os $defs do DashboardLayout via $ref por $id (sem duplicar contrato).
 */
declare const DashboardConfigSchema: {
    readonly $id: "dashboard-config.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "DashboardConfig";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["id", "version", "status", "title", "ownerId", "visibility", "filters", "rows"];
    readonly properties: {
        readonly id: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly version: {
            readonly type: "integer";
            readonly minimum: 1;
        };
        readonly status: {
            readonly type: "string";
            readonly enum: readonly ["draft", "published"];
        };
        readonly title: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly ownerId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly departmentId: {
            readonly type: readonly ["string", "null"];
        };
        readonly visibility: {
            readonly type: "string";
            readonly enum: readonly ["PRIVATE", "DEPARTMENT", "ORG"];
        };
        readonly filters: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "dashboard-layout.json#/$defs/filter";
            };
        };
        readonly rows: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "dashboard-layout.json#/$defs/row";
            };
        };
        readonly tabs: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "dashboard-layout.json#/$defs/tab";
            };
        };
    };
};

/**
 * Contrato do BLOCO (manifesto do catálogo) — Camada 2 do doc 20 / doc 33.
 *
 * Cada tipo de bloco do catálogo declara um manifesto NEUTRO (sem React, sem Zod).
 * Dele saem 3 consumidores: render no FE, GET /catalog (BE) e MCP list_catalog (IA).
 *
 * `dataContract` (shape / spec / example) é a "documentação rígida" que a IA lê para
 * saber QUAIS dados a query deve produzir e COMO o resultado é conciliado com o bloco.
 * Blocos narrativos (title / rich_text) não têm `dataContract`.
 */
declare const BlockManifestSchema: {
    readonly $id: "block-manifest.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockManifest";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["type", "kind", "name", "description", "source"];
    readonly properties: {
        readonly type: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly kind: {
            readonly type: "string";
            readonly enum: readonly ["chart", "text", "title", "layout"];
        };
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly description: {
            readonly type: "string";
        };
        readonly source: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly propsSchema: {
            readonly type: "object";
        };
        readonly dataContract: {
            readonly $ref: "#/$defs/dataContract";
        };
        readonly defaultProps: {
            readonly type: "object";
        };
        readonly minColumns: {
            readonly type: "integer";
            readonly minimum: 0;
        };
        readonly maxRows: {
            readonly type: "integer";
            readonly minimum: 0;
        };
        readonly version: {
            readonly type: "string";
        };
    };
    readonly $defs: {
        readonly dataContract: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["shape", "spec"];
            readonly properties: {
                readonly shape: {
                    readonly type: "string";
                    readonly enum: readonly ["scalar", "series", "categorical", "table"];
                };
                readonly spec: {
                    readonly type: "object";
                };
                readonly example: {};
            };
        };
    };
};

/**
 * Shapes concretos de DADOS por bloco (o que chega ao componente já transformado).
 * Um por `dataContract.shape`. Usados para validar o `data` de cada BlockDataResult
 * e como contrato das fixtures que destravam o FE enquanto T-C (execução) não existe.
 *
 * Fonte: doc 20 (Camada 2) + doc 33 (base inicial: kpi/bar/line/donut/table).
 */
/** shape 'scalar' → KPI (métrica única). */
declare const ScalarDataSchema: {
    readonly $id: "data-scalar.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "ScalarData";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["value"];
    readonly properties: {
        readonly value: {
            readonly type: readonly ["number", "null"];
        };
        readonly label: {
            readonly type: "string";
        };
        readonly unit: {
            readonly type: "string";
        };
        readonly delta: {
            readonly type: "number";
        };
        readonly format: {
            readonly type: "string";
        };
    };
};
/** shape 'series' → barras / linhas (x categórico ou temporal, y numérico, series opcional). */
declare const SeriesDataSchema: {
    readonly $id: "data-series.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "SeriesData";
    readonly type: "array";
    readonly items: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["x", "y"];
        readonly properties: {
            readonly x: {
                readonly type: readonly ["string", "number"];
            };
            readonly y: {
                readonly type: readonly ["number", "null"];
            };
            readonly series: {
                readonly type: "string";
            };
        };
    };
};
/** shape 'categorical' → donut / distribuição (label + value). */
declare const CategoricalDataSchema: {
    readonly $id: "data-categorical.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "CategoricalData";
    readonly type: "array";
    readonly items: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["label", "value"];
        readonly properties: {
            readonly label: {
                readonly type: "string";
            };
            readonly value: {
                readonly type: readonly ["number", "null"];
            };
        };
    };
};
/** shape 'table' → tabela (colunas + linhas). */
declare const TableDataSchema: {
    readonly $id: "data-table.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "TableData";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["columns", "rows"];
    readonly properties: {
        readonly columns: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["key", "label"];
                readonly properties: {
                    readonly key: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly label: {
                        readonly type: "string";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly enum: readonly ["string", "number", "date", "boolean"];
                    };
                };
            };
        };
        readonly rows: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
            };
        };
    };
};

/**
 * Contrato do PAYLOAD DE DADOS (batch por dashboard) — doc 20 (seção 3, fluxo de render).
 *
 * É a resposta do endpoint de dados batch (POST /dashboards/:id/data) e também o
 * formato base do que o socket emite por bloco. É CONTRA ESTE CONTRATO que o frontend
 * trabalha com FIXTURES enquanto a trilha de execução (T-C) não existe.
 *
 * Estados por bloco (doc 20): idle | queued | running | success | error.
 */
/** Resultado de um único bloco (standalone, com $id — usado também em payloads de socket). */
declare const BlockDataResultSchema: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["blockId", "state"];
    readonly properties: {
        readonly blockId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly state: {
            readonly type: "string";
            readonly enum: readonly ["idle", "queued", "running", "success", "error"];
        };
        readonly shape: {
            readonly type: "string";
            readonly enum: readonly ["scalar", "series", "categorical", "table"];
        };
        readonly data: {};
        readonly error: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["message"];
            readonly properties: {
                readonly code: {
                    readonly type: "string";
                };
                readonly message: {
                    readonly type: "string";
                };
            };
        };
        readonly meta: {
            readonly type: "object";
            readonly additionalProperties: true;
            readonly properties: {
                readonly cached: {
                    readonly type: "boolean";
                };
                readonly ttlSeconds: {
                    readonly type: "integer";
                    readonly minimum: 0;
                };
                readonly executedAt: {
                    readonly type: "string";
                };
                readonly rowCount: {
                    readonly type: "integer";
                    readonly minimum: 0;
                };
                readonly truncated: {
                    readonly type: "boolean";
                };
                readonly durationMs: {
                    readonly type: "integer";
                    readonly minimum: 0;
                };
            };
        };
    };
    readonly $id: "block-data-result.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockDataResult";
};
/** Payload batch: mapa blockId -> resultado. */
declare const DashboardDataPayloadSchema: {
    readonly $id: "dashboard-data-payload.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "DashboardDataPayload";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["dashboardId", "blocks"];
    readonly properties: {
        readonly dashboardId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly version: {
            readonly type: "integer";
            readonly minimum: 1;
        };
        readonly mode: {
            readonly type: "string";
            readonly enum: readonly ["dev", "published"];
        };
        readonly generatedAt: {
            readonly type: "string";
        };
        readonly blocks: {
            readonly type: "object";
            readonly additionalProperties: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["blockId", "state"];
                readonly properties: {
                    readonly blockId: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly state: {
                        readonly type: "string";
                        readonly enum: readonly ["idle", "queued", "running", "success", "error"];
                    };
                    readonly shape: {
                        readonly type: "string";
                        readonly enum: readonly ["scalar", "series", "categorical", "table"];
                    };
                    readonly data: {};
                    readonly error: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly required: readonly ["message"];
                        readonly properties: {
                            readonly code: {
                                readonly type: "string";
                            };
                            readonly message: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly meta: {
                        readonly type: "object";
                        readonly additionalProperties: true;
                        readonly properties: {
                            readonly cached: {
                                readonly type: "boolean";
                            };
                            readonly ttlSeconds: {
                                readonly type: "integer";
                                readonly minimum: 0;
                            };
                            readonly executedAt: {
                                readonly type: "string";
                            };
                            readonly rowCount: {
                                readonly type: "integer";
                                readonly minimum: 0;
                            };
                            readonly truncated: {
                                readonly type: "boolean";
                            };
                            readonly durationMs: {
                                readonly type: "integer";
                                readonly minimum: 0;
                            };
                        };
                    };
                };
            };
        };
    };
};

/**
 * Catálogo de eventos de Socket.IO + schemas dos payloads — doc 20 (seção 3).
 *
 * O worker (T-C) executa a query, transforma para o shape do bloco, grava cache e
 * EMITE um evento por bloco para a sala do dashboard. O FE escuta e troca o estado
 * do bloco (skeleton -> dado / erro), isoladamente.
 *
 * Sala (room): `dashboard:{dashboardId}` (ver helper em src/socket/events.ts).
 */
/** Nomes dos eventos (server -> client). Fonte única para BE (emit) e FE (on). */
declare const SOCKET_EVENTS: {
    readonly BLOCK_QUEUED: "block:queued";
    readonly BLOCK_RUNNING: "block:running";
    readonly BLOCK_DATA: "block:data";
    readonly BLOCK_ERROR: "block:error";
};
/** Payload de `block:queued`. */
declare const BlockQueuedEventSchema: {
    readonly $id: "evt-block-queued.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockQueuedEvent";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["dashboardId", "blockId", "state"];
    readonly properties: {
        readonly state: {
            readonly type: "string";
            readonly const: "queued";
        };
        readonly dashboardId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly blockId: {
            readonly type: "string";
            readonly minLength: 1;
        };
    };
};
/** Payload de `block:running`. */
declare const BlockRunningEventSchema: {
    readonly $id: "evt-block-running.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockRunningEvent";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["dashboardId", "blockId", "state"];
    readonly properties: {
        readonly state: {
            readonly type: "string";
            readonly const: "running";
        };
        readonly dashboardId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly blockId: {
            readonly type: "string";
            readonly minLength: 1;
        };
    };
};
/** Payload de `block:data` (sucesso) — carrega o BlockDataResult completo. */
declare const BlockDataEventSchema: {
    readonly $id: "evt-block-data.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockDataEvent";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["dashboardId", "blockId", "result"];
    readonly properties: {
        readonly result: {
            readonly $ref: "block-data-result.json";
        };
        readonly dashboardId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly blockId: {
            readonly type: "string";
            readonly minLength: 1;
        };
    };
};
/** Payload de `block:error`. */
declare const BlockErrorEventSchema: {
    readonly $id: "evt-block-error.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockErrorEvent";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["dashboardId", "blockId", "error"];
    readonly properties: {
        readonly error: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["message"];
            readonly properties: {
                readonly code: {
                    readonly type: "string";
                };
                readonly message: {
                    readonly type: "string";
                };
            };
        };
        readonly dashboardId: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly blockId: {
            readonly type: "string";
            readonly minLength: 1;
        };
    };
};

/**
 * DTOs das rotas de API (fronteira BE<->FE) — doc 20 (fluxo) + doc 30 (modelagem).
 *
 * Foco no caminho do dashboard/dados (a fronteira que destrava as trilhas).
 * Conexões/MCP têm DTOs próprios nas suas trilhas (T-A/T-D); aqui ficam os comuns.
 */
/** Envelope de erro padrão da API. */
declare const ApiErrorSchema: {
    readonly $id: "api-error.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "ApiError";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["error"];
    readonly properties: {
        readonly error: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["code", "message"];
            readonly properties: {
                readonly code: {
                    readonly type: "string";
                };
                readonly message: {
                    readonly type: "string";
                };
                readonly details: {};
            };
        };
    };
};
/** Item de listagem de dashboards (GET /dashboards). */
declare const DashboardSummarySchema: {
    readonly $id: "dashboard-summary.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "DashboardSummary";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["id", "title", "status", "visibility", "ownerId", "updatedAt"];
    readonly properties: {
        readonly id: {
            readonly type: "string";
        };
        readonly title: {
            readonly type: "string";
        };
        readonly status: {
            readonly type: "string";
            readonly enum: readonly ["draft", "published"];
        };
        readonly visibility: {
            readonly type: "string";
            readonly enum: readonly ["PRIVATE", "DEPARTMENT", "ORG"];
        };
        readonly ownerId: {
            readonly type: "string";
        };
        readonly departmentId: {
            readonly type: readonly ["string", "null"];
        };
        readonly updatedAt: {
            readonly type: "string";
        };
    };
};
/** Detalhe de um dashboard (GET /dashboards/:id) — metadados + layout corrente. */
declare const DashboardDetailSchema: {
    readonly $id: "dashboard-detail.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "DashboardDetail";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["id", "title", "status", "visibility", "ownerId", "layout"];
    readonly properties: {
        readonly id: {
            readonly type: "string";
        };
        readonly title: {
            readonly type: "string";
        };
        readonly status: {
            readonly type: "string";
            readonly enum: readonly ["draft", "published"];
        };
        readonly visibility: {
            readonly type: "string";
            readonly enum: readonly ["PRIVATE", "DEPARTMENT", "ORG"];
        };
        readonly ownerId: {
            readonly type: "string";
        };
        readonly departmentId: {
            readonly type: readonly ["string", "null"];
        };
        readonly version: {
            readonly type: "integer";
            readonly minimum: 1;
        };
        readonly publishedAt: {
            readonly type: readonly ["string", "null"];
        };
        readonly createdAt: {
            readonly type: "string";
        };
        readonly updatedAt: {
            readonly type: "string";
        };
        readonly layout: {
            readonly $ref: "dashboard-layout.json";
        };
    };
};
/** Body de criação (POST /dashboards). */
declare const CreateDashboardRequestSchema: {
    readonly $id: "create-dashboard-request.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "CreateDashboardRequest";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["title"];
    readonly properties: {
        readonly title: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly departmentId: {
            readonly type: readonly ["string", "null"];
        };
        readonly visibility: {
            readonly type: "string";
            readonly enum: readonly ["PRIVATE", "DEPARTMENT", "ORG"];
        };
        readonly layout: {
            readonly $ref: "dashboard-layout.json";
        };
    };
};
/** Body de atualização (PATCH /dashboards/:id). Todos os campos opcionais. */
declare const UpdateDashboardRequestSchema: {
    readonly $id: "update-dashboard-request.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "UpdateDashboardRequest";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly title: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly departmentId: {
            readonly type: readonly ["string", "null"];
        };
        readonly visibility: {
            readonly type: "string";
            readonly enum: readonly ["PRIVATE", "DEPARTMENT", "ORG"];
        };
        readonly layout: {
            readonly $ref: "dashboard-layout.json";
        };
    };
};
/**
 * Body do endpoint de dados batch (POST /dashboards/:id/data).
 * `filters` = valores correntes dos filtros (filterId -> valor). `mode` controla cache.
 */
declare const BlockDataRequestSchema: {
    readonly $id: "block-data-request.json";
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: "BlockDataRequest";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly filters: {
            readonly type: "object";
        };
        readonly mode: {
            readonly type: "string";
            readonly enum: readonly ["dev", "published"];
        };
        readonly blockIds: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
    };
};

/**
 * Tipos TS derivados dos JSON Schemas via `json-schema-to-ts` (ZERO Zod).
 *
 * Os tipos são inferidos do schema `as const` — mudar o schema muda o tipo
 * automaticamente. Para schemas que usam $ref externo (por $id), o tipo é
 * composto à mão reaproveitando os tipos já derivados (sem reescrever contrato).
 */

type FilterType = 'date_range' | 'select' | 'multiselect' | 'search' | 'number_range';
interface Filter {
    id: string;
    type: FilterType;
    label: string;
    /** valor inicial do filtro — shape depende do tipo. */
    default?: unknown;
}
interface DataBindingParam {
    filterId: string;
    as: string;
}
interface DataBinding {
    connectionId: string;
    query: string;
    params?: DataBindingParam[];
    /** mapeamento resultado→shape do bloco (ref nomeada ou objeto declarativo). */
    transform?: unknown;
    ttlSeconds?: number;
}
interface Block {
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
    /** título do card (header do frame). Se ausente, o render usa o `manifest.name`. */
    title?: string;
    /** subtítulo do header. */
    subtitle?: string;
    props?: Record<string, unknown>;
    dataBinding?: DataBinding;
    /** filhos (composição recursiva) — presente em blocos-container (section/bento). */
    blocks?: Block[];
}
interface Row {
    id: string;
    title?: string;
    blocks: Block[];
}
/**
 * ABA do dashboard — agrupa `rows` em páginas navegáveis.
 *
 * A aba referencia as linhas por ID (`rowIds`) em vez de contê-las: `rows`
 * segue sendo a lista CANÔNICA e completa de linhas do layout. Ver a nota
 * longa em `$defs.tab` do `DashboardLayoutSchema` (e doc 40) para o porquê.
 */
interface Tab {
    id: string;
    title: string;
    /** ids de `rows` que compõem a aba, na ordem de exibição. */
    rowIds: string[];
}
interface DashboardLayout {
    filters: Filter[];
    rows: Row[];
    /**
     * OPCIONAL — ausente nos dashboards já salvos. Um layout sem `tabs` é lido
     * como UMA aba implícita contendo todas as `rows` (ver `resolveDashboardTabs`).
     */
    tabs?: Tab[];
}
type ArtifactStatus = 'draft' | 'published';
type Visibility = 'PRIVATE' | 'DEPARTMENT' | 'ORG';
/** DashboardConfig completo (metadados + layout inline), como no doc 20. */
type DashboardConfig = {
    id: string;
    version: number;
    status: ArtifactStatus;
    title: string;
    ownerId: string;
    departmentId?: string | null;
    visibility: Visibility;
} & DashboardLayout;
type BlockManifest = FromSchema<typeof BlockManifestSchema>;
type BlockKind = BlockManifest['kind'];
type DataShape = 'scalar' | 'series' | 'categorical' | 'table';
type ScalarData = FromSchema<typeof ScalarDataSchema>;
type SeriesData = FromSchema<typeof SeriesDataSchema>;
type CategoricalData = FromSchema<typeof CategoricalDataSchema>;
type TableData = FromSchema<typeof TableDataSchema>;
type BlockData = ScalarData | SeriesData | CategoricalData | TableData;
type BlockState = 'idle' | 'queued' | 'running' | 'success' | 'error';
type BlockDataResult = FromSchema<typeof BlockDataResultSchema>;
type DashboardDataPayload = FromSchema<typeof DashboardDataPayloadSchema>;
type BlockQueuedEvent = FromSchema<typeof BlockQueuedEventSchema>;
type BlockRunningEvent = FromSchema<typeof BlockRunningEventSchema>;
type BlockErrorEvent = FromSchema<typeof BlockErrorEventSchema>;
/** `result` usa $ref externo → composto à mão com BlockDataResult. */
type BlockDataEvent = {
    dashboardId: string;
    blockId: string;
    result: BlockDataResult;
};
type ApiError = FromSchema<typeof ApiErrorSchema>;
type DashboardSummary = FromSchema<typeof DashboardSummarySchema>;
/** `layout` usa $ref externo → composto com DashboardLayout. */
type DashboardDetail = {
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
type CreateDashboardRequest = Omit<FromSchema<typeof CreateDashboardRequestSchema>, 'layout'> & {
    layout?: DashboardLayout;
};
type UpdateDashboardRequest = Omit<FromSchema<typeof UpdateDashboardRequestSchema>, 'layout'> & {
    layout?: DashboardLayout;
};
type BlockDataRequest = FromSchema<typeof BlockDataRequestSchema>;

/**
 * Validador neutro reutilizável (ajv) — funciona em qualquer lado (BE/FE/MCP),
 * SEM dependencia de Zod. Compila os JSON Schemas `as const` e expõe validadores
 * pré-compilados + helpers genéricos.
 *
 * Uso (runtime validation):
 *   import { validateDashboardLayout, assertValid, formatErrors } from '@dashboards/contracts';
 *   if (!validateDashboardLayout(input)) throw new Error(formatErrors(validateDashboardLayout.errors));
 */

/** Instância ajv compartilhada. `strict:false` aceita $defs/keywords anotativos. */
declare const ajv: Ajv;
declare const validateDashboardLayout: ValidateFunction<DashboardLayout>;
declare const validateDashboardConfig: ValidateFunction<DashboardConfig>;
declare const validateBlockManifest: ValidateFunction<{
    version?: string | undefined;
    propsSchema?: {
        [x: string]: unknown;
    } | undefined;
    dataContract?: {
        example?: unknown;
        shape: "scalar" | "series" | "categorical" | "table";
        spec: {
            [x: string]: unknown;
        };
    } | undefined;
    defaultProps?: {
        [x: string]: unknown;
    } | undefined;
    minColumns?: number | undefined;
    maxRows?: number | undefined;
    type: string;
    kind: "title" | "chart" | "text" | "layout";
    name: string;
    description: string;
    source: string;
}>;
declare const validateScalarData: ValidateFunction<{
    label?: string | undefined;
    format?: string | undefined;
    unit?: string | undefined;
    delta?: number | undefined;
    value: number | null;
}>;
declare const validateSeriesData: ValidateFunction<{
    series?: string | undefined;
    x: string | number;
    y: number | null;
}[]>;
declare const validateCategoricalData: ValidateFunction<{
    label: string;
    value: number | null;
}[]>;
declare const validateTableData: ValidateFunction<{
    rows: {
        [x: string]: unknown;
    }[];
    columns: {
        type?: "string" | "number" | "boolean" | "date" | undefined;
        label: string;
        key: string;
    }[];
}>;
declare const validateBlockDataResult: ValidateFunction<{
    shape?: "scalar" | "series" | "categorical" | "table" | undefined;
    error?: {
        code?: string | undefined;
        message: string;
    } | undefined;
    data?: unknown;
    meta?: {
        [x: string]: unknown;
        cached?: boolean | undefined;
        ttlSeconds?: number | undefined;
        executedAt?: string | undefined;
        rowCount?: number | undefined;
        truncated?: boolean | undefined;
        durationMs?: number | undefined;
    } | undefined;
    blockId: string;
    state: "idle" | "queued" | "running" | "success" | "error";
}>;
declare const validateDashboardDataPayload: ValidateFunction<{
    version?: number | undefined;
    mode?: "published" | "dev" | undefined;
    generatedAt?: string | undefined;
    blocks: {
        [x: string]: {
            shape?: "scalar" | "series" | "categorical" | "table" | undefined;
            error?: {
                code?: string | undefined;
                message: string;
            } | undefined;
            data?: unknown;
            meta?: {
                [x: string]: unknown;
                cached?: boolean | undefined;
                ttlSeconds?: number | undefined;
                executedAt?: string | undefined;
                rowCount?: number | undefined;
                truncated?: boolean | undefined;
                durationMs?: number | undefined;
            } | undefined;
            blockId: string;
            state: "idle" | "queued" | "running" | "success" | "error";
        };
    };
    dashboardId: string;
}>;
declare const validateBlockQueuedEvent: ValidateFunction<{
    blockId: string;
    state: "queued";
    dashboardId: string;
}>;
declare const validateBlockRunningEvent: ValidateFunction<{
    blockId: string;
    state: "running";
    dashboardId: string;
}>;
declare const validateBlockDataEvent: ValidateFunction<BlockDataEvent>;
declare const validateBlockErrorEvent: ValidateFunction<{
    blockId: string;
    error: {
        code?: string | undefined;
        message: string;
    };
    dashboardId: string;
}>;
declare const validateApiError: ValidateFunction<{
    error: {
        details?: unknown;
        message: string;
        code: string;
    };
}>;
declare const validateDashboardSummary: ValidateFunction<{
    departmentId?: string | null | undefined;
    id: string;
    title: string;
    status: "draft" | "published";
    ownerId: string;
    visibility: "PRIVATE" | "DEPARTMENT" | "ORG";
    updatedAt: string;
}>;
declare const validateDashboardDetail: ValidateFunction<DashboardDetail>;
declare const validateCreateDashboardRequest: ValidateFunction<CreateDashboardRequest>;
declare const validateUpdateDashboardRequest: ValidateFunction<UpdateDashboardRequest>;
declare const validateBlockDataRequest: ValidateFunction<{
    filters?: {
        [x: string]: unknown;
    } | undefined;
    mode?: "published" | "dev" | undefined;
    blockIds?: string[] | undefined;
}>;
/** Valida o `data` de um BlockDataResult conforme o shape declarado. */
declare function validateBlockDataByShape(shape: 'scalar' | 'series' | 'categorical' | 'table', data: unknown): {
    valid: boolean;
    errors: ErrorObject[] | null;
};
/** Formata os erros do ajv em uma string legível. */
declare function formatErrors(errors: ErrorObject[] | null | undefined): string;
declare class ContractValidationError extends Error {
    readonly errors: ErrorObject[];
    constructor(label: string, errors: ErrorObject[] | null | undefined);
}
/**
 * Valida `data` com um validador e RETORNA o valor tipado, ou lança
 * ContractValidationError. Útil para guardas em rotas/worker/MCP.
 */
declare function assertValid<T>(validate: ValidateFunction<T>, data: unknown, label?: string): T;

/**
 * Resolução de ABAS de um dashboard — função PURA, compartilhada BE/FE/MCP.
 *
 * É a ÚNICA fonte da verdade sobre "quais linhas aparecem em qual aba". Se cada
 * lado normalizasse por conta própria, o editor, a tela de visualização e o
 * backend discordariam sobre onde está uma linha — e o sintoma seria bloco
 * sumindo da tela, que é justamente o que não pode acontecer aqui.
 *
 * MODELO (doc 40): `tabs` é uma PROJEÇÃO sobre `rows` — a aba guarda os IDS das
 * linhas (`rowIds`), não as linhas. `rows` continua sendo a lista canônica e
 * completa, então todo consumidor que percorre `layout.rows` (resolução de
 * dados, validação de chartId, snapshot do publish, export de PDF, MCP, agente)
 * segue enxergando 100% dos blocos sem precisar conhecer abas.
 *
 * INVARIANTE QUE ESTE MÓDULO GARANTE:
 *   união das linhas de todas as abas resolvidas === `layout.rows`
 * ou seja: NENHUM bloco fica invisível, aconteça o que acontecer com o JSON.
 * Sem isso, um layout escrito pelo agente (que hoje não conhece abas) esconderia
 * conteúdo silenciosamente — sem erro, sem aviso, só um dashboard incompleto.
 */

/**
 * Id da aba sintética usada quando o layout não declara `tabs`. Começa com `__`
 * para não colidir com id gerado pelo editor/agente (que usam prefixo `tab_`).
 */
declare const IMPLICIT_TAB_ID = "__default__";
/** Rótulo da aba implícita (layout legado, sem abas declaradas). */
declare const IMPLICIT_TAB_TITLE = "Vis\u00E3o geral";
/** Uma aba já resolvida: com as `rows` reais, prontas para render. */
interface ResolvedTab {
    id: string;
    title: string;
    /** Linhas da aba, já materializadas e na ordem de exibição. */
    rows: Row[];
    /**
     * `true` quando a aba não existe no JSON e foi sintetizada porque o layout é
     * legado (sem `tabs`). A UI usa isso para NÃO desenhar a navegação lateral
     * quando só existe a aba implícita — um dashboard sem abas não deve ganhar
     * uma barra de abas de uma aba só.
     */
    isImplicit: boolean;
}
/** `true` quando o layout declara abas de verdade (não a implícita). */
declare function hasExplicitTabs(layout: Pick<DashboardLayout, 'tabs'> | null | undefined): boolean;
/**
 * Resolve as abas de um layout em linhas materializadas.
 *
 * Regras de normalização (todas defensivas — o layout pode ter sido escrito
 * pelo agente, por uma versão anterior do editor ou à mão):
 *
 *  1. sem `tabs` (ou `tabs: []`)  → UMA aba implícita com TODAS as `rows`,
 *     na ordem original. É a retrocompatibilidade dos dashboards já salvos.
 *  2. `rowId` que não existe em `rows` → ignorado (não inventa linha fantasma).
 *  3. mesmo `rowId` em duas abas → a PRIMEIRA ocorrência vence (linha nunca
 *     é renderizada duas vezes — id de bloco duplicado quebraria o mapa de
 *     dados do batch, que é indexado por blockId).
 *  4. linha ÓRFÃ (existe em `rows`, não citada por nenhuma aba) → anexada ao
 *     FIM da PRIMEIRA aba. É esta regra que sustenta o invariante de que
 *     nenhum bloco some. Acontece de verdade quando o agente insere uma linha
 *     via `add_chart_to_dashboard` sem saber que o dashboard tem abas.
 */
declare function resolveDashboardTabs(layout: DashboardLayout | null | undefined): ResolvedTab[];
/**
 * Escolhe a aba ATIVA a partir de um id pedido (ex.: `?tab=` da URL).
 * Cai na primeira aba quando o id é inválido/ausente — assim um link antigo ou
 * uma aba removida abrem o dashboard em vez de uma tela vazia.
 */
declare function pickActiveTab(tabs: ResolvedTab[], requestedId: string | null | undefined): ResolvedTab | undefined;
/**
 * Devolve um `DashboardLayout` contendo SOMENTE as linhas da aba indicada —
 * o objeto que vai para o `DashboardRenderer`.
 *
 * Existe para que a tela de visualização REUSE o renderer como ele é (ele é
 * orientado a `rows`), sem duplicar render nem precisar de mudança no
 * render-engine: trocar de aba é só trocar o `layout.rows` que ele recebe.
 * `tabs` sai do objeto devolvido de propósito — o renderer não deve nem saber
 * que abas existem.
 */
declare function layoutForTab(layout: DashboardLayout | null | undefined, tab: ResolvedTab | undefined): DashboardLayout;

/**
 * Contrato dos eventos do TURNO DO AGENTE (server -> client), sala
 * `chat:{conversationId}`.
 *
 * ## Por que este arquivo existe
 *
 * O produto se chama auditorIA e promete "respostas auditáveis". Até aqui o
 * socket carregava apenas o texto (`chat:delta`) e o nome cru da ferramenta
 * (`chat:tool-step`) — ou seja, a tela mostrava a CONCLUSÃO do agente e
 * escondia a EVIDÊNCIA: qual conexão ele abriu, qual SQL executou, quantas
 * linhas voltaram, quanto tempo levou. Uma resposta sem essas quatro coisas
 * não é auditável; é só uma opinião bem formatada.
 *
 * Os eventos abaixo existem para que cada afirmação do agente chegue à tela
 * acompanhada da prova de como foi obtida — durante o streaming e também
 * depois, porque a mesma estrutura é persistida em `ChatMessage.toolData` e
 * relida ao reabrir a conversa.
 *
 * ## Compatibilidade
 *
 * Todo campo novo é OPCIONAL. Um backend antigo continua válido para um
 * frontend novo (a trilha degrada para o que existia: nome + fase) e um
 * frontend antigo ignora o que não conhece. Isso permite subir os dois lados
 * em ordens diferentes sem janela de quebra.
 */
/**
 * Em que ponto do turno o agente está.
 *
 * Existe porque "O agente está trabalhando…" não informa nada: quem espera
 * 40 segundos não sabe se o agente está pensando, se travou numa query pesada
 * ou se já está escrevendo. Cada fase autoriza uma frase honesta na tela.
 */
type ChatTurnPhase = 
/** Decidindo o próximo passo (entre ferramentas, sem texto saindo). */
'thinking'
/** Executando uma ferramenta — `label` diz qual, em português. */
 | 'tool'
/** Redigindo a resposta final (os deltas estão saindo). */
 | 'writing';
interface ChatPhaseEvent {
    conversationId: string;
    runId: string;
    phase: ChatTurnPhase;
    /**
     * Frase pronta para a tela ("Consultando teste · Postgres").
     * Vem montada do servidor porque só ele conhece o alvo real da chamada.
     */
    label?: string;
}
/**
 * Amostra tabular do resultado de uma ferramenta.
 *
 * O resultado cru de um `run_query` pode ter milhares de linhas; mandá-lo
 * inteiro pelo socket trava a aba e não ajuda ninguém a auditar. A amostra é
 * o suficiente para o usuário CONFERIR o formato do que voltou, e `totalRows`
 * preserva a verdade sobre o tamanho real.
 */
interface ChatStepPreview {
    columns: string[];
    rows: Array<Array<string | number | boolean | null>>;
    /** Total real de linhas, quando `rows` foi truncado para a amostra. */
    totalRows?: number;
}
/** Resultado de um passo. `running` = a chamada saiu e ainda não voltou. */
type ChatStepStatus = 'running' | 'ok' | 'error';
/**
 * Um passo da trilha de auditoria.
 *
 * É emitido duas vezes por ferramenta: em `call` (o agente pediu) e em
 * `result` (voltou). A tela casa os dois pelo `toolCallId` — por isso ele é o
 * único campo que jamais pode faltar.
 */
interface ChatToolStepEvent {
    conversationId: string;
    runId: string;
    toolCallId: string;
    toolName: string;
    phase: 'call' | 'result';
    args?: unknown;
    output?: unknown;
    /** Rótulo humano do passo ("Executando consulta"). */
    title?: string;
    /** Sobre o quê ("messages", "Vendas por mês"). */
    target?: string;
    /** Resumo do desfecho ("128 linhas · 340 ms"). */
    summary?: string;
    /**
     * O SQL que rodou. Só em `run_query`, e é O campo desta feature: sem ele o
     * usuário não tem como discordar do número que recebeu.
     */
    sql?: string;
    /** Conexão onde o SQL rodou — a mesma pergunta em dois bancos dá respostas diferentes. */
    connectionName?: string;
    /** Linhas retornadas (mesmo quando `preview` foi truncado). */
    rowCount?: number;
    durationMs?: number;
    status?: ChatStepStatus;
    /** Mensagem de falha quando `status === 'error'`. */
    errorMessage?: string;
    /**
     * Marca ferramentas que APAGAM ou despublicam (`delete_*`, `unpublish_*`).
     * A tela destaca esses passos: um agente que apagou um dashboard não pode
     * relatar isso com o mesmo peso visual de uma leitura.
     */
    isDestructive?: boolean;
    /** Amostra do resultado, para conferência. */
    preview?: ChatStepPreview;
}
/**
 * Gráfico pronto para renderizar dentro da resposta.
 *
 * O evento já existia declarado no backend (`CHAT_EVENTS.CHART`) e nunca foi
 * emitido — o estado vazio do chat promete "com o gráfico pronto para salvar"
 * e o gráfico nunca aparecia. `result` vem no shape que o render-engine
 * consome, então a mesma peça do dashboard renderiza aqui.
 */
interface ChatChartEvent {
    conversationId: string;
    runId: string;
    messageId: string;
    chart: ChatChartPayload;
}
interface ChatChartPayload {
    /** Id do Chart quando o agente já o materializou via MCP. */
    chartId?: string;
    title: string;
    /** catalogType do bloco (kpi | bar_chart | line_chart | donut | table | …). */
    catalogType: string;
    props?: Record<string, unknown>;
    /** Dados no shape do contrato de bloco — alimenta o BlockRenderer. */
    result: unknown;
    /** Vínculo de dados que materializa o Chart ao salvar no dashboard. */
    dataBinding?: unknown;
}
/** O que o agente fez com um artefato durante o turno. */
type ChatArtifactAction = 'created' | 'updated' | 'published' | 'unpublished' | 'deleted';
/**
 * Artefato tocado pelo agente.
 *
 * Vira um cartão acionável na resposta ("Abrir dashboard"). Sem isto o agente
 * anuncia em texto que criou algo e o usuário precisa caçar o item na
 * listagem — o trabalho fica pronto e some.
 */
interface ChatArtifactEvent {
    conversationId: string;
    runId: string;
    kind: 'chart' | 'dashboard';
    id: string;
    title: string;
    action: ChatArtifactAction;
}
/** Consumo do turno. Alimenta o rodapé da resposta (tokens, tempo, passos). */
interface ChatUsageEvent {
    conversationId: string;
    runId: string;
    messageId: string;
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    elapsedMs?: number;
    steps?: number;
}
/**
 * Título da conversa renomeado pelo servidor no fim do primeiro turno.
 *
 * Antes a lista só descobria o novo título num recarregamento: o usuário
 * mandava a primeira pergunta e a conversa continuava se chamando "Nova
 * conversa" na barra lateral até ele sair e voltar.
 */
interface ChatTitleEvent {
    conversationId: string;
    title: string;
}

/**
 * Helpers de Socket.IO compartilhados (nomes de evento + sala do dashboard).
 * Reexporta SOCKET_EVENTS (fonte única dos nomes) e tipa o mapa evento->payload.
 */

type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
/** Nome da sala (room) por dashboard: o FE entra, o worker emite p/ ela. */
declare function dashboardRoom(dashboardId: string): string;
/**
 * Avisos do trabalho do AGENTE (server -> client).
 *
 * O agente executa no servidor, então a tela não tem como perceber sozinha o
 * que ele fez. Sem estes avisos, um gráfico criado pelo agente só aparecia
 * depois de um F5, e quem saía da tela do chat achava que a resposta tinha
 * morrido (não morre: a execução continua e é persistida — falta só avisar).
 */
interface ArtifactChangedEvent {
    kind: 'chart' | 'dashboard';
    /** Tool do agente que provocou a mudança (ex.: `publish_chart`). */
    tool: string;
    chartId?: string;
    dashboardId?: string;
}
interface ChatTurnCompleteEvent {
    conversationId: string;
    /** true quando o turno terminou em erro (a mensagem de erro foi persistida). */
    failed: boolean;
}
/** Mapa tipado evento -> payload (server -> client). */
interface ServerToClientEvents {
    [SOCKET_EVENTS.BLOCK_QUEUED]: (payload: BlockQueuedEvent) => void;
    [SOCKET_EVENTS.BLOCK_RUNNING]: (payload: BlockRunningEvent) => void;
    [SOCKET_EVENTS.BLOCK_DATA]: (payload: BlockDataEvent) => void;
    [SOCKET_EVENTS.BLOCK_ERROR]: (payload: BlockErrorEvent) => void;
    'artifact:changed': (payload: ArtifactChangedEvent) => void;
    'chat:turn-complete': (payload: ChatTurnCompleteEvent) => void;
    /**
     * Pedaços da resposta do agente, na sala `chat:{conversationId}`.
     * O `seq` é o que torna a resposta RETOMÁVEL: quem volta descarta o que já
     * tem e continua do número seguinte, sem buraco nem repetição.
     */
    'chat:delta': (payload: ChatDeltaEvent) => void;
    'chat:tool-step': (payload: ChatToolStepEvent) => void;
    'chat:done': (payload: ChatDoneEvent) => void;
    'chat:error': (payload: ChatErrorEvent) => void;
    /**
     * Trilha de auditoria e contexto do turno — ver `./chat` para o porquê de
     * cada um. Todos chegam na mesma sala dos deltas.
     */
    'chat:phase': (payload: ChatPhaseEvent) => void;
    'chat:chart': (payload: ChatChartEvent) => void;
    'chat:artifact': (payload: ChatArtifactEvent) => void;
    'chat:usage': (payload: ChatUsageEvent) => void;
    'chat:title': (payload: ChatTitleEvent) => void;
}
interface ChatDeltaEvent {
    conversationId: string;
    runId: string;
    messageId: string;
    delta: string;
    /** Número do pedaço (1, 2, 3…) dentro deste turno. */
    seq: number;
}
interface ChatDoneEvent {
    conversationId: string;
    runId: string;
    messageId: string;
    text: string;
}
interface ChatErrorEvent {
    conversationId: string;
    runId: string;
    messageId: string;
    message: string;
}

declare const kpiManifest: {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            accent: {
                type: string;
            };
            icon: {
                type: string;
            };
            showDelta: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "scalar";
        spec: {
            value: {
                type: string;
                required: boolean;
            };
            label: {
                type: string;
                required: boolean;
            };
            delta: {
                type: string;
                required: boolean;
            };
        };
        example: {
            value: number;
            label: string;
            unit: string;
            delta: number;
        };
    };
    defaultProps: {
        showDelta: boolean;
    };
    version: string;
};
declare const barChartManifest: {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            stacked: {
                type: string;
            };
            orientation: {
                type: string;
                enum: string[];
            };
        };
    };
    dataContract: {
        shape: "series";
        spec: {
            x: {
                type: string;
                required: boolean;
            };
            y: {
                type: string;
                required: boolean;
            };
            series: {
                type: string;
                required: boolean;
            };
        };
        example: {
            x: string;
            y: number;
        }[];
    };
    defaultProps: {
        orientation: string;
        stacked: boolean;
    };
    minColumns: number;
    maxRows: number;
    version: string;
};
declare const lineChartManifest: {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            smooth: {
                type: string;
            };
            area: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "series";
        spec: {
            x: {
                type: string;
                required: boolean;
            };
            y: {
                type: string;
                required: boolean;
            };
            series: {
                type: string;
                required: boolean;
            };
        };
        example: {
            x: string;
            y: number;
        }[];
    };
    defaultProps: {
        smooth: boolean;
    };
    maxRows: number;
    version: string;
};
declare const donutManifest: {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            showLegend: {
                type: string;
            };
            centerLabel: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "categorical";
        spec: {
            label: {
                type: string;
                required: boolean;
            };
            value: {
                type: string;
                required: boolean;
            };
        };
        example: {
            label: string;
            value: number;
        }[];
    };
    defaultProps: {
        showLegend: boolean;
    };
    version: string;
};
declare const tableManifest: {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            pageSize: {
                type: string;
                minimum: number;
            };
            dense: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "table";
        spec: {
            columns: {
                type: string;
                required: boolean;
            };
            rows: {
                type: string;
                required: boolean;
            };
        };
        example: {
            columns: {
                key: string;
                label: string;
                type: string;
            }[];
            rows: {
                municipio: string;
                valor: number;
            }[];
        };
    };
    defaultProps: {
        pageSize: number;
    };
    maxRows: number;
    version: string;
};
declare const titleManifest: {
    type: string;
    kind: "title";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        required: string[];
        properties: {
            text: {
                type: string;
            };
            level: {
                type: string;
                minimum: number;
                maximum: number;
            };
            align: {
                type: string;
                enum: string[];
            };
        };
    };
    defaultProps: {
        level: number;
        align: string;
    };
    version: string;
};
declare const richTextManifest: {
    type: string;
    kind: "text";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        required: string[];
        properties: {
            markdown: {
                type: string;
            };
        };
    };
    defaultProps: {
        markdown: string;
    };
    version: string;
};
/** As 7 unidades da base inicial (doc 33). */
declare const baseManifests: ({
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            accent: {
                type: string;
            };
            icon: {
                type: string;
            };
            showDelta: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "scalar";
        spec: {
            value: {
                type: string;
                required: boolean;
            };
            label: {
                type: string;
                required: boolean;
            };
            delta: {
                type: string;
                required: boolean;
            };
        };
        example: {
            value: number;
            label: string;
            unit: string;
            delta: number;
        };
    };
    defaultProps: {
        showDelta: boolean;
    };
    version: string;
} | {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            stacked: {
                type: string;
            };
            orientation: {
                type: string;
                enum: string[];
            };
        };
    };
    dataContract: {
        shape: "series";
        spec: {
            x: {
                type: string;
                required: boolean;
            };
            y: {
                type: string;
                required: boolean;
            };
            series: {
                type: string;
                required: boolean;
            };
        };
        example: {
            x: string;
            y: number;
        }[];
    };
    defaultProps: {
        orientation: string;
        stacked: boolean;
    };
    minColumns: number;
    maxRows: number;
    version: string;
} | {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            smooth: {
                type: string;
            };
            area: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "series";
        spec: {
            x: {
                type: string;
                required: boolean;
            };
            y: {
                type: string;
                required: boolean;
            };
            series: {
                type: string;
                required: boolean;
            };
        };
        example: {
            x: string;
            y: number;
        }[];
    };
    defaultProps: {
        smooth: boolean;
    };
    maxRows: number;
    version: string;
} | {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            showLegend: {
                type: string;
            };
            centerLabel: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "categorical";
        spec: {
            label: {
                type: string;
                required: boolean;
            };
            value: {
                type: string;
                required: boolean;
            };
        };
        example: {
            label: string;
            value: number;
        }[];
    };
    defaultProps: {
        showLegend: boolean;
    };
    version: string;
} | {
    type: string;
    kind: "chart";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        properties: {
            pageSize: {
                type: string;
                minimum: number;
            };
            dense: {
                type: string;
            };
        };
    };
    dataContract: {
        shape: "table";
        spec: {
            columns: {
                type: string;
                required: boolean;
            };
            rows: {
                type: string;
                required: boolean;
            };
        };
        example: {
            columns: {
                key: string;
                label: string;
                type: string;
            }[];
            rows: {
                municipio: string;
                valor: number;
            }[];
        };
    };
    defaultProps: {
        pageSize: number;
    };
    maxRows: number;
    version: string;
} | {
    type: string;
    kind: "title";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        required: string[];
        properties: {
            text: {
                type: string;
            };
            level: {
                type: string;
                minimum: number;
                maximum: number;
            };
            align: {
                type: string;
                enum: string[];
            };
        };
    };
    defaultProps: {
        level: number;
        align: string;
    };
    version: string;
} | {
    type: string;
    kind: "text";
    name: string;
    description: string;
    source: string;
    propsSchema: {
        type: string;
        additionalProperties: boolean;
        required: string[];
        properties: {
            markdown: {
                type: string;
            };
        };
    };
    defaultProps: {
        markdown: string;
    };
    version: string;
})[];

declare const dashboardConfigFixture: {
    id: string;
    version: number;
    status: "draft";
    title: string;
    ownerId: string;
    departmentId: string;
    visibility: "DEPARTMENT";
    filters: ({
        id: string;
        type: "date_range";
        label: string;
        default: {
            from: string;
            to: string;
        };
    } | {
        id: string;
        type: "select";
        label: string;
        default: string;
    })[];
    rows: ({
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                text: string;
                level: number;
                align: string;
                showDelta?: undefined;
                orientation?: undefined;
                stacked?: undefined;
            };
            dataBinding?: undefined;
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                showDelta: boolean;
                text?: undefined;
                level?: undefined;
                align?: undefined;
                orientation?: undefined;
                stacked?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                transform: string;
                ttlSeconds: number;
            };
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                orientation: string;
                stacked: boolean;
                text?: undefined;
                level?: undefined;
                align?: undefined;
                showDelta?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                ttlSeconds: number;
                transform?: undefined;
            };
        })[];
    } | {
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                smooth: boolean;
                area: boolean;
                showLegend?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                ttlSeconds: number;
                params?: undefined;
            };
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                showLegend: boolean;
                smooth?: undefined;
                area?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                ttlSeconds: number;
            };
        })[];
    } | {
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                markdown: string;
                pageSize?: undefined;
                dense?: undefined;
            };
            dataBinding?: undefined;
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                pageSize: number;
                dense: boolean;
                markdown?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                ttlSeconds: number;
            };
        })[];
    })[];
};
/** Subset { filters, rows } salvo em Dashboard.draftLayout (ver modelagem 30). */
declare const dashboardLayoutFixture: {
    filters: ({
        id: string;
        type: "date_range";
        label: string;
        default: {
            from: string;
            to: string;
        };
    } | {
        id: string;
        type: "select";
        label: string;
        default: string;
    })[];
    rows: ({
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                text: string;
                level: number;
                align: string;
                showDelta?: undefined;
                orientation?: undefined;
                stacked?: undefined;
            };
            dataBinding?: undefined;
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                showDelta: boolean;
                text?: undefined;
                level?: undefined;
                align?: undefined;
                orientation?: undefined;
                stacked?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                transform: string;
                ttlSeconds: number;
            };
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                orientation: string;
                stacked: boolean;
                text?: undefined;
                level?: undefined;
                align?: undefined;
                showDelta?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                ttlSeconds: number;
                transform?: undefined;
            };
        })[];
    } | {
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                smooth: boolean;
                area: boolean;
                showLegend?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                ttlSeconds: number;
                params?: undefined;
            };
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                showLegend: boolean;
                smooth?: undefined;
                area?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                ttlSeconds: number;
            };
        })[];
    } | {
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                markdown: string;
                pageSize?: undefined;
                dense?: undefined;
            };
            dataBinding?: undefined;
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                pageSize: number;
                dense: boolean;
                markdown?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                ttlSeconds: number;
            };
        })[];
    })[];
};
/**
 * Mesmo layout, agora com ABAS (doc 40). Existe para exercitar de uma vez os
 * três casos que o normalizador precisa aguentar:
 *
 *  - `tab_visao`   → duas linhas, ordem EXPLÍCITA e diferente da ordem de `rows`
 *    (prova que quem manda na ordem é `rowIds`, não a posição em `rows`);
 *  - `tab_detalhe` → cita um `rowId` INEXISTENTE (`row_fantasma`), que deve ser
 *    ignorado sem quebrar;
 *  - `row_detalhe` → linha ÓRFÃ (não citada por nenhuma aba), que deve ser
 *    recuperada na primeira aba — é o caso real de quando o agente insere uma
 *    linha via `add_chart_to_dashboard` sem saber que existem abas.
 *
 * Reusa as MESMAS `rows` do fixture legado de propósito: os dois fixtures têm
 * exatamente o mesmo conjunto de blocos, então dá para afirmar em teste que
 * ligar abas não muda o total de blocos renderizados.
 */
declare const dashboardLayoutWithTabsFixture: {
    filters: ({
        id: string;
        type: "date_range";
        label: string;
        default: {
            from: string;
            to: string;
        };
    } | {
        id: string;
        type: "select";
        label: string;
        default: string;
    })[];
    rows: ({
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                text: string;
                level: number;
                align: string;
                showDelta?: undefined;
                orientation?: undefined;
                stacked?: undefined;
            };
            dataBinding?: undefined;
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                showDelta: boolean;
                text?: undefined;
                level?: undefined;
                align?: undefined;
                orientation?: undefined;
                stacked?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                transform: string;
                ttlSeconds: number;
            };
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                orientation: string;
                stacked: boolean;
                text?: undefined;
                level?: undefined;
                align?: undefined;
                showDelta?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                ttlSeconds: number;
                transform?: undefined;
            };
        })[];
    } | {
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                smooth: boolean;
                area: boolean;
                showLegend?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                ttlSeconds: number;
                params?: undefined;
            };
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                showLegend: boolean;
                smooth?: undefined;
                area?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                params: {
                    filterId: string;
                    as: string;
                }[];
                ttlSeconds: number;
            };
        })[];
    } | {
        id: string;
        title: string;
        blocks: ({
            id: string;
            type: string;
            span: number;
            props: {
                markdown: string;
                pageSize?: undefined;
                dense?: undefined;
            };
            dataBinding?: undefined;
        } | {
            id: string;
            type: string;
            span: number;
            props: {
                pageSize: number;
                dense: boolean;
                markdown?: undefined;
            };
            dataBinding: {
                connectionId: string;
                query: string;
                ttlSeconds: number;
            };
        })[];
    })[];
    tabs: {
        id: string;
        title: string;
        rowIds: string[];
    }[];
};

declare const dashboardDataPayloadFixture: {
    dashboardId: string;
    version: number;
    mode: "dev";
    generatedAt: string;
    blocks: {
        blk_kpi_total: {
            blockId: string;
            state: "success";
            shape: "scalar";
            data: {
                value: number;
                label: string;
                unit: string;
                delta: number;
            };
            meta: {
                cached: false;
                ttlSeconds: number;
                rowCount: number;
                durationMs: number;
            };
        };
        blk_bar_mes: {
            blockId: string;
            state: "success";
            shape: "series";
            data: {
                x: string;
                y: number;
            }[];
            meta: {
                cached: true;
                ttlSeconds: number;
                rowCount: number;
                truncated: false;
            };
        };
        blk_line: {
            blockId: string;
            state: "success";
            shape: "series";
            data: {
                x: string;
                y: number;
            }[];
        };
        blk_donut: {
            blockId: string;
            state: "success";
            shape: "categorical";
            data: {
                label: string;
                value: number;
            }[];
        };
        blk_table: {
            blockId: string;
            state: "queued";
        };
    };
};

export { type ApiError, ApiErrorSchema, type ArtifactChangedEvent, type ArtifactStatus, type Block, type BlockData, type BlockDataEvent, BlockDataEventSchema, type BlockDataRequest, BlockDataRequestSchema, type BlockDataResult, BlockDataResultSchema, type BlockErrorEvent, BlockErrorEventSchema, type BlockKind, type BlockManifest, BlockManifestSchema, type BlockQueuedEvent, BlockQueuedEventSchema, type BlockRunningEvent, BlockRunningEventSchema, type BlockState, type CategoricalData, CategoricalDataSchema, type ChatArtifactAction, type ChatArtifactEvent, type ChatChartEvent, type ChatChartPayload, type ChatDeltaEvent, type ChatDoneEvent, type ChatErrorEvent, type ChatPhaseEvent, type ChatStepPreview, type ChatStepStatus, type ChatTitleEvent, type ChatToolStepEvent, type ChatTurnCompleteEvent, type ChatTurnPhase, type ChatUsageEvent, ContractValidationError, type CreateDashboardRequest, CreateDashboardRequestSchema, type DashboardConfig, DashboardConfigSchema, type DashboardDataPayload, DashboardDataPayloadSchema, type DashboardDetail, DashboardDetailSchema, type DashboardLayout, DashboardLayoutSchema, type DashboardSummary, DashboardSummarySchema, type DataBinding, type DataBindingParam, type DataShape, type Filter, type FilterType, IMPLICIT_TAB_ID, IMPLICIT_TAB_TITLE, type ResolvedTab, type Row, SOCKET_EVENTS, type ScalarData, ScalarDataSchema, type SeriesData, SeriesDataSchema, type ServerToClientEvents, type SocketEventName, type Tab, type TableData, TableDataSchema, type UpdateDashboardRequest, UpdateDashboardRequestSchema, type Visibility, ajv, assertValid, barChartManifest, baseManifests, dashboardConfigFixture, dashboardDataPayloadFixture, dashboardLayoutFixture, dashboardLayoutWithTabsFixture, dashboardRoom, donutManifest, formatErrors, hasExplicitTabs, kpiManifest, layoutForTab, lineChartManifest, pickActiveTab, resolveDashboardTabs, richTextManifest, tableManifest, titleManifest, validateApiError, validateBlockDataByShape, validateBlockDataEvent, validateBlockDataRequest, validateBlockDataResult, validateBlockErrorEvent, validateBlockManifest, validateBlockQueuedEvent, validateBlockRunningEvent, validateCategoricalData, validateCreateDashboardRequest, validateDashboardConfig, validateDashboardDataPayload, validateDashboardDetail, validateDashboardLayout, validateDashboardSummary, validateScalarData, validateSeriesData, validateTableData, validateUpdateDashboardRequest };
