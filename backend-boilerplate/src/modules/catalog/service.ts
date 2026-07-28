/**
 * Regras do módulo `catalog` — leitura filtrada dos manifestos e a VALIDAÇÃO
 * de um bloco candidato.
 *
 * A validação existe para um motivo específico: quem escreve os blocos aqui é,
 * na maior parte das vezes, um modelo de linguagem. Um modelo corrige sozinho
 * o que ele consegue LER — então um "invalid props" seco é inútil, enquanto
 * "/orientation must be equal to one of the allowed values (vertical,
 * horizontal)" fecha o ciclo sem intervenção humana. É a mesma ideia que a
 * documentação de structured outputs da OpenAI defende ao exigir enums fechados
 * e `additionalProperties: false`: o erro precisa apontar o caminho e a regra.
 *
 * Por isso o retorno é uma LISTA de problemas com `path` + `message` + `hint`,
 * e não um booleano.
 */
import {
  formatErrors,
  validateBlockDataByShape,
  type DataShape,
} from '@dashboards/contracts';
import {
  CATALOG_VERSION,
  getCatalogManifest,
  listCatalogManifests,
  listCatalogTypes,
  validatePropsAgainstCatalog,
  type CatalogBlockManifest,
} from '@/lib/catalog';
import type { ListCatalogQuery, ValidationIssue } from './schema';

/**
 * Manifesto na forma que sai pelo fio.
 *
 * O cast existe porque `CatalogBlockManifest` é uma interface FECHADA (bom para
 * quem consome os campos conhecidos) enquanto a resposta é `passthrough` (bom
 * para não perder campos novos do manifesto quando o contrato crescer). Os dois
 * lados estão certos; a conversão é o ponto único onde isso é reconciliado.
 */
export type WireManifest = { type: string } & Record<string, unknown>;

function toWire(block: CatalogBlockManifest): WireManifest {
  return { ...block } as WireManifest;
}

/**
 * Tipos INTERNOS que não fazem parte da superfície pública do catálogo.
 *
 * `__example` é o bloco-modelo que serve de referência para quem cria um bloco
 * novo. A galeria do front já o esconde; até aqui a API e o MCP não escondiam,
 * então o agente via um "tipo" que não representa nada de negócio e podia
 * escolhê-lo. Esconder nos dois lugares mantém uma só lista pública.
 */
const INTERNAL_TYPES = new Set<string>(['__example']);

/** Campos pesados (JSON Schemas) removidos quando `includeSchemas=false`. */
function stripSchemas(block: CatalogBlockManifest): CatalogBlockManifest {
  const { propsSchema: _p, dataContract, ...rest } = block;
  return {
    ...rest,
    // O `shape` continua: é o que responde "serve para o meu dado?" e custa
    // uma palavra. O que sai é o `spec`/`example`, que é o volume.
    ...(dataContract?.shape ? { dataContract: { shape: dataContract.shape } } : {}),
  };
}

function matchesSearch(block: CatalogBlockManifest, search: string): boolean {
  const q = search.toLowerCase();
  return (
    block.type.toLowerCase().includes(q) ||
    (block.name ?? '').toLowerCase().includes(q) ||
    (block.description ?? '').toLowerCase().includes(q)
  );
}

/** Manifestos do catálogo aplicando os filtros da query. */
export function listCatalog(query: ListCatalogQuery): {
  catalogVersion: number;
  total: number;
  blocks: WireManifest[];
} {
  const { kind, shape, search, includeSchemas } = query;

  let blocks = listCatalogManifests().filter((b) => !INTERNAL_TYPES.has(b.type));
  if (kind) blocks = blocks.filter((b) => b.kind === kind);
  if (shape) blocks = blocks.filter((b) => b.dataContract?.shape === shape);
  if (search) blocks = blocks.filter((b) => matchesSearch(b, search));

  blocks = blocks.sort((a, b) => a.type.localeCompare(b.type));

  return {
    catalogVersion: CATALOG_VERSION,
    total: blocks.length,
    blocks: blocks.map((b) => toWire(includeSchemas ? b : stripSchemas(b))),
  };
}

/** Manifesto completo de um tipo público, pronto para a resposta. */
export function getCatalogBlock(type: string): WireManifest | undefined {
  if (INTERNAL_TYPES.has(type)) return undefined;
  const block = getCatalogManifest(type);
  return block ? toWire(block) : undefined;
}

/** Converte a string de erros do ajv em problemas individuais. */
function toIssues(
  scope: ValidationIssue['scope'],
  errors: string,
  hint: string,
): ValidationIssue[] {
  return errors
    .split('; ')
    .filter((part) => part.trim().length > 0)
    .map((part) => {
      const [path, ...rest] = part.split(' ');
      return {
        scope,
        path: path === '(root)' ? '(root)' : path,
        message: rest.join(' ') || part,
        hint,
      };
    });
}

/**
 * Exemplo do `dataContract` reduzido ao que cabe numa mensagem: as duas
 * primeiras linhas bastam para mostrar a FORMA; o resto só gasta espaço (e,
 * quando quem lê é um modelo, contexto).
 */
function compactExample(example: unknown): string {
  const sample = Array.isArray(example) ? example.slice(0, 2) : example;
  const json = JSON.stringify(sample);
  const suffix = Array.isArray(example) && example.length > 2 ? ', …]' : '';
  return suffix ? `${json.slice(0, -1)}${suffix}` : json;
}

export interface ValidateCatalogInput {
  catalogType: string;
  props?: Record<string, unknown>;
  data?: unknown;
}

export interface ValidateCatalogResult {
  valid: boolean;
  catalogType: string;
  catalogVersion: number;
  shape: DataShape | null;
  issues: ValidationIssue[];
}

/**
 * Valida um bloco candidato ANTES de ele ser salvo ou renderizado: o tipo
 * existe? as props conformam ao `propsSchema`? o dado conforma ao `shape`?
 */
export function validateCatalogBlock(
  input: ValidateCatalogInput,
): ValidateCatalogResult {
  const { catalogType, props, data } = input;
  const manifest = INTERNAL_TYPES.has(catalogType)
    ? undefined
    : getCatalogManifest(catalogType);

  if (!manifest) {
    // Sugerir vizinhos é o que transforma um 'não existe' em uma correção: na
    // maioria das vezes o erro é de grafia ou de sinônimo (`barchart`,
    // `bar-chart`, `bars`), não de intenção.
    const near = listCatalogTypes()
      .filter((t) => !INTERNAL_TYPES.has(t))
      .filter((t) => {
        const a = catalogType.toLowerCase().replace(/[-_\s]/g, '');
        const b = t.toLowerCase().replace(/[-_\s]/g, '');
        return a.includes(b) || b.includes(a);
      })
      .slice(0, 5);
    return {
      valid: false,
      catalogType,
      catalogVersion: CATALOG_VERSION,
      shape: null,
      issues: [
        {
          scope: 'catalogType',
          path: '(root)',
          message: `catalogType "${catalogType}" não existe no catálogo.`,
          hint:
            near.length > 0
              ? `Tipos parecidos: ${near.join(', ')}. Use GET /catalog para a lista completa.`
              : 'Use GET /catalog (ou a tool list_catalog) e informe exatamente o campo "type" de um item.',
        },
      ],
    };
  }

  const shape = (manifest.dataContract?.shape ?? null) as DataShape | null;
  const issues: ValidationIssue[] = [];

  if (props !== undefined) {
    const { ok, errors } = validatePropsAgainstCatalog(catalogType, props);
    if (!ok && errors) {
      issues.push(
        ...toIssues(
          'props',
          errors,
          `Ajuste a prop citada conforme o propsSchema de "${catalogType}" (GET /catalog/${catalogType}); enums são fechados.`,
        ),
      );
    }
  }

  if (data !== undefined) {
    if (!shape) {
      issues.push({
        scope: 'data',
        path: '(root)',
        message: `O bloco "${catalogType}" é narrativo e não consome dados.`,
        hint: 'Remova `data` — o conteúdo deste bloco vem só das props.',
      });
    } else {
      const { valid, errors } = validateBlockDataByShape(shape, data);
      if (!valid) {
        // A dica carrega o EXEMPLO do próprio manifesto. Sem ele, o erro do ajv
        // no shape errado é só "must be array" — verdadeiro e inútil para quem
        // precisa reescrever a query. Com o exemplo, quem lê vê a forma certa e
        // corrige na primeira tentativa.
        const example = manifest.dataContract?.example;
        const shownExample =
          example === undefined ? '' : ` Formato esperado: ${compactExample(example)}`;
        issues.push(
          ...toIssues(
            'data',
            formatErrors(errors),
            `O resultado precisa estar no shape "${shape}". Ajuste as colunas do SELECT ou o transform do dataBinding.${shownExample}`,
          ),
        );
      }
    }
  }

  return {
    valid: issues.length === 0,
    catalogType,
    catalogVersion: CATALOG_VERSION,
    shape,
    issues,
  };
}
