/**
 * Tool de CATÁLOGO do MCP (T-D) — reusa o leitor do catálogo VIVO (`@/lib/catalog`).
 *
 *   - list_catalog → manifestos de todos os tipos de bloco disponíveis, COM o
 *     `dataContract` (shape + spec + example) gerado na F0.4 (`build:catalog`).
 *
 * É a documentação que a IA lê para montar `create_chart`/`update_chart` válidos:
 * cada manifesto traz `type` (vai em `catalogType`), `propsSchema` (valida `props`)
 * e `dataContract.shape` (o shape que o RESULTADO da query precisa respeitar:
 * scalar | series | categorical | table).
 */
import { z } from 'zod';
import { getCatalogBlock, listCatalog } from '@/modules/catalog/service';
import type { ToolDefinition } from './types';

const listCatalogArgs = z.object({
  type: z.string().optional(),
  kind: z.enum(['chart', 'text', 'title', 'layout']).optional(),
  shape: z.enum(['scalar', 'series', 'categorical', 'table']).optional(),
});

const listCatalogTool: ToolDefinition = {
  name: 'list_catalog',
  description:
    'Lista o catálogo de tipos de bloco disponíveis para montar gráficos e dashboards. ' +
    'Cada item traz: `type` (use em `catalogType` no create_chart), `name`/`description`, ' +
    '`propsSchema` (JSON Schema das props visuais — `create_chart.draftProps` é validado ' +
    'contra ele), `defaultProps` e, para blocos de gráfico, o `dataContract` com `shape` ' +
    '(scalar | series | categorical | table) que o RESULTADO da sua query precisa respeitar ' +
    'após o `transform`. Consulte SEMPRE este catálogo antes de criar/atualizar um chart. ' +
    'FILTROS: `type` (um manifesto só), `shape` (só os blocos que aceitam o formato de dado ' +
    'que você tem — o filtro mais útil para escolher um bloco) e `kind`. ' +
    'Retorna { blocks: BlockManifest[], total, catalogVersion }.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: {
        type: 'string',
        description: 'Se informado, retorna só o manifesto desse tipo de bloco.',
      },
      kind: {
        type: 'string',
        enum: ['chart', 'text', 'title', 'layout'],
        description: 'Filtra pela natureza do bloco.',
      },
      shape: {
        type: 'string',
        enum: ['scalar', 'series', 'categorical', 'table'],
        description:
          'Filtra pelos blocos que consomem esse formato de dado. Use quando já souber o ' +
          'formato do resultado da query e quiser só os blocos compatíveis.',
      },
    },
  },
  // Reusa o service do módulo `catalog` (mesma regra da REST): uma só lista
  // pública, sem os tipos internos, e o `catalogVersion` junto — o número que
  // diz sob qual catálogo o layout foi escrito.
  handler: async (rawArgs) => {
    const { type, kind, shape } = listCatalogArgs.parse(rawArgs ?? {});
    if (type) {
      const manifest = getCatalogBlock(type);
      return { blocks: manifest ? [manifest] : [], total: manifest ? 1 : 0 };
    }
    return listCatalog({ kind, shape, includeSchemas: true });
  },
};

export const catalogTools: ToolDefinition[] = [listCatalogTool];
