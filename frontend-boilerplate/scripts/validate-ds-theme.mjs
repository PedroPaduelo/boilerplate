#!/usr/bin/env node
/**
 * VALIDADOR DO DESIGN SYSTEM
 * ============================================================================
 *
 * Por que existe: em CSS, `var(--nao-existe)` **falha em silêncio**. A
 * propriedade simplesmente não aplica e o componente cai no estilo herdado —
 * sem erro de build, sem aviso no console. Num tema com ~350 tokens que se
 * referenciam entre si, um typo vira um bug visual que ninguém rastreia.
 *
 * Este script quebra o build quando isso acontece.
 *
 * Checa:
 *   1. toda referência `var(--ds-*)` aponta para um token declarado;
 *   2. nenhum valor hardcoded (#hex / rgb() literal) no tema — a paleta tem
 *      que vir do JSON da auditoria, não da mão de quem editou;
 *   3. o gerado está em sincronia com o JSON de origem.
 *
 * A camada de LIGAÇÃO são dois arquivos — `auditoria-theme.ts` (token → slot)
 * e `component-overrides.ts` (slot → componente). Os dois são verificados
 * juntos: um override pode referenciar um token declarado no tema, e um typo
 * em qualquer um dos dois falha do mesmo jeito silencioso.
 *
 * Uso: node scripts/validate-ds-theme.mjs   (`npm run ds:check`)
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DS_DIR = resolve(__dirname, '../src/shared/theme/ds');
const GENERATED = resolve(DS_DIR, 'tokens.generated.ts');
const THEME = resolve(DS_DIR, 'auditoria-theme.ts');
const OVERRIDES = resolve(DS_DIR, 'component-overrides.ts');

const generated = readFileSync(GENERATED, 'utf8');
/** Camada de ligação: tema + overrides de componente, verificados em conjunto. */
const theme = [THEME, OVERRIDES].map((f) => readFileSync(f, 'utf8')).join('\n');

const errors = [];
const warnings = [];

/**
 * Código sem comentários.
 *
 * Tudo abaixo analisa ESTA versão, não o texto bruto: um comentário que
 * explica o formato (`rgba(var(--ds-channel-<familia>-<tom>) / alfa)`) não é
 * uma referência a token, e um `#hex` citado numa nota de origem não é
 * hardcode. Analisar o texto cru produzia falso positivo nos dois checks.
 */
const themeBody = theme
  .replace(/\/\*[\s\S]*?\*\//g, '') // blocos de comentário
  .replace(/\/\/.*$/gm, ''); // linha

/* -------------------------------------------------------------------------- *
 * 1. Referências órfãs
 * -------------------------------------------------------------------------- */

/** Tokens declarados no gerado (chaves de objeto: `"--ds-x": "valor"`). */
const declaredInGenerated = new Set(
  [...generated.matchAll(/"(--[a-z0-9-_]+)":/g)].map((m) => m[1]),
);

/**
 * Tokens declarados pelo próprio tema — tanto chaves de objeto (`'--x': ...`)
 * quanto chaves entre aspas duplas.
 */
const declaredInTheme = new Set(
  [...themeBody.matchAll(/['"](--[a-z0-9-_]+)['"]\s*:/g)].map((m) => m[1]),
);

/**
 * Tokens que o PRÓPRIO Astryx publica (`--spacing-*`, `--border-width`,
 * `--ease-*`…), lidos do CSS do pacote.
 *
 * O tema não precisa redeclarar o sistema de destino inteiro para poder
 * apontar para ele: `var(--border-width)` é uma referência legítima ao token
 * de 1px do Astryx, não um token órfão. Sem esta lista, usar um slot do
 * Astryx que o tema não sobrescreve viraria falso positivo — e o jeito de
 * "resolver" seria digitar o valor à mão, exatamente o que este script existe
 * para impedir.
 */
const ASTRYX_CSS = resolve(
  __dirname,
  '../node_modules/@astryxdesign/core/dist/astryx.css',
);
let declaredByAstryx = new Set();
try {
  const astryxCss = readFileSync(ASTRYX_CSS, 'utf8');
  declaredByAstryx = new Set(
    [...astryxCss.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)].map((m) => m[1]),
  );
} catch {
  warnings.push(
    'astryx.css não encontrado — tokens do Astryx não entraram na verificação',
  );
}

const declared = new Set([
  ...declaredInGenerated,
  ...declaredInTheme,
  ...declaredByAstryx,
]);

/** Referências: `var(--x)` e `ref('--x')` / `alpha('--x', n)`. */
const referenced = new Set([
  ...[...themeBody.matchAll(/var\((--[a-z0-9-_]+)\)/g)].map((m) => m[1]),
  ...[...themeBody.matchAll(/(?:ref|alpha)\(\s*['"](--[a-z0-9-_]+)['"]/g)].map(
    (m) => m[1],
  ),
]);

for (const token of referenced) {
  if (!declared.has(token)) {
    // Sugere o nome mais próximo — a causa quase sempre é kebab-case.
    const prefix = token.split('-').slice(0, 4).join('-');
    const near = [...declared].filter((d) => d.startsWith(prefix)).slice(0, 3);
    errors.push(
      `referência órfã: ${token}` +
        (near.length ? `\n      talvez: ${near.join(', ')}` : ''),
    );
  }
}

/* -------------------------------------------------------------------------- *
 * 2. Hardcode no tema
 *
 * O tema é uma camada de LIGAÇÃO. Se um #hex aparece aqui, alguém pulou o
 * JSON da auditoria — e aquele valor deixou de ter origem rastreável.
 * -------------------------------------------------------------------------- */

const hexes = [...themeBody.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
const rgbs = [...themeBody.matchAll(/\brgba?\(\s*\d/g)].map((m) => m[0]);

if (hexes.length) errors.push(`cor hardcoded no tema: ${[...new Set(hexes)].join(', ')}`);
if (rgbs.length) {
  errors.push(
    `rgb()/rgba() literal no tema (use alpha() com --ds-channel-*): ${rgbs.length}x`,
  );
}

/* -------------------------------------------------------------------------- *
 * 3. Alvos de componente existem de verdade
 *
 * Um override vira o seletor `.astryx-<componente><sufixo>`. Errar o nome do
 * componente, da prop ou do estado NÃO quebra nada: o CSS é gerado, o build
 * passa e a regra simplesmente nunca casa com elemento nenhum. É a mesma
 * falha silenciosa que a checagem 1 evita para tokens — só que em seletor.
 *
 * A fonte da verdade é o `theming.targets` que cada componente declara no seu
 * `*.doc.mjs` dentro do pacote: `{className, visualProps, states}`. NÃO é a
 * lista embutida no CLI, que está defasada — ela avisa "Unknown component
 * text-input, did you mean textinput?" enquanto o TextInput de fato renderiza
 * `astryx-text-input`. Seguir a sugestão do CLI geraria seletor morto.
 * -------------------------------------------------------------------------- */

const CORE_SRC = resolve(__dirname, '../node_modules/@astryxdesign/core/src');

/** Mapa `componente → { props, states }` lido dos docs do pacote. */
function readThemingTargets() {
  const targets = new Map();
  let files = [];
  try {
    files = readdirSync(CORE_SRC, { recursive: true }).filter((f) =>
      String(f).endsWith('.doc.mjs'),
    );
  } catch {
    return null; // pacote sem `src` publicado — sem fonte da verdade
  }

  for (const file of files) {
    const src = readFileSync(resolve(CORE_SRC, String(file)), 'utf8');
    // {className: 'astryx-x', visualProps: ['size'], states: ['checked']}
    for (const m of src.matchAll(/\{className:\s*'astryx-([a-z0-9-]+)'([^}]*)\}/g)) {
      const [, name, rest] = m;
      const entry = targets.get(name) ?? { props: new Set(), states: new Set() };
      const props = rest.match(/visualProps:\s*\[([^\]]*)\]/);
      const states = rest.match(/states:\s*\[([^\]]*)\]/);
      for (const list of [
        [props, entry.props],
        [states, entry.states],
      ]) {
        const [match, set] = list;
        if (!match) continue;
        for (const v of match[1].matchAll(/'([^']+)'/g)) set.add(v[1]);
      }
      targets.set(name, entry);
    }
  }
  return targets;
}

/**
 * Overrides carregados de verdade (jiti compila o TS), não por regex: o objeto
 * é montado a partir de constantes espalhadas pelo arquivo, e só executando
 * dá para saber as chaves reais de cada componente.
 */
async function loadOverrides() {
  try {
    const { createJiti } = await import('jiti');
    const jiti = createJiti(import.meta.url);
    const mod = await jiti.import(OVERRIDES);
    return mod.dsComponentOverrides ?? mod.default;
  } catch {
    return null;
  }
}

const themingTargets = readThemingTargets();
const overrides = await loadOverrides();
let overrideNames = new Set();

if (!overrides) {
  warnings.push(
    'não foi possível carregar component-overrides.ts — alvos não verificados',
  );
} else if (!themingTargets) {
  warnings.push('@astryxdesign/core sem docs — alvos de componente não verificados');
} else {
  overrideNames = new Set(Object.keys(overrides));

  for (const [name, rules] of Object.entries(overrides)) {
    const target = themingTargets.get(name);
    if (!target) {
      const near = [...themingTargets.keys()]
        .filter((c) => c.includes(name) || name.includes(c))
        .slice(0, 3);
      errors.push(
        `componente inexistente no Astryx: "${name}" (viraria o seletor morto .astryx-${name})` +
          (near.length ? `\n      talvez: ${near.join(', ')}` : ''),
      );
      continue;
    }

    for (const key of Object.keys(rules)) {
      if (key === 'base') continue;
      // `variant:soft+size:sm` → cada par é verificado separadamente.
      for (const part of key.split('+')) {
        const [prop, value] = part.split(':');
        if (value === undefined) {
          // Chave sem `:` é nome de ESTADO (`checked`, `selected`, `disabled`).
          if (!target.states.has(prop)) {
            errors.push(
              `estado inexistente em "${name}": "${prop}"` +
                (target.states.size
                  ? ` (existem: ${[...target.states].join(', ')})`
                  : ' (este componente não expõe estados)'),
            );
          }
        } else if (!target.props.has(prop)) {
          errors.push(
            `prop inexistente em "${name}": "${prop}"` +
              (target.props.size
                ? ` (existem: ${[...target.props].join(', ')})`
                : ' (este componente não expõe props visuais)'),
          );
        }
      }
    }
  }
}

/* -------------------------------------------------------------------------- *
 * 4. `light-dark()` com mais de 2 argumentos
 *
 * A função aceita exatamente dois. Uma sombra multi-camada ("0 0 2px …, 0 12px
 * …") tem vírgulas internas: envolvê-la em `light-dark()` gera 4 argumentos, o
 * browser descarta a declaração e a sombra some — sem erro nenhum.
 * Já aconteceu uma vez; não acontece de novo.
 * -------------------------------------------------------------------------- */

const CSS_BUILD = resolve(DS_DIR, 'auditoria.css');
let css = '';
try {
  css = readFileSync(CSS_BUILD, 'utf8');
} catch {
  warnings.push('auditoria.css ainda não foi compilado (rode `npm run ds:build`)');
}

if (css) {
  for (const match of css.matchAll(/light-dark\(/g)) {
    // Varre a partir do "(" contando parênteses, e conta as vírgulas de topo.
    let depth = 0;
    let commas = 0;
    let i = match.index + 'light-dark'.length;
    for (; i < css.length; i++) {
      const ch = css[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) break;
      } else if (ch === ',' && depth === 1) commas++;
    }
    if (commas !== 1) {
      const snippet = css.slice(match.index, Math.min(i + 1, match.index + 120));
      errors.push(
        `light-dark() com ${commas + 1} argumentos (só aceita 2) — o browser descarta em silêncio:\n      ${snippet}`,
      );
    }
  }
}

/* -------------------------------------------------------------------------- *
 * 5. Sincronia gerado ↔ origem
 * -------------------------------------------------------------------------- */

try {
  const before = generated;
  execFileSync('node', [resolve(__dirname, 'generate-ds-theme.mjs')], { stdio: 'pipe' });
  const after = readFileSync(GENERATED, 'utf8');
  if (before !== after) {
    errors.push(
      'tokens.generated.ts estava DESSINCRONIZADO do JSON de origem (foi regerado agora — confira o diff)',
    );
  }
} catch (err) {
  errors.push(`falha ao reexecutar o gerador: ${err.message}`);
}

/* -------------------------------------------------------------------------- *
 * 6. Cobertura — quanto do DS realmente chegou no tema
 * -------------------------------------------------------------------------- */

const dsTokenCount = [...declaredInGenerated].filter((t) => t.startsWith('--ds-')).length;
const astryxSlots = [...declaredInTheme].filter((t) => !t.startsWith('--ds-')).length;

/* -------------------------------------------------------------------------- *
 * Relatório
 * -------------------------------------------------------------------------- */

console.log(`\nDesign system — validação`);
console.log(`  ${dsTokenCount} tokens do DS publicados`);
console.log(`  ${astryxSlots} slots do Astryx ligados`);
console.log(`  ${referenced.size} referências verificadas`);
console.log(
  `  ${overrideNames.size} componentes com override (nomes conferidos no core)`,
);

for (const w of warnings) console.log(`  ⚠ ${w}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} problema(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('');
  process.exit(1);
}

console.log(`\n✔ tema íntegro — nenhuma referência órfã, nenhum valor hardcoded\n`);
