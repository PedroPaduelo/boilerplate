/**
 * Tokenizer SQL para o `CodeBlock` do design system.
 *
 * POR QUE ISTO EXISTE: o tokenizer embutido do `@astryxdesign/core` cobre
 * bash, css, html, javascript, json, jsx, python, tsx e typescript — **SQL não
 * está na lista**. Passar `language="sql"` não quebra, só não pinta nada: o
 * DDL saía como texto cru. O próprio componente prevê o caso com a prop
 * `tokenizer` ("Custom tokenizer override for unsupported languages"), que é o
 * caminho suportado — nada de reimplementar o CodeBlock.
 *
 * Contrato: recebe o código e devolve tokens com offsets ABSOLUTOS; o DS
 * converte para offsets por linha (`flatTokensToLines`). Os `type` precisam ser
 * os que o tema de sintaxe conhece: keyword, type, string, comment, number,
 * property, operator, punctuation. Token de cor padrão pode ser omitido.
 *
 * Função PURA, sem React — mesma pegada de `ddl.ts`, e testável isoladamente.
 */

export interface SqlToken {
  type: string;
  start: number;
  end: number;
}

/** Palavras reservadas (DDL + SELECT read-only, que é o que esta tela gera). */
const KEYWORDS = new Set([
  'add',
  'all',
  'alter',
  'and',
  'any',
  'as',
  'asc',
  'begin',
  'between',
  'by',
  'cascade',
  'case',
  'check',
  'column',
  'commit',
  'constraint',
  'create',
  'cross',
  'default',
  'delete',
  'desc',
  'distinct',
  'drop',
  'else',
  'end',
  'exists',
  'false',
  'foreign',
  'from',
  'full',
  'group',
  'having',
  'in',
  'index',
  'inner',
  'insert',
  'into',
  'is',
  'join',
  'key',
  'left',
  'like',
  'limit',
  'not',
  'null',
  'nulls',
  'offset',
  'on',
  'or',
  'order',
  'outer',
  'primary',
  'references',
  'restrict',
  'right',
  'rollback',
  'select',
  'set',
  'table',
  'then',
  'true',
  'union',
  'unique',
  'update',
  'using',
  'values',
  'view',
  'when',
  'where',
  'with',
  'action',
  'no',
]);

/** Tipos de dado — cor distinta da de palavra reservada ajuda a ler o DDL. */
const TYPES = new Set([
  'bigint',
  'bigserial',
  'bit',
  'boolean',
  'bytea',
  'char',
  'character',
  'date',
  'decimal',
  'double',
  'float',
  'inet',
  'int',
  'integer',
  'interval',
  'json',
  'jsonb',
  'money',
  'numeric',
  'precision',
  'real',
  'serial',
  'smallint',
  'text',
  'time',
  'timestamp',
  'timestamptz',
  'uuid',
  'varchar',
  'varying',
  'xml',
  'zone',
]);

const PUNCTUATION = '(),;.[]';
const OPERATOR_CHARS = '=<>+-*/%|&!~';

const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
const isDigit = (c: string) => c >= '0' && c <= '9';
const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdentPart = (c: string) => /[A-Za-z0-9_$]/.test(c);

/**
 * Tokeniza SQL num único passo linear.
 *
 * A assinatura aceita o segundo parâmetro `language` só para casar com o tipo
 * que o `CodeBlock` espera — este tokenizer é sempre SQL.
 */
export function tokenizeSql(code: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  const n = code.length;
  let i = 0;

  while (i < n) {
    const ch = code[i];

    if (isSpace(ch)) {
      i += 1;
      continue;
    }

    // Comentário de linha: -- até o fim da linha.
    if (ch === '-' && code[i + 1] === '-') {
      const start = i;
      while (i < n && code[i] !== '\n') i += 1;
      tokens.push({ type: 'comment', start, end: i });
      continue;
    }

    // Comentário de bloco: /* … */ (tolera não fechado até o fim).
    if (ch === '/' && code[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
      i = Math.min(n, i + 2);
      tokens.push({ type: 'comment', start, end: i });
      continue;
    }

    // Literal de texto: '…' com '' como escape interno.
    if (ch === "'") {
      const start = i;
      i += 1;
      while (i < n) {
        if (code[i] === "'") {
          if (code[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      tokens.push({ type: 'string', start, end: i });
      continue;
    }

    // Identificador citado: "…". Cor PRÓPRIA (property), não de string — no
    // DDL gerado tabela e todas as colunas vêm citadas, e pintá-las como texto
    // deixaria o bloco inteiro de uma cor só.
    if (ch === '"') {
      const start = i;
      i += 1;
      while (i < n) {
        if (code[i] === '"') {
          if (code[i + 1] === '"') {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      tokens.push({ type: 'property', start, end: i });
      continue;
    }

    if (isDigit(ch)) {
      const start = i;
      while (i < n && (isDigit(code[i]) || code[i] === '.')) i += 1;
      tokens.push({ type: 'number', start, end: i });
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      while (i < n && isIdentPart(code[i])) i += 1;
      const word = code.slice(start, i).toLowerCase();
      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', start, end: i });
      } else if (TYPES.has(word)) {
        tokens.push({ type: 'type', start, end: i });
      }
      // Identificador comum fica na cor padrão — o DS omite esses tokens.
      continue;
    }

    if (PUNCTUATION.includes(ch)) {
      tokens.push({ type: 'punctuation', start: i, end: i + 1 });
      i += 1;
      continue;
    }

    if (OPERATOR_CHARS.includes(ch)) {
      const start = i;
      while (i < n && OPERATOR_CHARS.includes(code[i])) i += 1;
      tokens.push({ type: 'operator', start, end: i });
      continue;
    }

    i += 1;
  }

  return tokens;
}
