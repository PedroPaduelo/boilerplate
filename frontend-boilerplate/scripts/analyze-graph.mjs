/**
 * Análise de grafo de dependências do frontend.
 * Percorre a partir dos entrypoints reais (main.tsx + rotas descobertas por glob)
 * e classifica cada arquivo em ALCANÇÁVEL (código vivo) vs ÓRFÃO (código morto).
 *
 * Uso: node scripts/analyze-graph.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');
const exts = ['.tsx', '.ts'];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (exts.includes(path.extname(p))) acc.push(p);
  }
  return acc;
}

const all = walk(SRC);
const isTest = (f) => /\.test\.|\.spec\.|__tests__|\/test\//.test(f);

function resolve(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // pacote externo

  const cands = [
    base + '.tsx',
    base + '.ts',
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ];
  return cands.find((c) => fs.existsSync(c)) ?? null;
}

const importRe = /(?:from\s+['"]([^'"]+)['"])|(?:import\s*\(\s*['"]([^'"]+)['"]\s*\))/g;

function importsOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = new Set();
  let m;
  while ((m = importRe.exec(src))) {
    const spec = m[1] ?? m[2];
    const r = resolve(spec, file);
    if (r) out.add(r);
  }
  return [...out];
}

// Entrypoints: main.tsx + os alvos dos `import.meta.glob` (Vite carrega eager,
// logo são raízes reais do grafo, não código morto):
//   - features/<x>/routes.tsx        (feature-routes.ts)
//   - render-engine/catalog/*/component.tsx (registry.ts, eager)
const entries = [
  path.join(SRC, 'app/main.tsx'),
  ...all.filter((f) => /features\/[^/]+\/routes\.tsx$/.test(f)),
  ...all.filter((f) => /shared\/render-engine\/catalog\/[^/]+\/component\.tsx$/.test(f)),
].filter((f) => fs.existsSync(f));

const reachable = new Set();
const stack = [...entries];
while (stack.length) {
  const f = stack.pop();
  if (reachable.has(f)) continue;
  reachable.add(f);
  for (const d of importsOf(f)) if (!reachable.has(d)) stack.push(d);
}

const prod = all.filter((f) => !isTest(f));
const orphans = prod.filter((f) => !reachable.has(f));

const rel = (f) => path.relative(SRC, f);
const loc = (f) => fs.readFileSync(f, 'utf8').split('\n').length;

const orphanUi = orphans.filter((f) => rel(f).startsWith('components/ui/'));
const orphanOther = orphans.filter((f) => !rel(f).startsWith('components/ui/'));
const liveUi = prod.filter(
  (f) => reachable.has(f) && rel(f).startsWith('components/ui/'),
);

const sum = (list) => list.reduce((a, f) => a + loc(f), 0);

console.log('=== RESUMO ===');
console.log('arquivos de produção :', prod.length, `(${sum(prod)} LOC)`);
console.log('alcançáveis (vivos)  :', prod.length - orphans.length);
console.log('ÓRFÃOS (código morto):', orphans.length, `(${sum(orphans)} LOC)`);
console.log('');
console.log(`=== components/ui VIVOS (${liveUi.length}, ${sum(liveUi)} LOC) ===`);
liveUi
  .map(rel)
  .sort()
  .forEach((f) => console.log('  ', f));
console.log('');
console.log(`=== components/ui ÓRFÃOS (${orphanUi.length}, ${sum(orphanUi)} LOC) ===`);
orphanUi
  .map(rel)
  .sort()
  .forEach((f) => console.log('  ', f));
console.log('');
console.log(`=== OUTROS ÓRFÃOS (${orphanOther.length}, ${sum(orphanOther)} LOC) ===`);
orphanOther
  .map(rel)
  .sort()
  .forEach((f) => console.log('  ', f));
