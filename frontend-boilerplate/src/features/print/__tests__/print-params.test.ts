import { describe, it, expect } from 'vitest';
import { dashboardDataPayloadFixture } from '@dashboards/contracts';
import { parsePrintParams, allBlocksSettled } from '../lib/print-params';

describe('parsePrintParams', () => {
  it('extrai token, mode e filtros da query string', () => {
    const search = new URLSearchParams();
    search.set('token', 'abc.def.ghi');
    search.set('mode', 'published');
    search.set('filters', JSON.stringify({ f_periodo: '2026', f_situacao: 'ATIVA' }));

    const params = parsePrintParams(search);
    expect(params.token).toBe('abc.def.ghi');
    expect(params.mode).toBe('published');
    expect(params.filters).toEqual({ f_periodo: '2026', f_situacao: 'ATIVA' });
  });

  it('default mode = published e filtros = {} quando ausentes', () => {
    const params = parsePrintParams(new URLSearchParams());
    expect(params.token).toBeNull();
    expect(params.mode).toBe('published');
    expect(params.filters).toEqual({});
  });

  it('mode=draft é respeitado', () => {
    const search = new URLSearchParams('mode=draft');
    expect(parsePrintParams(search).mode).toBe('draft');
  });

  it('filtros com JSON inválido são ignorados (não quebra)', () => {
    const search = new URLSearchParams('filters=%7Bnot-json');
    expect(parsePrintParams(search).filters).toEqual({});
  });
});

describe('allBlocksSettled', () => {
  it('false quando não há payload', () => {
    expect(allBlocksSettled(undefined)).toBe(false);
  });

  it('true quando todos os blocos estão success/error', () => {
    const payload = {
      ...dashboardDataPayloadFixture,
      blocks: {
        a: { blockId: 'a', state: 'success' as const },
        b: { blockId: 'b', state: 'error' as const, error: { message: 'x' } },
      },
    };
    expect(allBlocksSettled(payload)).toBe(true);
  });

  it('false enquanto algum bloco está queued/running', () => {
    const payload = {
      ...dashboardDataPayloadFixture,
      blocks: {
        a: { blockId: 'a', state: 'success' as const },
        b: { blockId: 'b', state: 'queued' as const },
      },
    };
    expect(allBlocksSettled(payload)).toBe(false);
  });

  it('true quando o dashboard não tem blocos de dados (só narrativos)', () => {
    const payload = { ...dashboardDataPayloadFixture, blocks: {} };
    expect(allBlocksSettled(payload)).toBe(true);
  });
});
