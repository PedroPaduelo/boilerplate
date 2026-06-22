/**
 * Unit — derivação do jobId do BullMQ a partir do cacheKey (módulo `data`).
 *
 * Regressão do bug de INTEGRAÇÃO encontrado no e2e (task [INT]): o BullMQ PROÍBE
 * `:` em custom jobId (`Error: Custom Id cannot contain :`), mas o `cacheKey`
 * (`data:{sha256}`) usa `:` por convenção de chave Redis. `jobIdFromCacheKey`
 * sanitiza o `:` mantendo o determinismo — preservando o anti-stampede.
 */
import { computeCacheKey } from '@/modules/data/cache';
import { jobIdFromCacheKey } from '@/modules/data/jobs/queue';

describe('data/queue — jobIdFromCacheKey', () => {
  it('remove os ":" (BullMQ não aceita custom jobId com ":")', () => {
    const cacheKey = computeCacheKey('conn1', 'SELECT 1', [2026]);
    expect(cacheKey).toContain(':'); // prefixo `data:`
    const jobId = jobIdFromCacheKey(cacheKey);
    expect(jobId).not.toContain(':');
  });

  it('é determinística (mesma cacheKey → mesmo jobId): anti-stampede preservado', () => {
    const cacheKey = computeCacheKey('conn1', 'SELECT 1', [2026, 'BRL']);
    expect(jobIdFromCacheKey(cacheKey)).toBe(jobIdFromCacheKey(cacheKey));
  });

  it('não colide para cacheKeys diferentes', () => {
    const a = jobIdFromCacheKey(computeCacheKey('connA', 'SELECT 1', []));
    const b = jobIdFromCacheKey(computeCacheKey('connB', 'SELECT 1', []));
    expect(a).not.toBe(b);
  });
});
