/**
 * Serviço de geração de PDF via headless Chromium (Playwright) — T-J.
 *
 * Abre a rota `/print/dashboards/:id` do FE (autenticada pelo token de serviço
 * embutido na URL), aguarda o marcador `[data-print-ready="true"]` (que a página
 * seta quando a hidratação termina) e chama `page.pdf()` com cabeçalho/rodapé
 * (título + marca + data + numeração de página).
 *
 * O Playwright é importado DINAMICAMENTE (`await import('playwright')`) para que
 * o módulo só toque o Chromium quando REALMENTE for renderizar — assim o build,
 * o typecheck e os testes (que injetam um renderer falso) não exigem o browser.
 *
 * NOTA DE AMBIENTE: a geração real exige o binário do Chromium do Playwright
 * (`npx playwright install chromium`) + libs de sistema. Onde o browser não
 * estiver disponível, `render()` lança e o job/rota retornam erro — a fila e a
 * superfície continuam funcionais e testáveis (renderer mockado).
 */
export interface PdfRequest {
  /** URL completa da rota /print (já com token + filtros). */
  url: string;
  /** Título do dashboard (cabeçalho). */
  title: string;
  /** Marca exibida no cabeçalho. */
  brand: string;
  /** Data/hora de geração (rodapé). */
  generatedAt: Date;
  navigationTimeoutMs: number;
  readyTimeoutMs: number;
}

export interface BrowserPdfRenderer {
  render(req: PdfRequest): Promise<Buffer>;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Cabeçalho HTML (título + marca). Playwright exige font-size explícito. */
export function buildHeaderTemplate(opts: { title: string; brand: string }): string {
  return `<div style="width:100%;font-size:9px;color:#555;padding:4px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;">
    <span style="font-weight:600;">${esc(opts.title)}</span>
    <span>${esc(opts.brand)}</span>
  </div>`;
}

/** Rodapé HTML (data + paginação). Usa as classes especiais do Chromium. */
export function buildFooterTemplate(opts: { generatedAt: Date }): string {
  const when = esc(opts.generatedAt.toLocaleString('pt-BR'));
  return `<div style="width:100%;font-size:8px;color:#777;padding:4px 24px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ddd;">
    <span>Gerado em ${when}</span>
    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>`;
}

/** Opções de PDF (A4, fundo, margens para caber header/footer). */
export const PDF_OPTIONS = {
  format: 'A4' as const,
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '90px', bottom: '70px', left: '24px', right: '24px' },
};

/** Renderer REAL via Playwright (dynamic import). */
export const playwrightRenderer: BrowserPdfRenderer = {
  async render(req: PdfRequest): Promise<Buffer> {
    // import dinâmico: só carrega o playwright quando for renderizar de fato.
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.goto(req.url, {
        waitUntil: 'networkidle',
        timeout: req.navigationTimeoutMs,
      });
      await page.waitForSelector('[data-print-ready="true"]', {
        timeout: req.readyTimeoutMs,
      });
      const pdf = await page.pdf({
        ...PDF_OPTIONS,
        headerTemplate: buildHeaderTemplate({ title: req.title, brand: req.brand }),
        footerTemplate: buildFooterTemplate({ generatedAt: req.generatedAt }),
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  },
};
