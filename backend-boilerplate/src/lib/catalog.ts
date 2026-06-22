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

/** Manifesto de um bloco do catálogo (subset relevante ao backend). */
export interface CatalogBlockManifest {
  type: string;
  kind?: string;
  name?: string;
  description?: string;
  source?: string;
  propsSchema?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  version?: string;
}

const blocks: CatalogBlockManifest[] = Array.isArray(
  (catalogFile as { blocks?: unknown }).blocks,
)
  ? ((catalogFile as { blocks: CatalogBlockManifest[] }).blocks)
  : [];

const byType = new Map<string, CatalogBlockManifest>(blocks.map((b) => [b.type, b]));

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

// --- Validação de props contra o propsSchema do manifesto (defensiva) ---

const ajv = new Ajv({ strict: false, allErrors: true });
const validatorCache = new Map<string, ValidateFunction | null>();

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
