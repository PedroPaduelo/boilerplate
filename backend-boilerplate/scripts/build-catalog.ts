/**
 * build:catalog — coletor de manifestos do catálogo VIVO (doc 03 / doc 33).
 *
 * Varre as pastas de bloco do catálogo do frontend (convenção plug-and-play:
 *   <catalogDir>/<type>/manifest.ts  →  exporta `manifest` (BlockManifest neutro))
 * valida cada manifesto contra o JSON Schema de `@dashboards/contracts`
 * (BlockManifestSchema — fonte da verdade) e gera `catalog.manifests.json`, que o
 * backend serve em `GET /catalog` e o MCP expõe em `list_catalog`.
 *
 * É a contrapartida do auto-registro do FE (import.meta.glob): adicionar uma
 * pasta de bloco → o catálogo do BE/IA passa a enxergá-lo no próximo build, SEM
 * editar índice central (regra anti-colisão do doc 21).
 *
 * Uso:
 *   tsx scripts/build-catalog.ts            # gera uma vez
 *   tsx scripts/build-catalog.ts --watch    # regenera ao salvar (dev)
 *
 * Configurável por env:
 *   CATALOG_DIR  — pasta raiz das pastas de bloco do FE
 *                  (default: ../frontend-boilerplate/src/shared/render-engine/catalog)
 *   CATALOG_OUT  — caminho do JSON de saída
 *                  (default: src/catalog/catalog.manifests.json)
 */
import { existsSync, mkdirSync, readdirSync, watch, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  validateBlockManifest,
  formatErrors,
  type BlockManifest,
} from '@dashboards/contracts';

const PROJECT_ROOT = resolve(__dirname, '..');

const CATALOG_DIR = resolve(
  PROJECT_ROOT,
  process.env.CATALOG_DIR ?? '../frontend-boilerplate/src/shared/render-engine/catalog',
);

const CATALOG_OUT = resolve(
  PROJECT_ROOT,
  process.env.CATALOG_OUT ?? 'src/catalog/catalog.manifests.json',
);

/** Formato do arquivo gerado (sem timestamp p/ diffs determinísticos). */
interface CatalogFile {
  _generated: string;
  catalogVersion: number;
  count: number;
  blocks: BlockManifest[];
}

const GENERATED_NOTE =
  'GERADO por `npm run build:catalog` — NÃO edite à mão. Fonte: pastas de bloco em CATALOG_DIR.';

function listBlockManifestPaths(catalogDir: string): string[] {
  if (!existsSync(catalogDir)) return [];
  const entries = readdirSync(catalogDir, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    for (const file of ['manifest.ts', 'manifest.tsx']) {
      const p = join(catalogDir, entry.name, file);
      if (existsSync(p)) {
        paths.push(p);
        break;
      }
    }
  }
  return paths.sort();
}

async function loadManifest(path: string): Promise<unknown> {
  // cache-bust em watch mode para reimportar a versão nova.
  const url = `${pathToFileURL(path).href}?t=${Date.now()}`;
  const mod = (await import(url)) as { manifest?: unknown; default?: unknown };
  return mod.manifest ?? mod.default;
}

async function buildOnce(): Promise<{ ok: boolean; count: number }> {
  const paths = listBlockManifestPaths(CATALOG_DIR);
  const blocks: BlockManifest[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    let manifest: unknown;
    try {
      manifest = await loadManifest(path);
    } catch (err) {
      errors.push(`${path}: falha ao importar (${(err as Error).message})`);
      continue;
    }
    if (!manifest) {
      errors.push(`${path}: sem export \`manifest\` (nem default).`);
      continue;
    }
    if (!validateBlockManifest(manifest)) {
      errors.push(
        `${path}: manifesto inválido — ${formatErrors(validateBlockManifest.errors)}`,
      );
      continue;
    }
    const m = manifest as BlockManifest;
    if (seen.has(m.type)) {
      errors.push(`${path}: tipo de bloco duplicado "${m.type}".`);
      continue;
    }
    seen.add(m.type);
    blocks.push(m);
  }

  blocks.sort((a, b) => a.type.localeCompare(b.type));

  const out: CatalogFile = {
    _generated: GENERATED_NOTE,
    catalogVersion: 1,
    count: blocks.length,
    blocks,
  };

  mkdirSync(dirname(CATALOG_OUT), { recursive: true });
  writeFileSync(CATALOG_OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  if (errors.length > 0) {
    console.error(`\n[build:catalog] ${errors.length} problema(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
  }
  console.log(
    `[build:catalog] ${blocks.length} bloco(s) → ${CATALOG_OUT}` +
      (blocks.length ? ` (${blocks.map((b) => b.type).join(', ')})` : ''),
  );

  return { ok: errors.length === 0, count: blocks.length };
}

async function main() {
  const watchMode = process.argv.includes('--watch');
  console.log(`[build:catalog] catálogo: ${CATALOG_DIR}`);

  const first = await buildOnce();

  if (!watchMode) {
    process.exit(first.ok ? 0 : 1);
  }

  if (!existsSync(CATALOG_DIR)) {
    console.warn(
      `[build:catalog] CATALOG_DIR não existe ainda; aguardando em watch: ${CATALOG_DIR}`,
    );
  } else {
    let timer: NodeJS.Timeout | null = null;
    watch(CATALOG_DIR, { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void buildOnce();
      }, 150);
    });
    console.log('[build:catalog] watch ativo (Ctrl+C para sair).');
  }
}

void main();
