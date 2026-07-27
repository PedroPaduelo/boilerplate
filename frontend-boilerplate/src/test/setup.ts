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

/**
 * Buracos de API do jsdom que os componentes do DS assumem existir.
 *
 * `hasPointerCapture`/`setPointerCapture` são usados pelos componentes que
 * arrastam ou seguem o ponteiro (selector, slider, resize); `scrollIntoView`
 * pelos que movem o foco por teclado (typeahead, lista de comandos). O jsdom
 * não traz nenhum deles, e a ausência aparece como erro dentro do design
 * system — nunca no teste que o disparou.
 */
if (typeof window !== 'undefined') {
  const element = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  element.hasPointerCapture ??= () => false;
  element.setPointerCapture ??= () => {};
  element.releasePointerCapture ??= () => {};
  element.scrollIntoView ??= () => {};
}

/**
 * Polyfill de `<dialog>` — o jsdom não implementa `showModal()`/`show()`/
 * `close()`.
 *
 * Todo componente do Astryx que abre em camada (`Dialog`, `AlertDialog`,
 * `CommandPalette`, `Sheet`) usa o elemento nativo. Sem isto, QUALQUER teste
 * que abra um deles estoura com "dialog.showModal is not a function" — e o
 * stack aponta para dentro do design system, não para o teste, o que manda
 * quem está depurando para o lugar errado.
 *
 * Mora no setup GLOBAL de propósito: é limitação do ambiente de teste, não de
 * uma feature. Durante a migração cada trilha manteve uma cópia local para não
 * colidir com as outras; consolidado aqui, as cópias foram removidas.
 *
 * `open` é atributo refletido — escrevê-lo/removê-lo é o que o DS consulta.
 * `close()` dispara o evento `close` porque é assim que o elemento real avisa
 * quem estiver escutando (é o que fecha o ciclo de foco dos componentes).
 */
if (typeof window !== 'undefined' && typeof window.HTMLDialogElement === 'function') {
  const prototype = window.HTMLDialogElement.prototype;

  if (typeof prototype.showModal !== 'function') {
    prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof prototype.show !== 'function') {
    prototype.show = function show(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof prototype.close !== 'function') {
    prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
