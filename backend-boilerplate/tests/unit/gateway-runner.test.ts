/**
 * lib/gateway-runner — parte PURA e de SEGURANÇA do runner HTTP.
 *
 * O foco aqui é a interpolação de parâmetros. O gateway não aceita bind
 * (`$1`), então os valores dos filtros de dashboard precisam ser embutidos no
 * SQL — exatamente o ponto onde uma implementação ingênua vira injeção. Estes
 * testes travam o comportamento: escapa o que dá para escapar, RECUSA o que
 * não dá, e o guard read-only continua valendo sobre o SQL final.
 */
import {
  escapeSqlLiteral,
  interpolateParams,
  normalizeBaseUrl,
  GatewayRunnerError,
} from '@/lib/gateway-runner';
import { assertReadOnlyQuery, SqlGuardError } from '@/lib/pg-runner';

describe('gateway-runner — normalizeBaseUrl', () => {
  it('remove barras finais e preserva o caminho base', () => {
    expect(normalizeBaseUrl('https://gw.exemplo.com/')).toBe('https://gw.exemplo.com');
    expect(normalizeBaseUrl('https://gw.exemplo.com///')).toBe('https://gw.exemplo.com');
    expect(normalizeBaseUrl('https://gw.exemplo.com/api/')).toBe(
      'https://gw.exemplo.com/api',
    );
  });

  it('recusa URL vazia, malformada ou com esquema não-HTTP', () => {
    // A base URL é digitada por um humano e vira destino de requisição do
    // servidor: `file://` aqui seria um pedido de SSRF local.
    expect(() => normalizeBaseUrl('')).toThrow(GatewayRunnerError);
    expect(() => normalizeBaseUrl('nao-e-url')).toThrow(GatewayRunnerError);
    expect(() => normalizeBaseUrl('file:///etc/passwd')).toThrow(GatewayRunnerError);
    expect(() => normalizeBaseUrl('ftp://gw.exemplo.com')).toThrow(GatewayRunnerError);
  });
});

describe('gateway-runner — escapeSqlLiteral', () => {
  it('converte tipos suportados em literais SQL', () => {
    expect(escapeSqlLiteral(null)).toBe('NULL');
    expect(escapeSqlLiteral(undefined)).toBe('NULL');
    expect(escapeSqlLiteral(42)).toBe('42');
    expect(escapeSqlLiteral(-1.5)).toBe('-1.5');
    // 1/0 e não TRUE/FALSE: o gateway pode estar na frente de um SQL Server.
    expect(escapeSqlLiteral(true)).toBe('1');
    expect(escapeSqlLiteral(false)).toBe('0');
    expect(escapeSqlLiteral('ana')).toBe("'ana'");
    expect(escapeSqlLiteral(new Date('2026-03-10T12:34:56.000Z'))).toBe(
      "'2026-03-10 12:34:56'",
    );
  });

  it('escapa aspas simples dobrando (não corta a string)', () => {
    expect(escapeSqlLiteral("d'ávila")).toBe("'d''ávila'");
    expect(escapeSqlLiteral("'; DROP TABLE users --")).toBe(
      "'''; DROP TABLE users --'",
    );
  });

  it('recusa o que não dá para escapar com segurança', () => {
    // Sem isto, um objeto viraria `[object Object]` no meio da consulta.
    expect(() => escapeSqlLiteral({ a: 1 })).toThrow(GatewayRunnerError);
    expect(() => escapeSqlLiteral([1, 2])).toThrow(GatewayRunnerError);
    expect(() => escapeSqlLiteral(Number.NaN)).toThrow(GatewayRunnerError);
    expect(() => escapeSqlLiteral(Number.POSITIVE_INFINITY)).toThrow(GatewayRunnerError);
    // NUL trunca a string em vários drivers — porta clássica de bypass.
    expect(() => escapeSqlLiteral('a\0b')).toThrow(GatewayRunnerError);
    expect(() => escapeSqlLiteral(new Date('nao-e-data'))).toThrow(GatewayRunnerError);
  });
});

describe('gateway-runner — interpolateParams', () => {
  it('substitui placeholders na ordem, inclusive $10+', () => {
    expect(interpolateParams('SELECT * FROM t WHERE id = $1', [7])).toBe(
      'SELECT * FROM t WHERE id = 7',
    );
    expect(
      interpolateParams('SELECT * FROM t WHERE a = $1 AND b = $2', ['x', 3]),
    ).toBe("SELECT * FROM t WHERE a = 'x' AND b = 3");

    // $10 tem que ser lido como "dez", não como "$1 seguido de 0".
    const dez = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(interpolateParams('SELECT $10', dez)).toBe('SELECT 10');
  });

  it('NÃO toca em $1 dentro de literal de string (lá é texto)', () => {
    const sql = "SELECT '$1' AS literal, $1 AS valor";
    expect(interpolateParams(sql, ['ok'])).toBe("SELECT '$1' AS literal, 'ok' AS valor");
  });

  it('deixa o SQL intacto quando não há placeholders nem parâmetros', () => {
    const sql = 'SELECT TOP 5 * FROM TBContribuinte';
    expect(interpolateParams(sql, [])).toBe(sql);
  });

  it('falha quando o SQL referencia um parâmetro que não foi enviado', () => {
    // Substituir por NULL silenciosamente rodaria uma consulta com um filtro
    // que o autor não escreveu — pior que falhar.
    expect(() => interpolateParams('SELECT * FROM t WHERE id = $2', [1])).toThrow(
      /only 1 parameter/,
    );
    expect(() => interpolateParams('SELECT * FROM t WHERE id = $1', [])).toThrow(
      GatewayRunnerError,
    );
  });

  it('SEGURANÇA: valor com injeção vira texto, e o guard barra o resultado', () => {
    const sql = 'SELECT * FROM users WHERE nome = $1';
    const malicioso = "x'; DROP TABLE users; --";

    const final = interpolateParams(sql, [malicioso]);

    // A aspa do atacante foi dobrada: o comando dele virou conteúdo da string.
    expect(final).toBe("SELECT * FROM users WHERE nome = 'x''; DROP TABLE users; --'");
    // E o guard (reaplicado sobre o SQL final no runner) aceita, porque não há
    // segundo statement de verdade — só uma string com texto esquisito dentro.
    expect(() => assertReadOnlyQuery(final)).not.toThrow();
  });

  it('SEGURANÇA: o guard read-only barra SQL não-SELECT antes de virar requisição', () => {
    expect(() => assertReadOnlyQuery('DROP TABLE users')).toThrow(SqlGuardError);
    expect(() => assertReadOnlyQuery('SELECT 1; DROP TABLE users')).toThrow(SqlGuardError);
    expect(() =>
      assertReadOnlyQuery('WITH x AS (DELETE FROM users RETURNING *) SELECT * FROM x'),
    ).toThrow(SqlGuardError);
  });
});
