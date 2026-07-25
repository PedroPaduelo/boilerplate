/**
 * Tokenizador do DDL exibido no explorador de schema.
 *
 * POR QUE PRÓPRIO, E NÃO SHIKI/PRISM/HIGHLIGHT.JS:
 * o DDL não é código arbitrário do usuário — é gerado pelo próprio app
 * (`buildCreateTable`), num subconjunto pequeno e previsível: CREATE TABLE,
 * CONSTRAINT, PRIMARY/FOREIGN KEY, REFERENCES, NOT NULL, DEFAULT, tipos,
 * identificadores citados e literais. Cobrir isso custa poucas dezenas de
 * linhas; a lib mais leve do ramo custaria centenas de KB no bundle para o
 * mesmo resultado, e o projeto hoje não tem nenhuma dependência de realce.
 *
 * Devolve DADOS, não HTML: os identificadores vêm do banco do usuário, então
 * quem renderiza usa elementos React e o escape acontece por construção —
 * nunca `dangerouslySetInnerHTML`.
 */

/** Palavras reservadas que aparecem no DDL gerado. */
const KEYWORDS = new Set([
  'CREATE',
  'TABLE',
  'VIEW',
  'INDEX',
  'CONSTRAINT',
  'PRIMARY',
  'FOREIGN',
  'KEY',
  'REFERENCES',
  'NOT',
  'NULL',
  'DEFAULT',
  'ON',
  'DELETE',
  'UPDATE',
  'CASCADE',
  'RESTRICT',
  'NO',
  'ACTION',
  'SET',
  'UNIQUE',
  'CHECK',
  'AND',
  'OR',
]);

export type SqlTokenKind =
  | 'keyword'
  | 'identifier'
  | 'type'
  | 'string'
  | 'number'
  | 'function'
  | 'punctuation'
  | 'plain';

export interface SqlToken {
  text: string;
  kind: SqlTokenKind;
}

/**
 * Ordem das alternativas importa: literais citados vêm primeiro, para que um
 * identificador contendo espaço ou palavra reservada (ex.: `"primary key"`)
 * não seja quebrado em pedaços.
 */
const PATTERN = new RegExp(
  [
    '"(?:[^"]|"")*"', // identificador com aspas duplas (PG/MySQL/SQLite/Oracle)
    '\\[(?:[^\\]]|\\]\\])*\\]', // identificador entre colchetes (SQL Server)
    '`(?:[^`])*`', // identificador com crase (MySQL)
    "'(?:[^']|'')*'", // literal de texto
    '--[^\\n]*', // comentário de linha
    '\\b\\d+(?:\\.\\d+)?\\b', // número
    '[A-Za-z_][A-Za-z0-9_]*', // palavra (reservada, tipo ou função)
    '[(),;]', // pontuação
    '\\s+', // espaços (preservados)
  ].join('|'),
  'g',
);

/** Quebra o DDL em tokens classificados, preservando o texto integralmente. */
export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  const push = (text: string, kind: SqlTokenKind) => {
    // Junta tokens vizinhos do mesmo tipo: menos nós no DOM.
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) last.text += text;
    else tokens.push({ text, kind });
  };

  let cursor = 0;
  for (const match of sql.matchAll(PATTERN)) {
    const text = match[0];
    const start = match.index ?? 0;
    // Qualquer coisa que o padrão não reconheceu sai como texto puro.
    if (start > cursor) push(sql.slice(cursor, start), 'plain');
    cursor = start + text.length;

    const first = text[0];
    if (first === '"' || first === '[' || first === '`') push(text, 'identifier');
    else if (first === "'") push(text, 'string');
    else if (text.startsWith('--')) push(text, 'plain');
    else if (/^\d/.test(text)) push(text, 'number');
    else if (/^[A-Za-z_]/.test(text)) {
      if (KEYWORDS.has(text.toUpperCase())) push(text, 'keyword');
      // Palavra colada num "(" é chamada de função (ex.: gen_random_uuid()).
      else if (sql[cursor] === '(') push(text, 'function');
      // Sobra o que descreve o tipo da coluna (uuid, timestamp, varying...).
      else push(text, 'type');
    } else if (/^[(),;]$/.test(text)) push(text, 'punctuation');
    else push(text, 'plain');
  }
  if (cursor < sql.length) push(sql.slice(cursor), 'plain');
  return tokens;
}
