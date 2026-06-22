/**
 * sql-guard — guardrails de SQL para o pg-runner.
 *
 * Defesa em profundidade (a barreira primária é o usuário de banco read-only +
 * `SET TRANSACTION READ ONLY`). Aqui rejeitamos, ANTES de enviar ao Postgres:
 *   - statements que não comecem com SELECT ou WITH;
 *   - múltiplos statements (`;` no meio da query);
 *   - palavras-chave de escrita/DDL (INSERT/UPDATE/DELETE/DROP/...), inclusive
 *     dentro de CTEs data-modifying (`WITH x AS (INSERT ...)`).
 *
 * A validação ignora comentários e literais de string para evitar tanto
 * falso-positivo (palavra dentro de string) quanto bypass (`;` dentro de string).
 */

/** Erro de violação de guardrail de SQL. */
export class SqlGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SqlGuardError';
  }
}

// Palavras-chave proibidas (escrita / DDL / comandos de sessão / utilitários).
// Casadas como palavra inteira (\b...\b), sobre o SQL já sem comentários/strings.
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'MERGE',
  'UPSERT',
  'DROP',
  'CREATE',
  'ALTER',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'COMMENT',
  'REINDEX',
  'VACUUM',
  'CLUSTER',
  'COPY',
  'CALL',
  'DO',
  'EXECUTE',
  'PREPARE',
  'DEALLOCATE',
  'LISTEN',
  'NOTIFY',
  'UNLISTEN',
  'LOCK',
  'SET',
  'RESET',
  'REFRESH',
  'SECURITY',
  'DISCARD',
  'CHECKPOINT',
];

const FORBIDDEN_REGEX = new RegExp(`\\b(?:${FORBIDDEN_KEYWORDS.join('|')})\\b`, 'i');

/**
 * Remove comentários (`-- ...` e `/* ... *\/`) e o CONTEÚDO de literais de
 * string (`'...'` e `"..."`), substituindo os literais por aspas vazias para
 * preservar a estrutura sintática. Não é um parser completo de SQL — é
 * suficiente para os guardrails de uma ferramenta de preview read-only.
 */
export function stripCommentsAndStrings(sql: string): string {
  let out = '';
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const c = sql[i];
    const c2 = sql[i + 1];

    // comentário de linha
    if (c === '-' && c2 === '-') {
      i += 2;
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }

    // comentário de bloco
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      out += ' ';
      continue;
    }

    // string com aspas simples (com escape '' duplicado)
    if (c === "'") {
      i++;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (sql[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      out += "''";
      continue;
    }

    // identificador entre aspas duplas (com escape "" duplicado)
    if (c === '"') {
      i++;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          i += 2;
          continue;
        }
        if (sql[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      out += '""';
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

/**
 * Valida que `sql` é uma única query read-only (SELECT/WITH). Lança
 * `SqlGuardError` em caso de violação. Retorna a query original (inalterada)
 * quando válida — a execução usa o SQL original (com strings intactas).
 */
export function assertReadOnlyQuery(sql: string): string {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new SqlGuardError('query must be a non-empty string');
  }

  const sanitized = stripCommentsAndStrings(sql);

  // remove ; finais (e espaços) — um único statement pode terminar com ;
  let trimmed = sanitized.trim();
  trimmed = trimmed.replace(/;+\s*$/, '').trim();

  if (trimmed.length === 0) {
    throw new SqlGuardError('empty query after removing comments');
  }

  // múltiplos statements: qualquer ; restante após remover o terminador final
  if (trimmed.includes(';')) {
    throw new SqlGuardError('multiple statements are not allowed');
  }

  // deve começar com SELECT ou WITH
  if (!/^(?:select|with)\b/i.test(trimmed)) {
    throw new SqlGuardError('only SELECT/WITH (read-only) queries are allowed');
  }

  // nenhuma palavra-chave de escrita/DDL (cobre CTEs data-modifying)
  const forbidden = trimmed.match(FORBIDDEN_REGEX);
  if (forbidden) {
    throw new SqlGuardError(
      `forbidden keyword in query: ${forbidden[0].toUpperCase()}`
    );
  }

  return sql;
}
