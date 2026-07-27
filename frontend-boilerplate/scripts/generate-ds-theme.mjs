#!/usr/bin/env node
/**
 * GERADOR DO DESIGN SYSTEM — AuditorIA (MUI/Minimal v7) → Astryx (XDS)
 * ============================================================================
 *
 * Lê `src/shared/theme/ds/ds-tokens.source.json` (a ficha técnica bruta,
 * extraída do frontend MUI original — 2.340 citações `arquivo:linha`, valores
 * computados em Node + medidos em runtime) e emite
 * `src/shared/theme/ds/tokens.generated.ts`.
 *
 * POR QUE GERAR EM VEZ DE ESCREVER À MÃO
 * --------------------------------------
 * São ~400 valores. Transcrever à mão é (a) fonte garantida de erro de digitação
 * e (b) hardcode — o valor perde o vínculo com a origem. Gerando:
 *   - a fonte da verdade continua sendo o JSON da auditoria;
 *   - reexecutar o script re-sincroniza tudo;
 *   - cada token carrega o `source` (arquivo:linha do projeto original).
 *
 * A BASE DO REM (decisão registrada)
 * ----------------------------------
 * O projeto original tem `html { font-size: 14px }` enquanto os `rem` do tema
 * foram gerados dividindo por 16 — então todo `rem` renderiza a 87,5% do valor
 * escrito (ver `docs/design-system/99-inconsistencias.md` §1).
 *
 * Reproduzimos o RESULTADO, não a armadilha: os tokens saem com o **px real
 * medido em runtime** (campo `px` do JSON), que é exatamente o que a tela do
 * AuditorIA desenha. Assim a tipografia é pixel-idêntica à origem sem contaminar
 * as utilities do Tailwind (que são todas em `rem`) com uma raiz de 14px.
 *
 * Uso: node scripts/generate-ds-theme.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DS_DIR = resolve(__dirname, '../src/shared/theme/ds');
const SOURCE = resolve(DS_DIR, 'ds-tokens.source.json');
const OUT = resolve(DS_DIR, 'tokens.generated.ts');

const ds = JSON.parse(readFileSync(SOURCE, 'utf8'));

/* ========================================================================== *
 * Helpers de leitura do JSON
 * ========================================================================== */

/** Token de cor simples: `{ value, rgb, channel, source }` */
const val = (node) => node.value;

/** Token que varia por esquema: `{ light: {value}, dark: {value} }` → tupla */
const pair = (node) => [node.light.value, node.dark.value];

/** Emite tupla só quando os dois lados diferem (menos ruído no CSS final). */
const tuple = ([l, d]) => (l === d ? l : [l, d]);

const SEMANTIC = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];
const TONES = ['lighter', 'light', 'main', 'dark', 'darker', 'contrastText'];

/* ========================================================================== *
 * 1. PALETA CRUA — todos os tons do DS viram tokens `--ds-*`
 *
 * O Astryx tem ~172 slots; o DS tem tons que não têm slot equivalente
 * (`lighter`/`darker`, os 10 degraus de cinza, os overlays de ação). Em vez de
 * jogar fora, publicamos a paleta inteira como `--ds-color-*` e mapeamos os
 * slots do Astryx POR REFERÊNCIA (`var(--ds-color-…)`).
 *
 * Resultado: uma única fonte por cor. Trocar `--ds-color-primary-main` reflete
 * no botão, no link, na sombra colorida e no gráfico de uma vez.
 * ========================================================================== */

const dsColorTokens = {};
const provenance = {};

/**
 * camelCase → kebab-case, tratando acrônimos.
 *   `contrastText`  → `contrast-text`
 *   `paddingXText`  → `padding-x-text`
 *   `zIndex`        → `z-index`
 */
const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

for (const family of SEMANTIC) {
  for (const tone of TONES) {
    const node = ds.color.semantic[family][tone];
    const name = `--ds-color-${family}-${kebab(tone)}`;
    dsColorTokens[name] = val(node);
    provenance[name] = node.source;
    // Canal RGB ("0 167 111") — usado para compor transparências com
    // `rgba(var(--ds-channel-…) / 0.16)`, que é como o DS faz os `soft`.
    if (node.channel) {
      dsColorTokens[`--ds-channel-${family}-${kebab(tone)}`] = node.channel;
    }
  }
}

for (const [step, node] of Object.entries(ds.color.grey)) {
  dsColorTokens[`--ds-color-grey-${step}`] = val(node);
  provenance[`--ds-color-grey-${step}`] = node.source;
  if (node.channel) dsColorTokens[`--ds-channel-grey-${step}`] = node.channel;
}

for (const [key, node] of Object.entries(ds.color.common)) {
  if (node && typeof node === 'object' && node.value) {
    dsColorTokens[`--ds-color-common-${key}`] = val(node);
  }
}

// Texto / fundo — variam por esquema
for (const [key, node] of Object.entries(ds.color.text)) {
  dsColorTokens[`--ds-color-text-${key}`] = tuple(pair(node));
  provenance[`--ds-color-text-${key}`] = node.light.source;
}
for (const [key, node] of Object.entries(ds.color.background)) {
  dsColorTokens[`--ds-color-background-${key}`] = tuple(pair(node));
  provenance[`--ds-color-background-${key}`] = node.light.source;
}

// Ações — overlays de #919EAB, idênticos nos dois esquemas (fato do DS)
for (const [key, node] of Object.entries(ds.color.action)) {
  const name = `--ds-color-action-${key}`;
  if (node.value) {
    dsColorTokens[name] = node.value;
    provenance[name] = node.source;
  } else if (node.light) {
    dsColorTokens[name] = tuple(pair(node));
    provenance[name] = node.light.source;
  }
}

dsColorTokens['--ds-color-divider'] = tuple(pair(ds.color.divider));
provenance['--ds-color-divider'] = ds.color.divider.light.source;

// Bordas nomeadas (contorno de campo, de botão, da sidebar…)
for (const [key, node] of Object.entries(ds.color.border)) {
  const name = `--ds-color-border-${kebab(key)}`;
  if (node.value) {
    dsColorTokens[name] = node.value;
    provenance[name] = node.source;
  } else if (node.light) {
    dsColorTokens[name] = tuple(pair(node));
    provenance[name] = node.light.source;
  }
}

/**
 * Correção de esquema: a borda do campo em FOCO.
 *
 * A auditoria registrou `#1C252E` — mas esse é o valor de `text.primary` no
 * tema CLARO, que é o único que ela mediu (`colorScheme: "light (default)"`).
 * A regra real do DS é "a borda de foco usa `text.primary`"
 * (`08-elevacao-bordas-zindex.md` §4.2). Congelar o hex deixaria o campo focado
 * com contorno quase invisível no escuro — onde `text.primary` é #FFFFFF.
 *
 * Reproduzimos a REGRA, não a fotografia dela num único esquema.
 */
dsColorTokens['--ds-color-border-input-focus'] = tuple(pair(ds.color.text.primary));
provenance['--ds-color-border-input-focus'] =
  `${ds.color.border.inputFocus.source} (resolvido como text.primary nos dois esquemas)`;

/* ========================================================================== *
 * 2. SOMBRAS — escala 0..24 + customShadows, com base fria (#919EAB no claro)
 * ========================================================================== */

/**
 * ⚠️ ARMADILHA DO `light-dark()`
 *
 * A função aceita EXATAMENTE dois argumentos. Uma sombra do DS costuma ter
 * várias camadas separadas por vírgula:
 *
 *   card = "0 0 2px 0 rgba(…/0.2), 0 12px 24px -4px rgba(…/0.12)"
 *
 * Emitir `light-dark(<card claro>, <card escuro>)` produz QUATRO argumentos —
 * declaração inválida, descartada pelo browser, sombra nenhuma. E em silêncio.
 *
 * Solução (a mesma que o DS usa internamente, com `varAlpha`): a diferença
 * entre claro e escuro é só a COR-BASE da sombra — #919EAB (grey.500) no claro,
 * #000000 no escuro. Então publicamos a base como token por opacidade…
 *
 *   --ds-shadow-tint-16: light-dark(rgba(145 158 171 / 0.16), rgba(0 0 0 / 0.16))
 *
 * …e a geometria da sombra fica idêntica nos dois esquemas, referenciando o
 * tint. Um `light-dark()` por COR, nunca por sombra inteira.
 */
const SHADOW_LIGHT_BASE = ds.color.grey['500'].channel; // "145 158 171"
const SHADOW_DARK_BASE = ds.color.common.black.channel ?? '0 0 0';

const shadowTints = new Map(); // alfa → nome do token

/**
 * Índice canal RGB → token de canal (`"0 167 111"` → `--ds-channel-primary-main`),
 * montado a partir da paleta já publicada.
 */
const channelIndex = new Map(
  Object.entries(dsColorTokens)
    .filter(([name]) => name.startsWith('--ds-channel-'))
    .map(([name, channel]) => [channel, name]),
);

/**
 * Tokeniza as cores de uma sombra.
 *
 * Três casos, e a distinção importa:
 *   1. base = grey.500  → é a sombra NEUTRA, que troca de cor por esquema
 *                          (#919EAB no claro, #000 no escuro) → vira tint;
 *   2. base = preto      → `customShadows.dialog` usa preto nos DOIS esquemas
 *                          (fato do DS) → fica literal;
 *   3. base = cor semântica → as sombras COLORIDAS (`customShadows.primary` e
 *                          irmãs) são iguais nos dois esquemas → referenciam o
 *                          canal da própria cor, não o tint cinza.
 */
function tokenizeShadow(value) {
  return value.replace(
    /rgba\(\s*([\d\s]+?)\s*\/\s*([\d.]+)\s*\)/g,
    (whole, rawBase, a) => {
      const base = rawBase.trim();

      if (base === SHADOW_LIGHT_BASE) {
        const name = `--ds-shadow-tint-${a.replace('.', '_')}`;
        if (!shadowTints.has(a)) shadowTints.set(a, name);
        return `var(${name})`;
      }

      if (base === SHADOW_DARK_BASE) return whole; // dialog: preto nos dois

      const channelToken = channelIndex.get(base);
      return channelToken ? `rgba(var(${channelToken}) / ${a})` : whole;
    },
  );
}

const shadowValues = {};

for (const [key, lightValue] of Object.entries(ds.shadows.custom.light)) {
  shadowValues[`--ds-shadow-${key}`] = tokenizeShadow(lightValue);
}
for (const [level, lightValue] of Object.entries(ds.shadows.scale.light)) {
  shadowValues[`--ds-elevation-${level}`] = tokenizeShadow(lightValue);
}

// Tints primeiro (só por legibilidade do CSS — `var()` resolve no uso).
const tintTokens = {};
for (const [a, name] of [...shadowTints.entries()].sort(
  (x, y) => Number(x[0]) - Number(y[0]),
)) {
  tintTokens[name] = [
    `rgba(${SHADOW_LIGHT_BASE} / ${a})`,
    `rgba(${SHADOW_DARK_BASE} / ${a})`,
  ];
}

const dsShadowTokens = { ...tintTokens, ...shadowValues };

/* ========================================================================== *
 * 3. TIPOGRAFIA — px real medido em runtime (ver cabeçalho)
 * ========================================================================== */

const dsTypography = {};
for (const [variant, node] of Object.entries(ds.typography.variants)) {
  dsTypography[variant] = {
    family: node.fontFamily, // 'primary' | 'secondary'
    weight: node.fontWeight,
    size: node.fontSize.px,
    lineHeight: node.lineHeight.value,
    lineHeightPx: node.lineHeight.px,
    textTransform: node.textTransform,
    responsive: node.responsive
      ? Object.fromEntries(
          Object.entries(node.responsive).map(([bp, r]) => [
            bp,
            { minWidth: r.minWidth, size: r.px },
          ]),
        )
      : null,
    source: node.source,
  };
}

const fontFamilies = {
  primary: ds.typography.fontFamily.primary.value,
  secondary: ds.typography.fontFamily.secondary.value,
  primaryName: ds.typography.fontFamily.primary.firstFamily,
  secondaryName: ds.typography.fontFamily.secondary.firstFamily,
};

const fontWeights = Object.fromEntries(
  Object.entries(ds.typography.fontWeight).map(([k, v]) => [k, v.value]),
);

/* ========================================================================== *
 * 4. FORMA, ESPAÇAMENTO, MOTION, LAYOUT, TAMANHOS, OPACIDADE, Z-INDEX
 * ========================================================================== */

const radiusBase = ds.shape.borderRadius.number;
const radiusMultipliers = Object.fromEntries(
  Object.entries(ds.shape.multipliers).map(([mult, v]) => [mult, v.value]),
);

const spacingScale = Object.fromEntries(
  Object.entries(ds.spacing.scale).map(([mult, v]) => [mult, v.value]),
);

/**
 * Espaçamento como token CSS.
 *
 * A base do DS é 8px e a escala vai de 0.25 (2px) a 12 (96px). Publicamos como
 * `--ds-spacing-{n}` (o ponto do multiplicador fracionário vira `_`, porque
 * `.` não é válido em nome de custom property: `1.5` → `--ds-spacing-1_5`).
 */
const spacingTokens = Object.fromEntries(
  Object.entries(ds.spacing.scale).map(([mult, v]) => [
    `--ds-spacing-${mult.replace('.', '_')}`,
    v.value,
  ]),
);

const motion = {
  duration: Object.fromEntries(
    Object.entries(ds.motion.duration).map(([k, v]) => [k, v.value]),
  ),
  easing: Object.fromEntries(
    Object.entries(ds.motion.easing).map(([k, v]) => [k, v.value]),
  ),
  layout: {
    duration: ds.motion.layout.duration.value,
    easing: ds.motion.layout.easing.value,
  },
};

/**
 * Chaves que são METADADO da ficha técnica, não valor de design.
 * (`source` = arquivo:linha, `note` = explicação, `confirmedInRuntime` = flag
 * de medição, `rgb`/`channel` = formas alternativas da mesma cor…)
 */
const META_KEYS = new Set([
  'source',
  'note',
  'heightNote',
  'confirmedInRuntime',
  'referenceMui',
  'muiDefault',
  'cssVariable',
  'rgb',
  'rgbaLegacy',
  'channel',
  'base',
  'alpha',
  'warning',
  'multiplier',
  'usedBy',
  'number',
  'px',
  'composition', // descrição em prosa da soma de alturas, não um valor CSS
]);

/**
 * Achata `layout`/`size` em tokens CSS.
 *
 * Um nó pode ser: valor direto (`height: "30px"`), um envelope
 * (`{ value, px, source }`) ou um sub-objeto. Quando o envelope traz `px`,
 * usamos o **px real medido** em vez do `rem` nominal — mesma razão do
 * cabeçalho deste arquivo (lá `rem` renderiza a 87,5%).
 */
function flattenValues(node, prefix, out = {}) {
  for (const [key, child] of Object.entries(node)) {
    if (child == null || META_KEYS.has(key)) continue;
    const name = `${prefix}-${kebab(key)}`;

    if (typeof child === 'string' || typeof child === 'number') {
      out[name] = String(child);
      continue;
    }
    if (typeof child !== 'object') continue;

    if ('px' in child) {
      out[name] = `${child.px}px`; // px real medido em runtime
      continue;
    }
    if ('value' in child) {
      out[name] = String(child.value);
      continue;
    }
    flattenValues(child, name, out);
  }
  return out;
}

const layoutTokens = flattenValues(ds.layout, '--ds-layout');
const sizeTokens = flattenValues(ds.size, '--ds-size');
const opacityTokens = Object.fromEntries(
  Object.entries(ds.opacity).map(([k, v]) => [
    `--ds-opacity-${kebab(k)}`,
    String(v.value),
  ]),
);
const zIndex = Object.fromEntries(
  Object.entries(ds.zIndex).map(([k, v]) => [k, typeof v === 'object' ? v.value : v]),
);
const breakpoints = Object.fromEntries(
  Object.entries(ds.breakpoints.values).map(([k, v]) => [
    k,
    typeof v === 'object' ? v.value : v,
  ]),
);

/* ========================================================================== *
 * 4b. ESPESSURA DE BORDA
 *
 * O JSON de máquina não capturou este eixo (só as CORES de borda). Os valores
 * abaixo vêm da ficha `08-elevacao-bordas-zindex.md` §4.1, que os inventaria
 * um a um com arquivo:linha. Ficam aqui — e não no tema — para que continuem
 * sendo dado do design system, com origem citada, e não número solto no código.
 * ========================================================================== */

const borderWidthTokens = {
  // "espessura padrão de praticamente todo o sistema (divisores, inputs,
  // outlines, chips, paginação, nav)" — §4.1
  '--ds-border-width-thin': '1px',
  // Única borda de 2px do sistema: `Label variant="outlined"`
  // (frontend/src/components/label/styles.tsx:32,67) — §4.1
  '--ds-border-width-thick': '2px',
  // Anel de hover do botão `outlined` — é box-shadow, não border
  // (frontend/src/theme/core/components/button.tsx:130) — §4.1
  '--ds-border-width-ring': '0.75px',
};

/* ========================================================================== *
 * 5. EMISSÃO
 * ========================================================================== */

const stringify = (v, indent = 2) => JSON.stringify(v, null, indent);
const pad = (s, n) => s.replace(/\n/g, '\n' + ' '.repeat(n));

/**
 * Serializa um mapa de tokens emitindo `duo(claro, escuro)` para os pares.
 *
 * Por que não `as const`: o Astryx tipa valor de token como
 * `string | [light: string, dark: string]` — uma tupla MUTÁVEL. Um array
 * literal com `as const` vira `readonly [string, string]`, que TypeScript
 * recusa; e sem `as const` vira `string[]`, que também não casa. `duo()`
 * devolve exatamente a tupla mutável esperada.
 */
function serializeTokenMap(map) {
  const lines = Object.entries(map).map(([key, value]) => {
    const rendered = Array.isArray(value)
      ? `duo(${JSON.stringify(value[0])}, ${JSON.stringify(value[1])})`
      : JSON.stringify(value);
    return `  ${JSON.stringify(key)}: ${rendered},`;
  });
  return `{\n${lines.join('\n')}\n}`;
}

const banner = `/**
 * ARQUIVO GERADO — NÃO EDITE À MÃO.
 *
 * Origem : src/shared/theme/ds/ds-tokens.source.json
 * Gerador: scripts/generate-ds-theme.mjs  (\`npm run ds:tokens\`)
 *
 * Design system do AuditorIA (${ds.$meta.baseTemplate}, MUI ${ds.$meta.mui}),
 * extraído por leitura de código + tema computado em Node + medição em runtime.
 *
 * ⚠️ Tipografia em **px real medido**, não no \`rem\` nominal do tema de origem:
 * lá \`html\` é 14px e os \`rem\` foram gerados sobre 16, então todo \`rem\`
 * renderiza a 87,5%. Ver docs/design-system/99-inconsistencias.md §1.
 */`;

const out = `${banner}

/** Valor de token: fixo, ou [claro, escuro] quando muda por esquema. */
export type DsTokenValue = string | [light: string, dark: string];

/** Par claro/escuro. O Astryx compila para \`light-dark(claro, escuro)\`. */
export const duo = (light: string, dark: string): [string, string] => [light, dark];

/* -------------------------------------------------------------------------- *
 * Paleta — todos os tons do DS, incluindo os que o Astryx não tem slot
 * (\`lighter\`/\`darker\`, os 10 cinzas, os overlays de ação).
 * -------------------------------------------------------------------------- */
export const dsColorTokens: Record<string, DsTokenValue> = ${pad(serializeTokenMap(dsColorTokens), 0)};

/* -------------------------------------------------------------------------- *
 * Elevação — \`customShadows\` (card/dropdown/dialog/coloridas) + escala 0..24.
 * A base é #919EAB no claro e #000000 no escuro: sombras FRIAS, não pretas.
 * -------------------------------------------------------------------------- */
export const dsShadowTokens: Record<string, DsTokenValue> = ${pad(serializeTokenMap(dsShadowTokens), 0)};

/* -------------------------------------------------------------------------- *
 * Layout — dimensões do chrome (header 72px, sidebar 300px, nav mini 88px…).
 * -------------------------------------------------------------------------- */
export const dsLayoutTokens = ${pad(stringify(layoutTokens), 0)} as const;

/* -------------------------------------------------------------------------- *
 * Tamanhos de controle (botão, campo, chip, ícone, switch, slider…).
 * -------------------------------------------------------------------------- */
export const dsSizeTokens = ${pad(stringify(sizeTokens), 0)} as const;

export const dsOpacityTokens = ${pad(stringify(opacityTokens), 0)} as const;

/* -------------------------------------------------------------------------- *
 * Espaçamento — base 8px. \`--ds-spacing-1_5\` = 12px (multiplicador 1.5).
 * -------------------------------------------------------------------------- */
export const dsSpacingTokens = ${pad(stringify(spacingTokens), 0)} as const;

/* -------------------------------------------------------------------------- *
 * Espessura de borda — ficha \`08-elevacao-bordas-zindex.md\` §4.1.
 * -------------------------------------------------------------------------- */
export const dsBorderWidthTokens = ${pad(stringify(borderWidthTokens), 0)} as const;

/* -------------------------------------------------------------------------- *
 * Tipografia — 13 variantes do DS. \`size\` em px real.
 * -------------------------------------------------------------------------- */
export const dsFontFamilies = ${pad(stringify(fontFamilies), 0)} as const;

export const dsFontWeights = ${pad(stringify(fontWeights), 0)} as const;

export const dsTypography = ${pad(stringify(dsTypography), 0)} as const;

export type DsTypographyVariant = keyof typeof dsTypography;

/* -------------------------------------------------------------------------- *
 * Forma, espaçamento, motion, z-index, breakpoints.
 * -------------------------------------------------------------------------- */
export const dsRadius = {
  base: ${radiusBase},
  multipliers: ${pad(stringify(radiusMultipliers), 2)},
} as const;

export const dsSpacing = ${pad(stringify(spacingScale), 0)} as const;

export const dsMotion = ${pad(stringify(motion), 0)} as const;

export const dsZIndex = ${pad(stringify(zIndex), 0)} as const;

export const dsBreakpoints = ${pad(stringify(breakpoints), 0)} as const;

/* -------------------------------------------------------------------------- *
 * Rastreabilidade — arquivo:linha de origem de cada token de cor.
 * Mantido em runtime de propósito: é o que permite auditar uma cor sem sair
 * do código ("de onde veio esse verde?").
 * -------------------------------------------------------------------------- */
export const dsTokenProvenance: Readonly<Record<string, string>> = ${pad(stringify(provenance), 0)};

export const dsMeta = ${pad(stringify(ds.$meta), 0)} as const;
`;

writeFileSync(OUT, out, 'utf8');

/* ========================================================================== *
 * 6. TIPOGRAFIA RESPONSIVA (CSS)
 *
 * O DS roda `responsiveFontSizes()`: h1–h6 CRESCEM em `sm`/`md`/`lg`. Ex.: h4
 * é 17,5px no telefone e 21px a partir de 900px — e h4 é justamente o título
 * de página (75 usos). Congelar no valor base deixaria todo título do produto
 * menor que o original.
 *
 * O Astryx não tem token responsivo, então emitimos as media queries que
 * sobrescrevem os `--text-*-size`. Mesmos breakpoints da origem
 * (600/900/1200px) e mesmos valores medidos.
 *
 * Nenhuma variante define regra em `xl` (1536px): acima de 1200px a tipografia
 * congela — é assim na origem (`02-tipografia.md` §4).
 * ========================================================================== */

const HEADING_SLOTS = {
  h1: ['heading-1', 'display-1'],
  h2: ['heading-2', 'display-2'],
  h3: ['heading-3', 'display-3'],
  h4: ['heading-4'],
  h5: ['heading-5'],
  h6: ['heading-6'],
};

const byBreakpoint = new Map(); // minWidth → [linhas]

for (const [variant, slots] of Object.entries(HEADING_SLOTS)) {
  const responsive = dsTypography[variant]?.responsive;
  if (!responsive) continue;
  for (const [, step] of Object.entries(responsive)) {
    if (!byBreakpoint.has(step.minWidth)) byBreakpoint.set(step.minWidth, []);
    for (const slot of slots) {
      byBreakpoint.get(step.minWidth).push(`    --text-${slot}-size: ${step.size}px;`);
    }
  }
}

const sortedBreakpoints = [...byBreakpoint.entries()].sort(
  (a, b) => parseInt(a[0], 10) - parseInt(b[0], 10),
);

const responsiveCss = `/*
 * ARQUIVO GERADO por scripts/generate-ds-theme.mjs — não edite à mão.
 *
 * Tipografia responsiva do design system. Reproduz o \`responsiveFontSizes()\`
 * do tema de origem: h1–h6 crescem em 600px / 900px / 1200px.
 *
 * Tamanhos em px real medido (a origem tem \`html\` a 14px com \`rem\` gerados
 * sobre 16 — ver docs/design-system/99-inconsistencias.md §1).
 */

${sortedBreakpoints
  .map(
    ([minWidth, lines]) =>
      `@media (min-width: ${minWidth}) {\n  :root {\n${[...new Set(lines)].join('\n')}\n  }\n}`,
  )
  .join('\n\n')}
`;

const RESPONSIVE_OUT = resolve(DS_DIR, 'typography-responsive.css');
writeFileSync(RESPONSIVE_OUT, responsiveCss, 'utf8');

const count =
  Object.keys(dsColorTokens).length +
  Object.keys(dsShadowTokens).length +
  Object.keys(layoutTokens).length +
  Object.keys(sizeTokens).length +
  Object.keys(opacityTokens).length +
  Object.keys(spacingTokens).length +
  Object.keys(borderWidthTokens).length;

console.log(`✔ tokens.generated.ts escrito`);
console.log(`  ${Object.keys(dsColorTokens).length} tokens de cor`);
console.log(`  ${Object.keys(dsShadowTokens).length} de elevação`);
console.log(`  ${Object.keys(layoutTokens).length} de layout`);
console.log(`  ${Object.keys(sizeTokens).length} de tamanho`);
console.log(`  ${Object.keys(opacityTokens).length} de opacidade`);
console.log(`  ${Object.keys(spacingTokens).length} de espaçamento`);
console.log(`  ${Object.keys(dsTypography).length} variantes tipográficas`);
console.log(`  ${count} tokens CSS no total`);
console.log(
  `✔ typography-responsive.css escrito (${sortedBreakpoints.length} breakpoints: ${sortedBreakpoints
    .map(([w]) => w)
    .join(', ')})`,
);
