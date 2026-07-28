import { describe, it, expect } from 'vitest';
import { tokenizeSql } from '../sql-tokenize';

/**
 * O tokenizer existe porque o `CodeBlock` do DS não conhece SQL — sem ele o
 * DDL renderiza como texto cru. Estes testes travam o contrato com o
 * componente: tipos de token que o tema de sintaxe entende e offsets
 * ABSOLUTOS válidos (o DS converte para offsets por linha).
 */
const typeAt = (sql: string, word: string) => {
  const start = sql.indexOf(word);
  return tokenizeSql(sql).find((t) => t.start === start && t.end === start + word.length)
    ?.type;
};

describe('tokenizeSql', () => {
  it('classifica palavra reservada, tipo e identificador citado', () => {
    const sql = 'CREATE TABLE "public"."users" ("id" uuid NOT NULL);';

    expect(typeAt(sql, 'CREATE')).toBe('keyword');
    expect(typeAt(sql, 'TABLE')).toBe('keyword');
    expect(typeAt(sql, 'uuid')).toBe('type');
    // Identificador citado tem cor própria: no DDL gerado TUDO é citado, e
    // pintá-los como string deixaria o bloco inteiro de uma cor só.
    expect(typeAt(sql, '"public"')).toBe('property');
    expect(typeAt(sql, '"id"')).toBe('property');
  });

  it('reconhece literal de texto, número e comentário', () => {
    const sql = "-- nota\nSELECT 42, 'texto' FROM t;";

    expect(typeAt(sql, '-- nota')).toBe('comment');
    expect(typeAt(sql, '42')).toBe('number');
    expect(typeAt(sql, "'texto'")).toBe('string');
  });

  it('não se perde com aspas escapadas dentro do literal', () => {
    const sql = "SELECT 'O''Brien' AS nome;";
    const tokens = tokenizeSql(sql);
    const str = tokens.find((t) => t.type === 'string');

    expect(sql.slice(str!.start, str!.end)).toBe("'O''Brien'");
    // O que vem depois continua sendo lido como SQL, não como texto.
    expect(typeAt(sql, 'AS')).toBe('keyword');
  });

  it('devolve offsets absolutos válidos e ordenados', () => {
    const sql = 'SELECT *\nFROM public.contacts\nLIMIT 50;';
    const tokens = tokenizeSql(sql);

    expect(tokens.length).toBeGreaterThan(0);
    let previousEnd = 0;
    for (const token of tokens) {
      expect(token.start).toBeGreaterThanOrEqual(previousEnd);
      expect(token.end).toBeGreaterThan(token.start);
      expect(token.end).toBeLessThanOrEqual(sql.length);
      previousEnd = token.end;
    }
  });

  it('termina mesmo com comentário de bloco não fechado', () => {
    const sql = 'SELECT 1 /* comentário sem fim';
    const tokens = tokenizeSql(sql);

    expect(tokens.at(-1)?.type).toBe('comment');
    expect(tokens.at(-1)?.end).toBe(sql.length);
  });
});
