/**
 * Helper de concorrência limitada — executa `fn` sobre `items` com no máximo
 * `limit` execuções SIMULTÂNEAS, preservando a ordem dos resultados.
 *
 * Usado para executar queries de blocos EM PARALELO (em vez de série) sem
 * estourar o pool de conexões do pg-runner: o `limit` deve ser <= ao pool.
 * Fonte ÚNICA (DRY) — consumido pelo batch de dados (modo draft inline) e pela
 * materialização do snapshot no publish de dashboards.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Math.max(1, Math.min(Math.floor(limit) || 1, items.length || 1));
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
