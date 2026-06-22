/**
 * Unit — helpers de cache/chave do módulo `data` (T-C): determinismo da
 * cacheKey (anti-stampede depende disso), resolução posicional de params e TTL.
 */
import {
  computeCacheKey,
  effectiveTtl,
  publishedLayoutCacheKey,
  resolveParamsValues,
  DATA_CACHE_PREFIX,
  DEFAULT_DATA_TTL_SECONDS,
} from '@/modules/data/cache';

describe('data/cache — computeCacheKey', () => {
  it('é determinística para os mesmos conn/sql/params', () => {
    const a = computeCacheKey('conn1', 'SELECT 1', [2026, 'BRL']);
    const b = computeCacheKey('conn1', 'SELECT 1', [2026, 'BRL']);
    expect(a).toBe(b);
    expect(a.startsWith(DATA_CACHE_PREFIX)).toBe(true);
  });

  it('muda quando o valor de um parâmetro muda', () => {
    const a = computeCacheKey('conn1', 'SELECT 1', [2026]);
    const b = computeCacheKey('conn1', 'SELECT 1', [2025]);
    expect(a).not.toBe(b);
  });

  it('muda quando a conexão ou a SQL mudam', () => {
    expect(computeCacheKey('connA', 'SELECT 1', [])).not.toBe(
      computeCacheKey('connB', 'SELECT 1', []),
    );
    expect(computeCacheKey('connA', 'SELECT 1', [])).not.toBe(
      computeCacheKey('connA', 'SELECT 2', []),
    );
  });
});

describe('data/cache — resolveParamsValues', () => {
  it('resolve valores na ORDEM posicional dos params (independe da ordem das chaves do filtro)', () => {
    const params = [
      { filterId: 'f_periodo', as: 'periodo' },
      { filterId: 'f_uf', as: 'uf' },
    ];
    const values1 = resolveParamsValues(params, { f_uf: 'SP', f_periodo: 2026 });
    const values2 = resolveParamsValues(params, { f_periodo: 2026, f_uf: 'SP' });
    expect(values1).toEqual([2026, 'SP']);
    expect(values2).toEqual([2026, 'SP']);
    // ⇒ a cacheKey resultante é idêntica (anti-stampede mesmo com ordem diferente)
    expect(computeCacheKey('c', 'q', values1)).toBe(computeCacheKey('c', 'q', values2));
  });

  it('filtro ausente vira null', () => {
    const params = [{ filterId: 'f_x', as: 'x' }];
    expect(resolveParamsValues(params, {})).toEqual([null]);
  });

  it('sem params → array vazio', () => {
    expect(resolveParamsValues(undefined, { a: 1 })).toEqual([]);
    expect(resolveParamsValues([], { a: 1 })).toEqual([]);
  });
});

describe('data/cache — effectiveTtl & layout key', () => {
  it('usa o TTL do bloco quando declarado', () => {
    expect(effectiveTtl({ ttlSeconds: 3600 })).toBe(3600);
  });
  it('cai no default quando ausente', () => {
    expect(effectiveTtl({ ttlSeconds: undefined })).toBe(DEFAULT_DATA_TTL_SECONDS);
  });
  it('TTL <= 0 (tempo real) é preservado como 0', () => {
    expect(effectiveTtl({ ttlSeconds: 0 })).toBe(0);
    expect(effectiveTtl({ ttlSeconds: -5 })).toBe(0);
  });
  it('layout key segue a convenção dash:{id}:published (compartilhada com T-B3)', () => {
    expect(publishedLayoutCacheKey('d1')).toBe('dash:d1:published');
  });
});
