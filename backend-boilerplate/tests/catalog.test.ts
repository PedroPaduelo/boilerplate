/**
 * Valida o pipeline `build:catalog` (F0.4):
 *  - roda o script de coleta;
 *  - garante que o JSON gerado existe e que CADA manifesto é válido contra o
 *    BlockManifestSchema de `@dashboards/contracts` (fonte da verdade);
 *  - garante que o bloco de exemplo (__example) foi coletado.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateBlockManifest,
  formatErrors,
  type BlockManifest,
} from '@dashboards/contracts';

const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'src/catalog/catalog.manifests.json');

interface CatalogFile {
  catalogVersion: number;
  count: number;
  blocks: BlockManifest[];
}

describe('build:catalog', () => {
  let catalog: CatalogFile;

  beforeAll(() => {
    execSync('npm run build:catalog', { cwd: ROOT, stdio: 'pipe' });
    catalog = JSON.parse(readFileSync(OUT, 'utf8')) as CatalogFile;
  }, 60000);

  it('gera um JSON com count coerente', () => {
    expect(catalog.catalogVersion).toBe(1);
    expect(Array.isArray(catalog.blocks)).toBe(true);
    expect(catalog.count).toBe(catalog.blocks.length);
    expect(catalog.count).toBeGreaterThanOrEqual(1);
  });

  it('todo manifesto gerado é válido contra o BlockManifestSchema', () => {
    for (const block of catalog.blocks) {
      const ok = validateBlockManifest(block);
      if (!ok) {
        throw new Error(
          `Manifesto inválido (${block.type}): ${formatErrors(validateBlockManifest.errors)}`,
        );
      }
      expect(ok).toBe(true);
    }
  });

  it('coleta o bloco de exemplo (__example)', () => {
    expect(catalog.blocks.some((b) => b.type === '__example')).toBe(true);
  });

  it('coleta os 7 blocos da base (T-I) e expõe seus shapes', () => {
    const expected = ['kpi', 'bar_chart', 'line_chart', 'donut', 'table', 'title', 'rich_text'];
    const types = catalog.blocks.map((b) => b.type);
    for (const t of expected) {
      expect(types).toContain(t);
    }
    const shapeOf = (type: string) =>
      catalog.blocks.find((b) => b.type === type)?.dataContract?.shape;
    expect(shapeOf('kpi')).toBe('scalar');
    expect(shapeOf('bar_chart')).toBe('series');
    expect(shapeOf('line_chart')).toBe('series');
    expect(shapeOf('donut')).toBe('categorical');
    expect(shapeOf('table')).toBe('table');
    // blocos narrativos não declaram dataContract
    expect(catalog.blocks.find((b) => b.type === 'title')?.dataContract).toBeUndefined();
    expect(catalog.blocks.find((b) => b.type === 'rich_text')?.dataContract).toBeUndefined();
  });
});
