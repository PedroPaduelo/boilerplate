/**
 * Vitest setup file — loaded once per test file (see `test.setupFiles` in
 * vite.config.ts).
 *
 * Imports `@testing-library/jest-dom` so its matchers (e.g. `toBeInTheDocument`)
 * are available globally without each test file having to import it.
 */
import '@testing-library/jest-dom/vitest';

/**
 * Polyfill mínimo de ResizeObserver — o jsdom não o implementa, e componentes
 * de gráfico (ex.: LineChart) o usam para medir a largura do container.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
