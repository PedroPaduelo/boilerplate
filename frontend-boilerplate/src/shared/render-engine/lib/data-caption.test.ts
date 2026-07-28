/**
 * O recorte do dado — e, principalmente, o que ele se RECUSA a afirmar.
 *
 * Um card sem contexto é ruim; um card com contexto errado é pior, porque
 * ninguém desconfia de uma legenda. Por isso a maioria destes testes verifica
 * silêncio: sem eixo temporal não há período, sem dado não há recorte.
 */
import { describe, expect, it } from 'vitest';
import type { BlockDataResult } from '@dashboards/contracts';
import { describeDataScope } from './data-caption';

/** Monta um resultado de sucesso como o backend o entrega. */
function success(data: unknown, meta?: Record<string, unknown>): BlockDataResult {
  return { state: 'success', data, meta } as unknown as BlockDataResult;
}

describe('recorte do dado (legenda do card)', () => {
  it('deriva o período do eixo temporal, em qualquer ordem', () => {
    // A consulta pode vir decrescente — o recorte é do menor ao maior.
    const scope = describeDataScope({
      result: success([
        { x: '2026-07-28', y: 34 },
        { x: '2026-07-18', y: 3 },
        { x: '2026-07-27', y: 1214 },
      ]),
    });

    expect(scope).toContain('18/07 a 28/07');
  });

  it('não desloca a data por fuso horário', () => {
    // `new Date('2026-07-18')` é meia-noite UTC e viraria 17/07 em pt-BR.
    const scope = describeDataScope({
      result: success([
        { x: '2026-07-18', y: 1 },
        { x: '2026-07-19', y: 2 },
      ]),
    });

    expect(scope).toContain('18/07 a 19/07');
    expect(scope).not.toContain('17/07');
  });

  it('aceita o eixo já formatado em PT-BR pela consulta', () => {
    const scope = describeDataScope({
      result: success([
        { x: '28/07', y: 34 },
        { x: '22/07', y: 900 },
      ]),
    });

    expect(scope).toContain('22/07 a 28/07');
  });

  it('NÃO inventa período quando o eixo é categórico', () => {
    const scope = describeDataScope({
      result: success([
        { x: 'contacts', y: 7 },
        { x: 'call_permission_request', y: 9 },
      ]),
    });

    expect(scope).toBe('2 categorias');
  });

  it('não declara período quando só parte do eixo parece data', () => {
    const scope = describeDataScope({
      result: success([
        { x: '2026-07-18', y: 1 },
        { x: 'sem data', y: 2 },
      ]),
    });

    expect(scope).not.toContain('a 18/07');
    expect(scope).toBe('2 categorias');
  });

  it('conta categorias em dado categórico', () => {
    const scope = describeDataScope({
      result: success([
        { label: 'received', value: 3992 },
        { label: 'read', value: 44 },
        { label: 'sent', value: 54 },
      ]),
    });

    expect(scope).toBe('3 categorias');
  });

  it('anuncia múltiplas séries e não conta o mesmo dia duas vezes', () => {
    const scope = describeDataScope({
      result: success([
        { x: '2026-07-18', y: 3, series: 'Recebidas' },
        { x: '2026-07-18', y: 2, series: 'Enviadas' },
        { x: '2026-07-19', y: 5, series: 'Recebidas' },
        { x: '2026-07-19', y: 1, series: 'Enviadas' },
      ]),
    });

    expect(scope).toBe('18/07 a 19/07 · 2 séries');
  });

  it('declara a unidade só quando ela informa algo', () => {
    const data = [{ label: 'IPTU', value: 4200 }];

    expect(
      describeDataScope({ result: success(data), props: { valueFormat: 'BRL' } }),
    ).toBe('1 categoria · valores em R$');
    // Contagem não ganha "valores em números": seria ruído.
    expect(
      describeDataScope({ result: success(data), props: { valueFormat: 'number' } }),
    ).toBe('1 categoria');
  });

  it('avisa quando a amostra foi truncada — isso muda a leitura do número', () => {
    const scope = describeDataScope({
      result: success([{ label: 'a', value: 1 }], { truncated: true, rowCount: 5000 }),
    });

    expect(scope).toContain('amostra truncada');
  });

  it('avisa quando o dado veio do cache', () => {
    const scope = describeDataScope({
      result: success([{ label: 'a', value: 1 }], { cached: true }),
    });

    expect(scope).toContain('do cache');
  });

  it('escalar não ganha volume — é UM número', () => {
    expect(
      describeDataScope({ result: success({ value: 4090, label: 'Total' }) }),
    ).toBeUndefined();
  });

  it('cala a boca quando não há o que afirmar', () => {
    expect(describeDataScope({})).toBeUndefined();
    expect(describeDataScope({ result: success([]) })).toBeUndefined();
    expect(
      describeDataScope({
        result: { state: 'running' } as unknown as BlockDataResult,
      }),
    ).toBeUndefined();
  });
});
