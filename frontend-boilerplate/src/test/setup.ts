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

/**
 * Polyfill de `window.matchMedia` — o jsdom não implementa.
 *
 * Os componentes do Astryx consultam media queries via `useMediaQuery`
 * (responsividade do AppShell, resolução de `mode: 'system'` no tema). Sem
 * isto, QUALQUER teste que renderize um componente do design system quebra com
 * "window.matchMedia is not a function".
 *
 * Responde sempre `matches: false` — ou seja, os testes rodam no breakpoint
 * desktop e no esquema claro, que é o padrão determinístico. Um teste que
 * precise do contrário deve sobrescrever isto localmente.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
