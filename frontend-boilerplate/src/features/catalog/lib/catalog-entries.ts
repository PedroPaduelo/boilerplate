/**
 * Catálogo (galeria) — deriva as ENTRADAS de preview a partir do registry VIVO
 * do render-engine (`listBlocks()`). Cada entrada já vem com o `block` + o
 * `result` (dados MOCKADOS da fixture do bloco) prontos para o `BlockRenderer`,
 * além dos metadados de exibição (kind, category, shape, nº de props configuráveis).
 *
 * É 100% client-side e read-only: a página de catálogo serve para VISUALIZAR o
 * potencial de cada componente disponível (os mesmos que o MCP oferece à IA),
 * sem tocar em backend/banco.
 */
import type { Block, BlockDataResult, DataShape } from '@dashboards/contracts';
import { listBlocks, type BlockDefinition } from '@/shared/render-engine';
import { categoryOf, CATEGORY_ORDER, type Category } from './categories';

/** Tipos internos/placeholder que NÃO aparecem na galeria. */
const HIDDEN_TYPES = new Set<string>(['__example']);

/** `kind` do manifesto (chart | text | title | layout). */
export type CatalogKind = 'chart' | 'text' | 'title' | 'layout';

/**
 * Props de preview para blocos NARRATIVOS (sem `dataContract`), cujo conteúdo
 * vem das PROPS e não de `data`. Para os blocos de dados, `defaultProps` +
 * fixture já bastam.
 */
const PREVIEW_PROPS: Record<string, Record<string, unknown>> = {
  title: { text: 'Arrecadação por município', level: 2, align: 'left' },
  rich_text: {
    markdown: [
      '## Resumo executivo',
      '',
      'A arrecadação acumulada cresceu **12%** frente ao período anterior, puxada',
      'pela regularização de débitos no `Centro` e pelo avanço dos parcelamentos.',
      '',
      '- **Centro** lidera a arrecadação',
      '- **Sul** em recuperação consistente',
      '- Inadimplência em queda',
    ].join('\n'),
  },
};

export const KIND_LABEL: Record<CatalogKind, string> = {
  chart: 'Gráfico',
  text: 'Texto',
  title: 'Título',
  layout: 'Layout',
};

export const SHAPE_LABEL: Record<DataShape, string> = {
  scalar: 'Escalar',
  series: 'Série',
  categorical: 'Categórico',
  table: 'Tabela',
};

export interface CatalogEntry {
  /** catalogType (ex.: `bar_chart`). */
  type: string;
  definition: BlockDefinition;
  kind: CatalogKind;
  /** Categoria semântica de UI (abas da galeria). */
  category: Category;
  /** Shape do dado (apenas blocos com `dataContract`). */
  shape?: DataShape;
  /** Bloco pronto p/ o `BlockRenderer` (props mescladas com preview). */
  block: Block;
  /** Resultado MOCKADO (fixture) — `undefined` em blocos narrativos. */
  result?: BlockDataResult;
  /** Nº de props visuais configuráveis (derivado do `propsSchema`). */
  propsCount: number;
  /** `true` se o bloco consome dados (`dataContract` presente). */
  hasData: boolean;
}

interface PropsSchemaLike {
  properties?: Record<string, unknown>;
}

function toEntry(definition: BlockDefinition): CatalogEntry {
  const { manifest } = definition;
  const shape = manifest.dataContract?.shape as DataShape | undefined;

  const props = {
    ...((manifest.defaultProps as Record<string, unknown>) ?? {}),
    ...(PREVIEW_PROPS[manifest.type] ?? {}),
  };

  const block: Block = {
    id: manifest.type,
    type: manifest.type,
    span: 12,
    props,
  };

  const hasData = Boolean(manifest.dataContract);
  const result: BlockDataResult | undefined = hasData
    ? {
        blockId: manifest.type,
        state: 'success',
        shape,
        data: (definition.fixture ?? undefined) as BlockDataResult['data'],
      }
    : undefined;

  const propsSchema = manifest.propsSchema as PropsSchemaLike | undefined;
  const propsCount = Object.keys(propsSchema?.properties ?? {}).length;

  return {
    type: manifest.type,
    definition,
    kind: manifest.kind as CatalogKind,
    category: categoryOf(manifest.type),
    shape,
    block,
    result,
    propsCount,
    hasData,
  };
}

/** Lista as entradas do catálogo, ordenadas (categoria → nome). */
export function getCatalogEntries(): CatalogEntry[] {
  return listBlocks()
    .filter((def) => !HIDDEN_TYPES.has(def.type))
    .map(toEntry)
    .sort((a, b) => {
      const byCat = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
      if (byCat !== 0) return byCat;
      return a.definition.manifest.name.localeCompare(b.definition.manifest.name, 'pt-BR');
    });
}
