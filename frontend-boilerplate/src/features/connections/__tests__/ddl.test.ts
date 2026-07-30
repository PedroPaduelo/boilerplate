import { describe, it, expect } from 'vitest';
import { buildSelectPreview, buildSqlPlaceholder } from '../lib/ddl';

/**
 * Geração de SQL por DIALETO.
 *
 * Estes testes existem por causa de um erro visto em produção: ao clicar numa
 * tabela de uma conexão SQL Server (banco tributário exposto por gateway), a
 * tela executava o preset e o banco respondia "Incorrect syntax near '50'" —
 * porque o preset era sempre `LIMIT 50`, que é dialeto Postgres. O usuário via
 * a tela abrir já quebrada, e a culpa parecia ser do gateway.
 */

describe('buildSelectPreview — dialeto por motor', () => {
  it('SQL Server usa TOP (LIMIT é sintaxe inválida lá)', () => {
    const sql = buildSelectPreview('sqlserver', 'dbo', 'TBContribuinte');

    expect(sql).toContain('SELECT TOP 50 *');
    expect(sql).not.toMatch(/\bLIMIT\b/);
    expect(sql).toContain('[dbo].[TBContribuinte]');
  });

  it('Postgres/MySQL/SQLite usam LIMIT', () => {
    for (const engine of ['postgresql', 'mysql', 'sqlite'] as const) {
      const sql = buildSelectPreview(engine, 'public', 'clientes');
      expect(sql).toContain('LIMIT 50');
      expect(sql).not.toContain('TOP 50');
    }
  });

  it('Oracle usa FETCH FIRST (não tem LIMIT nem TOP)', () => {
    const sql = buildSelectPreview('oracle', 'app', 'pedidos');

    expect(sql).toContain('FETCH FIRST 50 ROWS ONLY');
    expect(sql).not.toMatch(/\bLIMIT\b/);
  });

  it('CITA identificadores — tabela com espaço/acento não pode quebrar', () => {
    // Caso real do banco tributário: `SELIC_SERIE HISTÓRICA`. Sem colchetes o
    // SQL Server lê até o espaço e responde "Invalid object name
    // 'dbo.SELIC_SERIE'".
    const sql = buildSelectPreview('sqlserver', 'dbo', 'SELIC_SERIE HISTÓRICA');
    expect(sql).toContain('[dbo].[SELIC_SERIE HISTÓRICA]');

    const pg = buildSelectPreview('postgresql', 'public', 'minha tabela');
    expect(pg).toContain('"public"."minha tabela"');
  });

  it('escapa o delimitador dentro do próprio identificador', () => {
    // Nome malicioso/estranho não pode escapar da citação.
    expect(buildSelectPreview('sqlserver', 'dbo', 'a]b')).toContain('[a]]b]');
    expect(buildSelectPreview('postgresql', 'public', 'a"b')).toContain('"a""b"');
  });
});

describe('buildSqlPlaceholder — a primeira pista de sintaxe', () => {
  it('sugere TOP no SQL Server e LIMIT no Postgres', () => {
    expect(buildSqlPlaceholder('sqlserver')).toContain('SELECT TOP 50');
    expect(buildSqlPlaceholder('sqlserver')).not.toMatch(/\bLIMIT\b/);
    expect(buildSqlPlaceholder('postgresql')).toContain('LIMIT 50');
  });
});
