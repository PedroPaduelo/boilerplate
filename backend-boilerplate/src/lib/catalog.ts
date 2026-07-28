/**
 * Leitor do CATÁLOGO VIVO (compartilhado) — fonte da verdade dos tipos de bloco.
 *
 * O catálogo é gerado por `npm run build:catalog` (F0.4), que varre as pastas de
 * bloco do frontend e emite `src/catalog/catalog.manifests.json` (validado contra
 * o `BlockManifestSchema` de `@dashboards/contracts`). Este módulo apenas LÊ esse
 * artefato — é consumido pelos módulos de domínio (charts, dashboards, ...) para
 * validar que um `catalogType` existe e (opcionalmente) que `props` conformam ao
 * `propsSchema` do manifesto.
 *
 * O JSON é importado (inlined no bundle pelo tsup/esbuild) em vez de lido por
 * `fs` em runtime, para funcionar igual em dev (tsx), build (dist) e testes
 * (ts-jest). O catálogo só muda em build-time (build:catalog), então o snapshot
 * embutido é coerente com o artefato gerado.
 */
import Ajv, { type ValidateFunction } from 'ajv';
import catalogFile from '@/catalog/catalog.manifests.json';

/** Shape de dados declarado por um bloco (espelha `dataContract.shape` do contrato). */
export type CatalogDataShape = 'scalar' | 'series' | 'categorical' | 'table';

/** Contrato de dados de um bloco (subset relevante ao backend). */
export interface CatalogDataContract {
  shape?: CatalogDataShape;
  spec?: Record<string, unknown>;
  example?: unknown;
}

/** Manifesto de um bloco do catálogo (subset relevante ao backend). */
export interface CatalogBlockManifest {
  type: string;
  kind?: string;
  name?: string;
  description?: string;
  source?: string;
  propsSchema?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  /** Contrato de dados (presente em blocos do tipo chart; ausente em narrativos). */
  dataContract?: CatalogDataContract;
  version?: string;
}

const blocks: CatalogBlockManifest[] = Array.isArray(
  (catalogFile as { blocks?: unknown }).blocks,
)
  ? ((catalogFile as { blocks: CatalogBlockManifest[] }).blocks)
  : [];

const byType = new Map<string, CatalogBlockManifest>(blocks.map((b) => [b.type, b]));

/**
 * Versão do catálogo gerado (`catalogVersion` do artefato de `build:catalog`).
 *
 * É o número que permite a um consumidor — o front, o agente ou um snapshot
 * salvo — saber se o catálogo que ele conhece ainda é o vigente. Um layout
 * criado sob a versão N referencia tipos que existiam em N; quando a versão
 * muda, é aí que se decide migrar. Sem expor esse número, o desencontro só
 * aparece na forma de "bloco não implementado" em tela.
 */
export const CATALOG_VERSION: number =
  typeof (catalogFile as { catalogVersion?: unknown }).catalogVersion === 'number'
    ? (catalogFile as { catalogVersion: number }).catalogVersion
    : 1;

/** Lista (cópia) de todos os manifestos do catálogo. */
export function listCatalogManifests(): CatalogBlockManifest[] {
  return [...blocks];
}

/** Tipos de bloco disponíveis no catálogo. */
export function listCatalogTypes(): string[] {
  return blocks.map((b) => b.type);
}

/** O `type` existe no catálogo gerado? */
export function hasCatalogType(type: string): boolean {
  return byType.has(type);
}

/** Manifesto de um tipo (ou `undefined` se não existir). */
export function getCatalogManifest(type: string): CatalogBlockManifest | undefined {
  return byType.get(type);
}

/**
 * Shape de dados (`dataContract.shape`) declarado por um tipo de bloco no
 * catálogo, ou `null` quando o tipo não existe ou é narrativo (sem dataContract).
 * É o que o módulo `data` (T-C) usa para escolher o validador do RESULTADO
 * (`validateBlockDataByShape`) antes de gravar cache/emitir socket.
 */
export function getCatalogDataShape(type: string): CatalogDataShape | null {
  return byType.get(type)?.dataContract?.shape ?? null;
}

// --- Validação de props contra o propsSchema do manifesto (defensiva) ---

const ajv = new Ajv({ strict: false, allErrors: true });
const validatorCache = new Map<string, ValidateFunction | null>();

/**
 * Ajv gêmeo, com COERÇÃO de tipo — usado só na fronteira do agente.
 *
 * Modelos de linguagem escrevem JSON com o tipo errado por hábito: numa
 * conversa real, `create_chart` foi recusado com `/smooth must be boolean` e
 * `/area must be boolean` porque as props vieram como `{"area": "true",
 * "smooth": "true"}` — as aspas custaram um passo do turno e uma linha vermelha
 * na trilha, para um dado que estava certo em intenção e errado em notação.
 *
 * A coerção fica SEPARADA do validador estrito de propósito: o formulário da UI
 * manda tipo certo e deve continuar sendo cobrado disso. Quem ganha a folga é
 * quem escreve JSON de cabeça.
 */
const ajvCoercivo = new Ajv({ strict: false, allErrors: true, coerceTypes: true });
const coercerCache = new Map<string, ValidateFunction | null>();

/**
 * Compila (com cache) o validador do `propsSchema` de um tipo. Retorna `null`
 * quando o tipo não existe, não tem `propsSchema`, ou o schema é inválido (nesse
 * caso a validação é considerada "passada" — não bloqueamos por schema quebrado).
 */
function getPropsValidator(type: string): ValidateFunction | null {
  if (validatorCache.has(type)) return validatorCache.get(type) ?? null;

  const manifest = byType.get(type);
  const schema = manifest?.propsSchema;
  let validator: ValidateFunction | null = null;
  if (schema && typeof schema === 'object') {
    try {
      validator = ajv.compile(schema);
    } catch {
      validator = null; // schema quebrado → não bloqueia
    }
  }
  validatorCache.set(type, validator);
  return validator;
}

/**
 * Ajusta o TIPO das props ao que o `propsSchema` pede, sem julgar o conteúdo.
 *
 * `"true"` vira `true`, `"12"` vira `12` — o que o schema não souber converter
 * passa intacto e será recusado adiante pela validação estrita, com a mensagem
 * de sempre. Ou seja: isto perdoa notação, não perdoa erro de verdade.
 *
 * Devolve uma CÓPIA: o Ajv coerciovo muta o objeto que recebe, e mutar o
 * argumento de quem chama é o tipo de efeito colateral que ninguém procura
 * quando o bug aparece.
 */
export function coerceProps(type: string, props: unknown): unknown {
  if (props === null || typeof props !== 'object' || Array.isArray(props)) return props;

  if (!coercerCache.has(type)) {
    const schema = byType.get(type)?.propsSchema;
    let coercer: ValidateFunction | null = null;
    if (schema && typeof schema === 'object') {
      try {
        coercer = ajvCoercivo.compile(schema);
      } catch {
        coercer = null;
      }
    }
    coercerCache.set(type, coercer);
  }

  const coercer = coercerCache.get(type);
  if (!coercer) return props;

  const copia: unknown = structuredClone(props);
  coercer(copia); // muta `copia` aplicando as coerções possíveis
  return copia;
}

/**
 * Valida `props` contra o `propsSchema` do `type` no catálogo. Se o tipo não tem
 * schema (ou o schema não compila), retorna `{ ok: true }` — a checagem de
 * existência do tipo é responsabilidade de `hasCatalogType`.
 */
export function validatePropsAgainstCatalog(
  type: string,
  props: unknown,
): { ok: boolean; errors?: string } {
  const validator = getPropsValidator(type);
  if (!validator) return { ok: true };

  const ok = validator(props);
  if (ok) return { ok: true };

  const errors = (validator.errors ?? [])
    .map((e) => `${e.instancePath || '(root)'} ${e.message}`)
    .join('; ');
  return { ok: false, errors };
}
