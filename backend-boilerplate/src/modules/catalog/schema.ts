/**
 * Schemas (Zod) do módulo `catalog`.
 *
 * O catálogo é uma referência LIDA por três consumidores com necessidades
 * diferentes — a galeria do front, o agente via MCP e as rotas que validam
 * `catalogType` —, então a resposta carrega `catalogVersion` junto: quem
 * guardar um layout precisa saber sob qual versão do catálogo ele foi escrito.
 *
 * `manifestSchema` é deliberadamente FROUXO (`passthrough`): a fonte da verdade
 * do formato é o `BlockManifestSchema` de `@dashboards/contracts`, validado no
 * momento em que o catálogo é GERADO (`build:catalog`). Revalidar aqui, com um
 * segundo schema escrito à mão, criaria duas verdades que divergem no primeiro
 * campo novo.
 */
import { z } from 'zod';

export const catalogKindSchema = z.enum(['chart', 'text', 'title', 'layout']);
export const catalogShapeSchema = z.enum(['scalar', 'series', 'categorical', 'table']);

/** Manifesto de bloco como servido pela API (forma garantida no build). */
export const manifestSchema = z
  .object({
    type: z.string(),
    kind: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    source: z.string().optional(),
    // JSON Schema arbitrário e contrato de dados: a forma já foi validada em
    // build-time contra o `BlockManifestSchema`. Aqui eles passam adiante.
    propsSchema: z.unknown().optional(),
    defaultProps: z.unknown().optional(),
    dataContract: z.unknown().optional(),
    version: z.string().optional(),
  })
  .passthrough();

export const listCatalogQuerySchema = z.object({
  /** Filtra por natureza do bloco (chart | text | title | layout). */
  kind: catalogKindSchema.optional(),
  /** Filtra pelo shape de dado exigido — o eixo que a IA usa para escolher. */
  shape: catalogShapeSchema.optional(),
  /** Busca textual em type/name/description. */
  search: z.string().min(1).max(80).optional(),
  /**
   * `false` remove `propsSchema`/`dataContract` da resposta. O catálogo
   * completo passa de 100 KB; quem só quer montar uma lista de tipos não
   * precisa carregar todos os JSON Schemas.
   *
   * O parse é explícito, e não `z.coerce.boolean()`: em querystring tudo chega
   * como string, e `Boolean("false")` é `true` — o coerce silenciosamente
   * ignoraria o pedido de quem passou `includeSchemas=false`.
   */
  includeSchemas: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export const listCatalogResponseSchema = z.object({
  catalogVersion: z.number().int(),
  total: z.number().int(),
  blocks: z.array(manifestSchema),
});

export const getCatalogParamsSchema = z.object({
  type: z.string().min(1),
});

export const getCatalogResponseSchema = z.object({
  catalogVersion: z.number().int(),
  block: manifestSchema,
});

/** Um problema encontrado na validação, em formato acionável. */
export const validationIssueSchema = z.object({
  /** Onde: `props` ou `data`. */
  scope: z.enum(['catalogType', 'props', 'data']),
  /** Caminho dentro do objeto (`/orientation`), ou `(root)`. */
  path: z.string(),
  /** O que está errado, na mensagem do validador. */
  message: z.string(),
  /** O que fazer para corrigir — escrito para quem vai reescrever o spec. */
  hint: z.string(),
});

export const validateCatalogBodySchema = z.object({
  catalogType: z.string().min(1),
  /** Props visuais candidatas — validadas contra o `propsSchema` do tipo. */
  props: z.record(z.unknown()).optional(),
  /** Dado candidato — validado contra o `shape` do `dataContract` do tipo. */
  data: z.unknown().optional(),
});

export const validateCatalogResponseSchema = z.object({
  valid: z.boolean(),
  catalogType: z.string(),
  catalogVersion: z.number().int(),
  /** Shape esperado pelo tipo (`null` em blocos narrativos). */
  shape: catalogShapeSchema.nullable(),
  issues: z.array(validationIssueSchema),
});

export type ListCatalogQuery = z.infer<typeof listCatalogQuerySchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
