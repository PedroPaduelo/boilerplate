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
import { getCatalogManifest, listCatalogManifests } from '@/lib/catalog';
import type { ToolDefinition } from './types';

const listCatalogArgs = z.object({
  type: z.string().optional(),
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
    'Passe `type` para obter um único manifesto. Retorna { blocks: BlockManifest[], total }.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: {
        type: 'string',
        description: 'Se informado, retorna só o manifesto desse tipo de bloco.',
      },
    },
  },
  handler: async (rawArgs) => {
    const { type } = listCatalogArgs.parse(rawArgs ?? {});
    if (type) {
      const manifest = getCatalogManifest(type);
      return { blocks: manifest ? [manifest] : [], total: manifest ? 1 : 0 };
    }
    const blocks = listCatalogManifests();
    return { blocks, total: blocks.length };
  },
};

export const catalogTools: ToolDefinition[] = [listCatalogTool];
