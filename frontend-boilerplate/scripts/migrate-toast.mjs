/**
 * Migra `toast` (sonner) → `useAppToast()` (Astryx).
 *
 * Para cada arquivo que importa sonner:
 *  1. troca o import;
 *  2. insere `const toast = useAppToast();` no topo de cada função React
 *     (hook `useX` ou componente `PascalCase`) cujo corpo usa `toast.`.
 *
 * O typecheck é a rede de segurança: se alguma ocorrência ficar fora de escopo,
 * `toast` vira identificador não declarado e o tsc acusa.
 */
import fs from 'node:fs';

const files = process.argv.slice(2);

/** Acha o índice do `}` que fecha o bloco aberto em `open`. */
function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (!/from 'sonner'/.test(src)) continue;

  src = src.replace(
    /import \{ toast \} from 'sonner';\n/,
    "import { useAppToast } from '@/shared/hooks/use-app-toast';\n",
  );

  // Funções de primeiro nível: `export function Nome(` ou `function Nome(`.
  const fnRe = /^(export\s+)?function\s+([A-Za-z0-9_]+)\s*[(<]/gm;
  const insertions = [];
  let m;
  while ((m = fnRe.exec(src))) {
    const name = m[2];
    const isReactFn = /^use[A-Z]/.test(name) || /^[A-Z]/.test(name);
    if (!isReactFn) continue;

    const bodyStart = src.indexOf('{', fnRe.lastIndex - 1);
    if (bodyStart === -1) continue;
    const bodyEnd = matchBrace(src, bodyStart);
    if (bodyEnd === -1) continue;

    const body = src.slice(bodyStart, bodyEnd);
    if (!/\btoast\.(success|error|info)\b/.test(body)) continue;
    // Já declarado dentro (evita duplicar em funções aninhadas já tratadas).
    if (/const toast = useAppToast\(\);/.test(body)) continue;

    insertions.push(bodyStart + 1);
  }

  // Aplica de trás pra frente para não invalidar os índices.
  for (const at of insertions.reverse()) {
    src = src.slice(0, at) + '\n  const toast = useAppToast();' + src.slice(at);
  }

  fs.writeFileSync(file, src);
  console.log(`✓ ${file} (${insertions.length} hooks/componentes)`);
}
