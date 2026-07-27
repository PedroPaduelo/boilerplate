/**
 * Auditoria de conformidade da migração → Astryx.
 *
 * Verifica mecanicamente os critérios de aceite que dá para verificar por
 * análise estática. Sai com código 1 se algum bloqueante falhar, para poder
 * rodar em CI.
 *
 * Uso: node scripts/audit-migration.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|css)$/.test(p)) acc.push(p);
  }
  return acc;
}

const files = walk(SRC);
const rel = (f) => path.relative(SRC, f);
const isTest = (f) => /\.test\.|\.spec\.|__tests__|\/test\//.test(f);
const isLegacyTheme = (f) => rel(f) === 'app/legacy-theme.css';
const isLegacyUi = (f) => rel(f).startsWith('components/ui/');

const findings = { blocking: [], warning: [] };
const add = (list, rule, file, detail) =>
  findings[list].push({ rule, file: rel(file), detail });

// ---------------------------------------------------------------- regra 1
// Nenhum import de componente legado.
for (const f of files) {
  if (isLegacyUi(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const m = src.match(/from\s+'@\/components\/[^']*'/g);
  if (m) add('blocking', 'import-legado', f, [...new Set(m)].join(', '));
}

// ---------------------------------------------------------------- regra 2
// O diretório legado não pode mais existir.
if (fs.existsSync(path.join(SRC, 'components'))) {
  findings.blocking.push({
    rule: 'diretorio-legado',
    file: 'components/',
    detail: 'ainda existe — deve ser removido no cutover',
  });
}

// ---------------------------------------------------------------- regra 3
// Zero cor hardcoded (hex / rgb / hsl / oklch literais) em TS/TSX.
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/;
for (const f of files) {
  if (!/\.tsx?$/.test(f) || isTest(f) || isLegacyUi(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comentário
    if (COLOR_RE.test(line))
      add('blocking', 'cor-hardcoded', f, `L${i + 1}: ${line.trim().slice(0, 90)}`);
  });
}

// ---------------------------------------------------------------- regra 4
// Sem `any` explícito.
for (const f of files) {
  if (!/\.tsx?$/.test(f) || isTest(f) || isLegacyUi(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (/\bas\s+any\b|:\s*any\b|<any>/.test(line))
      add('blocking', 'any-explicito', f, `L${i + 1}: ${line.trim().slice(0, 90)}`);
  });
}

// ---------------------------------------------------------------- regra 5
// Limites de tamanho.
const LIMITS = [
  [/(^|\/)(page|.*-page)\.tsx$/, 300, 'página'],
  [/\/use-[a-z0-9-]+\.ts$/, 150, 'hook'],
  [/\.tsx$/, 200, 'componente'],
];
for (const f of files) {
  if (isTest(f) || isLegacyUi(f) || !/\.tsx?$/.test(f)) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  for (const [re, limit, kind] of LIMITS) {
    if (re.test(rel(f))) {
      if (lines > limit)
        add('warning', 'arquivo-grande', f, `${lines} linhas (limite ${kind}: ${limit})`);
      break;
    }
  }
}

// ---------------------------------------------------------------- regra 6
// Sobras: TODO/FIXME e style inline.
for (const f of files) {
  if (!/\.tsx?$/.test(f) || isLegacyUi(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    // Marcador de pendência é `TODO:` / `FIXME(algo)` — não a palavra "TODO"
    // do português ("faz TODO link", "em TODO componente"), que é prosa.
    if (/\b(TODO|FIXME|XXX)\b\s*[:(]/.test(line))
      add('warning', 'todo-pendente', f, `L${i + 1}: ${line.trim().slice(0, 80)}`);
    // `style={{}}` só é dívida quando carrega valor ESTÁTICO (aparência que
    // devia ser prop do DS ou utility com token). Os dois casos autorizados
    // pelo contrato (§2.3) passam batido:
    //   - valor de runtime  → `${expr}` ou identificador (`color`, `BAR_H`);
    //   - pintura de SVG    → `'var(--token)'`, que atributo não resolve.
    if (/style=\{\{/.test(line) && !isTest(f)) {
      const janela = src
        .split('\n')
        .slice(i, i + 8)
        .join('\n')
        .split('}}')[0];
      const literalEstatico =
        /:\s*(?:'(?!var\()[^']*'|"(?!var\()[^"]*"|\d+(?:\.\d+)?(?:px|rem|em|%))\s*[,}\n]/.test(
          janela,
        );
      if (literalEstatico)
        add('warning', 'style-inline', f, `L${i + 1}: ${line.trim().slice(0, 80)}`);
    }
  });
}

// ---------------------------------------------------------------- regra 7
// Sobras do tema legado.
if (fs.existsSync(path.join(SRC, 'app/legacy-theme.css'))) {
  findings.blocking.push({
    rule: 'tema-legado',
    file: 'app/legacy-theme.css',
    detail: 'ainda existe — remover e ativar o bridge do Astryx',
  });
}
for (const f of files) {
  if (!/\.css$/.test(f) || isLegacyTheme(f)) continue;
  // Comentário é documentação, não código: a folha global EXPLICA por que o
  // shorthand é proibido, e citá-lo não pode acusar a própria regra.
  const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/@import\s+'tailwindcss'|@import\s+"tailwindcss"/.test(src))
    add('blocking', 'tailwind-shorthand', f, 'use os imports por layer, não o shorthand');
}

// ---------------------------------------------------------------- relatório
const groupBy = (list) =>
  list.reduce((acc, f) => ((acc[f.rule] ??= []).push(f), acc), {});

function report(title, list) {
  const groups = groupBy(list);
  console.log(`\n${title}: ${list.length}`);
  for (const [rule, items] of Object.entries(groups)) {
    console.log(`\n  [${rule}] ${items.length}`);
    for (const i of items.slice(0, 12)) console.log(`    ${i.file} — ${i.detail}`);
    if (items.length > 12) console.log(`    … +${items.length - 12}`);
  }
}

console.log('='.repeat(70));
console.log('AUDITORIA DA MIGRAÇÃO → ASTRYX');
console.log('='.repeat(70));
report('BLOQUEANTES', findings.blocking);
report('AVISOS', findings.warning);

console.log('\n' + '='.repeat(70));
if (findings.blocking.length === 0) {
  console.log('✓ Nenhum bloqueante. Critérios verificáveis por estática: OK.');
} else {
  console.log(`✗ ${findings.blocking.length} bloqueante(s).`);
}
process.exit(findings.blocking.length ? 1 : 0);
