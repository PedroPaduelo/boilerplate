/**
 * Para cada componente legado de `components/ui`, lista QUEM o consome.
 * Serve para decidir o destino na migração:
 *   - consumido por 1 feature  → move para a feature (FSD: slice dono)
 *   - consumido por 2+ areas   → vira primitivo em `shared/ui`
 *   - consumido por ninguém    → deleta
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');
const UI = path.join(SRC, 'components/ui');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(p)) acc.push(p);
  }
  return acc;
}

const all = walk(SRC);
const uiFiles = fs
  .readdirSync(UI)
  .filter((f) => /\.tsx?$/.test(f) && f !== 'index.ts')
  .map((f) => f.replace(/\.tsx?$/, ''));

// Símbolos exportados por cada arquivo de components/ui.
const exportRe =
  /export\s+(?:const|function|class|type|interface)\s+([A-Za-z0-9_]+)|export\s*\{([^}]+)\}/g;
const symbolOwner = new Map();
for (const name of uiFiles) {
  const file = ['.tsx', '.ts'].map((e) => path.join(UI, name + e)).find(fs.existsSync);
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = exportRe.exec(src))) {
    if (m[1]) symbolOwner.set(m[1], name);
    else if (m[2]) {
      for (const raw of m[2].split(',')) {
        const sym = raw
          .trim()
          .split(/\s+as\s+/)
          .pop()
          .trim();
        if (sym && /^[A-Za-z]/.test(sym)) symbolOwner.set(sym, name);
      }
    }
  }
}

/** Área de um arquivo: feature/<x>, shared/<y>, app, components. */
function area(file) {
  const rel = path.relative(SRC, file);
  const m = rel.match(/^features\/([^/]+)/);
  if (m) return `feature:${m[1]}`;
  if (rel.startsWith('shared/render-engine/catalog/')) return 'render-engine:catalog';
  if (rel.startsWith('shared/')) return 'shared';
  if (rel.startsWith('app/')) return 'app';
  return 'components';
}

const consumers = new Map(uiFiles.map((n) => [n, new Set()]));

for (const file of all) {
  if (file.startsWith(UI)) continue;
  if (/\.test\.|__tests__/.test(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const a = area(file);

  // import direto: from '@/components/ui/<nome>'
  for (const name of uiFiles) {
    if (new RegExp(`@/components/ui/${name}'`).test(src)) consumers.get(name).add(a);
  }
  // import via barrel: from '@/components/ui'  → resolve pelos símbolos
  const barrel = src.match(/import\s*\{([^}]+)\}\s*from\s*'@\/components\/ui'/g);
  if (barrel) {
    for (const block of barrel) {
      const inner = block.match(/\{([^}]+)\}/)[1];
      for (const raw of inner.split(',')) {
        const sym = raw
          .trim()
          .split(/\s+as\s+/)[0]
          .replace(/^type\s+/, '')
          .trim();
        const owner = symbolOwner.get(sym);
        if (owner) consumers.get(owner).add(a);
      }
    }
  }
}

const rows = [...consumers.entries()]
  .map(([name, set]) => ({ name, areas: [...set].sort() }))
  .sort((a, b) => b.areas.length - a.areas.length || a.name.localeCompare(b.name));

console.log('| componente legado | nº áreas | consumido por |');
console.log('|---|---|---|');
for (const r of rows) {
  console.log(
    `| \`${r.name}\` | ${r.areas.length} | ${r.areas.join(', ') || '— (órfão)'} |`,
  );
}
