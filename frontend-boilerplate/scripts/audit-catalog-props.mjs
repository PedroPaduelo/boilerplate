/**
 * AUDITORIA DO CATÁLOGO — prop declarada × prop consumida.
 *
 * Uma prop que o manifesto anuncia mas o componente nunca lê é PIOR que uma
 * prop ausente: o agente a escolhe, o usuário a preenche, e a tela não muda.
 * Este script cruza as duas pontas mecanicamente, em vez de por amostragem.
 *
 * Para cada `catalog/<tipo>/`:
 *   1. extrai as chaves de `manifest.propsSchema.properties` (+ enums e default);
 *   2. varre os arquivos de implementação da pasta (component.tsx e irmãos,
 *      fora manifest/fixture/teste) procurando referência à chave;
 *   3. classifica: `usada` | `SUSPEITA` (nunca aparece no código).
 *
 * SUSPEITA não é veredito — é onde olhar. A confirmação é visual, no catálogo.
 *
 * Uso: node scripts/audit-catalog-props.mjs [--json]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/shared/render-engine/catalog';

/** Arquivos que NÃO contam como implementação (declaram, não consomem). */
const NOT_IMPL = /(manifest|fixture)\.ts$|\.test\.tsx?$|\.md$/;

/** Bloco `properties: { ... }` de dentro de `propsSchema`. */
function propsBlock(source) {
  const schemaAt = source.indexOf('propsSchema');
  if (schemaAt < 0) return '';
  const propsAt = source.indexOf('properties:', schemaAt);
  if (propsAt < 0) return '';
  const open = source.indexOf('{', propsAt);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return '';
}

/** Chaves de 1º nível do bloco `properties` (ignora as aninhadas). */
function topLevelKeys(block) {
  const keys = [];
  let depth = 0;
  let line = '';
  for (const char of block) {
    if (char === '\n') {
      const match = /^\s*([A-Za-z_][\w]*)\s*:\s*\{/.exec(line);
      if (depth === 0 && match) keys.push(match[1]);
      depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
      line = '';
    } else line += char;
  }
  return keys;
}

/** Corpo `{...}` BALANCEADO da chave — sem isto o enum vaza para a chave seguinte. */
function bodyOf(block, key) {
  const at = block.search(new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*\\{`));
  if (at < 0) return '';
  const open = block.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < block.length; i += 1) {
    if (block[i] === '{') depth += 1;
    else if (block[i] === '}') {
      depth -= 1;
      if (depth === 0) return block.slice(open + 1, i);
    }
  }
  return '';
}

/**
 * Constantes que os manifestos espalham dentro do `enum` (`...ACCENT_COLORS`).
 * Sem resolvê-las o mapa publicaria o nome da variável em vez dos valores —
 * e o mapa existe justamente para dizer QUAIS valores são aceitos.
 */
const SHARED_ENUMS = {
  ACCENT_COLORS: 'src/shared/render-engine/lib/accent.ts',
  VALUE_FORMATS: 'src/shared/lib/format.ts',
  CATALOG_ICONS: 'src/shared/render-engine/lib/icons.ts',
};

/** Valores literais de uma dessas constantes. */
function sharedEnumValues(name) {
  const path = SHARED_ENUMS[name];
  if (!path) return null;
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    return null;
  }
  const at = source.indexOf(`const ${name}`);
  if (at < 0) return null;
  // Do `=` em diante, senão o `[` da ANOTAÇÃO DE TIPO (`readonly AccentColor[]`)
  // é confundido com o início do array — e a lista sai vazia.
  const assign = source.indexOf('=', at);
  const open = source.indexOf('[', assign);
  const close = source.indexOf(']', open);
  if (assign < 0 || open < 0 || close < 0) return null;
  return source
    .slice(open + 1, close)
    .split(',')
    .map((value) =>
      value
        .replace(/\/\/.*$/gm, '')
        .trim()
        .replace(/^['"]|['"]$/g, ''),
    )
    .filter(Boolean);
}

/** `enum: [...]` da PRÓPRIA chave — os valores a testar um a um. */
function enumOf(block, key) {
  const match = /enum:\s*\[([^\]]+)\]/.exec(bodyOf(block, key));
  if (!match) return null;
  const values = [];
  for (const raw of match[1].split(',')) {
    const token = raw.trim();
    if (!token) continue;
    const spread = /^\.\.\.([A-Z_]+)$/.exec(token);
    if (spread) {
      const resolved = sharedEnumValues(spread[1]);
      if (resolved) values.push(...resolved);
      else values.push(token);
      continue;
    }
    values.push(token.replace(/^['"]|['"]$/g, ''));
  }
  return values.length ? values : null;
}

/** `type:` declarado da chave (string/number/boolean/array). */
function typeOf(block, key) {
  return /type:\s*'([a-z]+)'/.exec(bodyOf(block, key))?.[1] ?? '?';
}

/** Todo o código de implementação da pasta, concatenado. */
function implSource(dir) {
  const walk = (path) =>
    readdirSync(path).flatMap((entry) => {
      const full = join(path, entry);
      if (statSync(full).isDirectory()) return walk(full);
      if (NOT_IMPL.test(entry) || !/\.tsx?$/.test(entry)) return [];
      return [readFileSync(full, 'utf8')];
    });
  return walk(dir).join('\n');
}

/**
 * A chave é LIDA do objeto de props?
 *
 * `\bkey\b` seria permissivo demais: `title`, `variant` e `label` aparecem em
 * comentário, em texto e em prop de outro componente. O que prova consumo é a
 * LEITURA — acesso por ponto/índice ou desestruturação a partir de `props`.
 */
function isUsed(code, key) {
  const read = new RegExp(`props\\s*[?]?\\.\\s*${key}\\b|props\\s*\\[\\s*['"]${key}['"]`);
  if (read.test(code)) return true;

  // `const { a, key: alias, b } = props` — inclusive multilinha.
  for (const match of code.matchAll(/\{([^{}]*)\}\s*=\s*props\b/g)) {
    const names = match[1].split(',').map((part) => part.split(':')[0].trim());
    if (names.includes(key)) return true;
  }
  // `function Bloco({ props: { key } })` e afins.
  for (const match of code.matchAll(/props\s*:\s*\{([^{}]*)\}/g)) {
    const names = match[1].split(',').map((part) => part.split(':')[0].trim());
    if (names.includes(key)) return true;
  }
  return false;
}

const dirs = readdirSync(ROOT)
  .filter((entry) => statSync(join(ROOT, entry)).isDirectory())
  .filter((entry) => entry !== '__example')
  .sort();

const report = [];

for (const dir of dirs) {
  const manifestPath = join(ROOT, dir, 'manifest.ts');
  let manifest;
  try {
    manifest = readFileSync(manifestPath, 'utf8');
  } catch {
    continue;
  }
  const block = propsBlock(manifest);
  const kind = /kind:\s*'([a-z]+)'/.exec(manifest)?.[1] ?? '?';
  const shape = /shape:\s*'([a-z]+)'/.exec(manifest)?.[1] ?? null;
  const code = implSource(join(ROOT, dir));

  const props = topLevelKeys(block).map((key) => ({
    key,
    type: typeOf(block, key),
    values: enumOf(block, key),
    used: isUsed(code, key),
  }));

  report.push({ type: dir, kind, shape, props });
}

/** Rótulo humano de cada `kind` do manifesto. */
const KIND_LABEL = {
  chart: 'Gráfico',
  layout: 'Layout',
  text: 'Texto',
  title: 'Título',
  effect: 'Efeito',
};

/** Rótulo humano de cada `shape` do `dataContract`. */
const SHAPE_LABEL = {
  scalar: 'número único',
  series: 'série temporal',
  categorical: 'categorias',
  table: 'tabela',
};

/** O MAPA do catálogo, em Markdown — a entrega "listar todos os componentes". */
function markdown() {
  const out = [];
  out.push('# MAPA DO CATÁLOGO');
  out.push('');
  out.push('> **Arquivo gerado.** Não edite à mão:');
  out.push('> `node scripts/audit-catalog-props.mjs --markdown > docs/catalog/MAPA.md`');
  out.push('>');
  out.push(
    '> Um mapa escrito à mão mente na primeira mudança de manifesto — e o manifesto',
  );
  out.push('> é o contrato que o agente de IA lê para montar dashboards.');
  out.push('');

  const byKind = new Map();
  for (const entry of report) {
    const bucket = byKind.get(entry.kind) ?? [];
    bucket.push(entry);
    byKind.set(entry.kind, bucket);
  }

  const totalProps = report.reduce((sum, entry) => sum + entry.props.length, 0);
  out.push(`**${report.length} blocos · ${totalProps} propriedades declaradas**`);
  out.push('');
  for (const [kind, entries] of [...byKind].sort()) {
    out.push(
      `- **${KIND_LABEL[kind] ?? kind}** (${entries.length}): ${entries
        .map((e) => `\`${e.type}\``)
        .join(', ')}`,
    );
  }
  out.push('');

  for (const [kind, entries] of [...byKind].sort()) {
    out.push(`## ${KIND_LABEL[kind] ?? kind}`);
    out.push('');
    for (const entry of entries.sort((a, b) => a.type.localeCompare(b.type))) {
      const shape = entry.shape
        ? `consome **${SHAPE_LABEL[entry.shape] ?? entry.shape}**`
        : 'não consome dados';
      out.push(`### \`${entry.type}\``);
      out.push('');
      out.push(shape + '.');
      out.push('');
      if (entry.props.length === 0) {
        out.push('_Sem propriedades declaradas._');
        out.push('');
        continue;
      }
      out.push('| propriedade | tipo | valores aceitos | lida no código |');
      out.push('| --- | --- | --- | --- |');
      for (const prop of entry.props) {
        const values = prop.values ? prop.values.map((v) => `\`${v}\``).join(' · ') : '—';
        out.push(
          `| \`${prop.key}\` | ${prop.type} | ${values} | ${prop.used ? 'sim' : '**NÃO**'} |`,
        );
      }
      out.push('');
    }
  }

  out.push('---');
  out.push('');
  out.push('## Como este mapa é verificado');
  out.push('');
  out.push(
    'A coluna **lida no código** é análise estática: a chave é acessada a partir de',
  );
  out.push(
    '`props`? Ela pega a prop esquecida, mas não a prop que é lida e cai num ramo',
  );
  out.push('morto. Para essa — a que o usuário vê como "mudei e não aconteceu nada" —');
  out.push('existe o harness de render:');
  out.push('');
  out.push('```bash');
  out.push(
    'npx vitest run --config vite.config.ts src/shared/render-engine/catalog/__audit__',
  );
  out.push('```');
  out.push('');
  out.push(
    'Ele renderiza cada bloco com CADA valor de enum e compara o HTML: valores que',
  );
  out.push('produzem o mesmo desenho aparecem como `INERTE`.');
  return out.join('\n');
}

if (process.argv.includes('--markdown')) {
  console.log(markdown());
} else if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const suspects = [];
  let total = 0;
  for (const entry of report) {
    total += entry.props.length;
    const bad = entry.props.filter((prop) => !prop.used);
    if (bad.length) suspects.push(`${entry.type}: ${bad.map((p) => p.key).join(', ')}`);
  }
  console.log(`blocos: ${report.length} · props declaradas: ${total}`);
  console.log(`\nSUSPEITAS (declaradas no manifesto, ausentes do código):`);
  console.log(suspects.length ? suspects.map((s) => `  ${s}`).join('\n') : '  (nenhuma)');
  console.log(`\nENUMS a testar valor a valor:`);
  for (const entry of report) {
    for (const prop of entry.props) {
      if (prop.values) {
        console.log(`  ${entry.type}.${prop.key}: ${prop.values.join(' | ')}`);
      }
    }
  }
}
