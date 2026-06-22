import {
  assertReadOnlyQuery,
  SqlGuardError,
  stripCommentsAndStrings,
} from '@/lib/pg-runner/sql-guard';

describe('sql-guard — assertReadOnlyQuery', () => {
  describe('allows read-only queries', () => {
    const allowed = [
      'SELECT 1',
      'select * from users where id = $1',
      '  SELECT now()  ',
      'SELECT * FROM users; ', // terminador único é ok
      "WITH t AS (SELECT 1 AS n) SELECT * FROM t",
      '-- comentário\nSELECT id FROM accounts',
      '/* bloco */ SELECT id FROM accounts',
      "SELECT 'INSERT INTO x' AS literal_text", // keyword só dentro de string
      "SELECT ';' AS semicolon_in_string", // ; só dentro de string
      'SELECT created_at, updated_at FROM logs', // substrings de keywords
    ];
    it.each(allowed)('allows: %s', (sql) => {
      expect(() => assertReadOnlyQuery(sql)).not.toThrow();
      expect(assertReadOnlyQuery(sql)).toBe(sql); // retorna SQL original
    });
  });

  describe('blocks non-SELECT / DDL / DML', () => {
    const blocked = [
      'UPDATE users SET name = $1',
      'DELETE FROM users',
      'INSERT INTO users (id) VALUES (1)',
      'DROP TABLE users',
      'TRUNCATE users',
      'ALTER TABLE users ADD COLUMN x int',
      'CREATE TABLE x (id int)',
      'GRANT ALL ON users TO public',
      'SET statement_timeout = 0',
      'VACUUM',
      'COPY users TO STDOUT',
      'CALL my_proc()',
      'EXPLAIN ANALYZE SELECT 1', // não começa com SELECT/WITH
    ];
    it.each(blocked)('blocks: %s', (sql) => {
      expect(() => assertReadOnlyQuery(sql)).toThrow(SqlGuardError);
    });
  });

  describe('blocks multiple statements', () => {
    const multi = [
      'SELECT 1; SELECT 2',
      'SELECT 1; DROP TABLE users',
      'SELECT * FROM users; DELETE FROM users;',
      'SELECT 1;SELECT 2;',
    ];
    it.each(multi)('blocks multi-statement: %s', (sql) => {
      expect(() => assertReadOnlyQuery(sql)).toThrow(SqlGuardError);
    });
  });

  describe('blocks data-modifying CTEs', () => {
    const cteWrites = [
      'WITH x AS (INSERT INTO t VALUES (1) RETURNING *) SELECT * FROM x',
      'WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d',
      'WITH u AS (UPDATE t SET a = 1 RETURNING *) SELECT * FROM u',
    ];
    it.each(cteWrites)('blocks write-CTE: %s', (sql) => {
      expect(() => assertReadOnlyQuery(sql)).toThrow(SqlGuardError);
    });
  });

  describe('rejects empty / non-string input', () => {
    it('rejects empty string', () => {
      expect(() => assertReadOnlyQuery('   ')).toThrow(SqlGuardError);
    });
    it('rejects a query with only a comment', () => {
      expect(() => assertReadOnlyQuery('-- nada aqui')).toThrow(SqlGuardError);
    });
    it('rejects non-string', () => {
      expect(() => assertReadOnlyQuery(undefined as unknown as string)).toThrow(
        SqlGuardError
      );
    });
  });
});

describe('sql-guard — stripCommentsAndStrings', () => {
  it('removes line and block comments', () => {
    expect(stripCommentsAndStrings('SELECT 1 -- c\n, 2')).not.toContain('c');
    expect(stripCommentsAndStrings('SELECT /* x */ 1')).not.toContain('x');
  });

  it('blanks out string literal contents (incluindo ; e keywords)', () => {
    const out = stripCommentsAndStrings("SELECT 'a;b INSERT' AS c");
    expect(out).not.toContain(';');
    expect(out.toUpperCase()).not.toContain('INSERT');
  });

  it('handles escaped quotes inside strings', () => {
    const out = stripCommentsAndStrings("SELECT 'it''s; ok' AS c");
    expect(out).not.toContain(';');
  });
});
