/**
 * Vitest setup file — loaded once per test file (see `test.setupFiles` in
 * vite.config.ts).
 *
 * Imports `@testing-library/jest-dom` so its matchers (e.g. `toBeInTheDocument`)
 * are available globally without each test file having to import it.
 */
import '@testing-library/jest-dom/vitest';

/**
 * Polyfill de ResizeObserver — o jsdom não o implementa, e todo gráfico do
 * catálogo mede o container antes de desenhar (`ResponsiveContainer`).
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE PRECISA *MEDIR*, E NÃO SÓ EXISTIR
 * ---------------------------------------------------------------------------
 * A versão anterior era um objeto com três métodos VAZIOS: `observe()` nunca
 * chamava o callback. Isso impedia o erro "ResizeObserver is not defined", mas
 * deixava um efeito colateral que custou caro:
 *
 *   • o `ResponsiveContainer` do recharts mede com `getBoundingClientRect()` —
 *     que no jsdom devolve 0×0, porque não há motor de layout — e depois espera
 *     o observador corrigir a medida. Sem callback, a largura ficava em 0 e o
 *     recharts NÃO RENDERIZA nada com largura 0;
 *   • resultado: em teste, TODO gráfico virava uma `<div>` vazia. Só o que mora
 *     FORA do SVG (legenda, tabela equivalente, rótulo acessível) aparecia;
 *   • consequência prática: a auditoria de inércia
 *     (`render-engine/catalog/__audit__/prop-effect.audit.test.tsx`) acusava
 *     como "INERTE" toda prop cujo efeito é DENTRO da plotagem — `fill`,
 *     `showGridLines`, `smooth`, `area`, `curveType`, cor de série. Não eram
 *     props quebradas: era o ambiente que não desenhava o gráfico. Um relatório
 *     que mistura defeito real com cegueira do ambiente não serve para decidir
 *     nada.
 *
 * Dois testes de bloco (`area_chart`, `h_bar_chart`) já contornavam isto com
 * uma cópia local de observador que mede — prova de que o comportamento certo
 * do polyfill é este. Hasteado para cá, vale para o catálogo inteiro (inclusive
 * para a auditoria, que não tem `beforeAll` próprio) e as cópias locais podem
 * sumir.
 *
 * O que ele reporta: a medida REAL do elemento quando existe (um teste que
 * sobrescreva `getBoundingClientRect` continua no comando) e, quando ela é 0 —
 * o caso normal no jsdom —, a do viewport simulado. É medida plausível, não
 * mágica: o desenho sai com a mesma geometria que teria num container daquele
 * tamanho.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  /** Medida usada quando o jsdom devolve 0×0 (ou seja, quase sempre). */
  const fallbackSize = () => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  globalThis.ResizeObserver = class MeasuringResizeObserver {
    private readonly callback: ResizeObserverCallback;
    private readonly targets = new Set<Element>();

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.targets.add(target);
      const rect = target.getBoundingClientRect?.();
      const fallback = fallbackSize();
      const contentRect = {
        // `|| fallback` e não `??`: o jsdom devolve 0, não `undefined`.
        width: rect?.width || fallback.width,
        height: rect?.height || fallback.height,
        top: rect?.top ?? 0,
        left: rect?.left ?? 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
      };
      // Síncrono de propósito: o `render()` da Testing Library roda dentro de
      // `act()`, então a medida chega junto com o efeito que a pediu e o
      // gráfico já sai desenhado no primeiro `expect` — sem `await` nem timer.
      this.callback(
        [{ target, contentRect } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }

    unobserve(target: Element) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
    }
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
