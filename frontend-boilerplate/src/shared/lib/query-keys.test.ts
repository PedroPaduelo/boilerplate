import { describe, it, expect } from 'vitest';
import { queryKeys, hashFilters } from './query-keys';

describe('query-keys', () => {
  it('hashFilters é determinístico independente da ordem das chaves', () => {
    expect(hashFilters({ a: 1, b: 2 })).toBe(hashFilters({ b: 2, a: 1 }));
  });

  it('hashFilters distingue valores diferentes', () => {
    expect(hashFilters({ depto: 'rh' })).not.toBe(hashFilters({ depto: 'ti' }));
  });

  it('hashFilters trata vazio/nulo de forma estável', () => {
    expect(hashFilters()).toBe('∅');
    expect(hashFilters(null)).toBe('∅');
    expect(hashFilters({})).toBe('∅');
  });

  it('chaves seguem a forma do doc 32', () => {
    expect(queryKeys.dashboards.detail('d1', 'published')).toEqual(['dashboard', 'd1', 'published']);
    expect(queryKeys.blockData('b1', 'h')).toEqual(['block-data', 'b1', 'h']);
    expect(queryKeys.dashboardData('d1', 'draft', 'h')).toEqual(['dashboard-data', 'd1', 'draft', 'h']);
    expect(queryKeys.catalog()).toEqual(['catalog']);
    expect(queryKeys.connections.all).toEqual(['connections']);
  });
});
