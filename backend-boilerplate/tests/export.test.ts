/**
 * Testes do m\u00f3dulo `export` (T-J) \u2014 PDF server-side headless.
 *
 * N\u00c3O exigem Postgres nem Chromium: exercitam as pe\u00e7as PURAS e o PIPELINE
 * (job \u2192 servi\u00e7o \u2192 entrega) com um renderer MOCKADO que devolve bytes %PDF.
 * A gera\u00e7\u00e3o REAL via Playwright \u00e9 validada por um smoke gated (ver
 * `EXPORT_E2E_CHROMIUM`) e no smoke manual \u2014 ver README do m\u00f3dulo.
 */
import { buildPrintUrl } from '@/modules/export/config';
import {
  signServiceToken,
  verifyServiceToken,
  EXPORT_TOKEN_PURPOSE,
} from '@/modules/export/token';
import {
  buildHeaderTemplate,
  buildFooterTemplate,
  type BrowserPdfRenderer,
} from '@/modules/export/pdf-service';
import { renderDashboardPdf, type RenderDeps } from '@/modules/export/service';
import {
  processExportJob,
  type ExportWorkerDeps,
} from '@/modules/export/worker-handler';
import type { ExportJobData, ExportStatus } from '@/modules/export/types';

/** Buffer m\u00ednimo que come\u00e7a com a assinatura de um PDF v\u00e1lido. */
const FAKE_PDF = Buffer.from('%PDF-1.4\n%fake pdf bytes for tests\n%%EOF');

const baseJob: ExportJobData = {
  jobId: 'job-123',
  dashboardId: 'dash-1',
  userId: 'user-1',
  role: 'ANALYST',
  mode: 'published',
  filters: { f_periodo: '2026' },
  title: 'D\u00edvida Ativa 2026',
  requestedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};

describe('token de servi\u00e7o (curto)', () => {
  it('assina e verifica um token v\u00e1lido com o claim purpose', () => {
    const token = signServiceToken('user-1', 'ANALYST', 300);
    const claims = verifyServiceToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.role).toBe('ANALYST');
    expect(claims.purpose).toBe(EXPORT_TOKEN_PURPOSE);
    expect(claims.exp).toBeGreaterThan(claims.iat ?? 0);
  });

  it('um token expirado \u00e9 rejeitado', () => {
    const token = signServiceToken('user-1', 'VIEWER', -1); // j\u00e1 expirado
    expect(() => verifyServiceToken(token)).toThrow();
  });
});

describe('buildPrintUrl', () => {
  it('monta a URL da rota /print com token, mode e filtros', () => {
    const url = buildPrintUrl('http://localhost:5173', 'dash-1', {
      token: 'tok',
      mode: 'published',
      filters: { f_periodo: '2026' },
    });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/print/dashboards/dash-1');
    expect(parsed.searchParams.get('token')).toBe('tok');
    expect(parsed.searchParams.get('mode')).toBe('published');
    expect(JSON.parse(parsed.searchParams.get('filters') ?? '{}')).toEqual({
      f_periodo: '2026',
    });
  });

  it('remove barras finais da base', () => {
    const url = buildPrintUrl('http://host/', 'd', {
      token: 't',
      mode: 'draft',
      filters: {},
    });
    expect(url.startsWith('http://host/print/dashboards/d?')).toBe(true);
  });
});

describe('templates de cabe\u00e7alho/rodap\u00e9', () => {
  it('cabe\u00e7alho cont\u00e9m t\u00edtulo e marca (escapados)', () => {
    const html = buildHeaderTemplate({ title: 'A & B', brand: 'Prefeitura' });
    expect(html).toContain('A &amp; B');
    expect(html).toContain('Prefeitura');
  });

  it('rodap\u00e9 cont\u00e9m data e os marcadores de pagina\u00e7\u00e3o do Chromium', () => {
    const html = buildFooterTemplate({ generatedAt: new Date('2026-01-01T12:00:00Z') });
    expect(html).toContain('class="pageNumber"');
    expect(html).toContain('class="totalPages"');
    expect(html).toContain('Gerado em');
  });
});

describe('renderDashboardPdf (n\u00facleo, renderer injetado)', () => {
  it('assina o token, monta a URL /print e delega ao renderer', async () => {
    let capturedUrl = '';
    const renderer: BrowserPdfRenderer = {
      render: async (req) => {
        capturedUrl = req.url;
        expect(req.title).toBe('D\u00edvida Ativa 2026');
        expect(req.brand).toBe('Prefeitura');
        return FAKE_PDF;
      },
    };
    const deps: RenderDeps = {
      renderer,
      signToken: (uid, role) => `signed:${uid}:${role}`,
      config: {
        printBaseUrl: 'http://fe.local',
        brand: 'Prefeitura',
        tokenTtlSeconds: 300,
        navigationTimeoutMs: 1000,
        readyTimeoutMs: 1000,
        resultTtlSeconds: 600,
      },
    };

    const pdf = await renderDashboardPdf(baseJob, deps);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');

    const parsed = new URL(capturedUrl);
    expect(parsed.pathname).toBe('/print/dashboards/dash-1');
    expect(parsed.searchParams.get('token')).toBe('signed:user-1:ANALYST');
    expect(parsed.searchParams.get('mode')).toBe('published');
  });
});

describe('processExportJob (pipeline job \u2192 servi\u00e7o \u2192 entrega)', () => {
  function makeDeps(overrides: Partial<ExportWorkerDeps> = {}) {
    const store = new Map<string, Buffer>();
    const statuses: ExportStatus[] = [];
    const notifications: Array<{ userId: string; event: string; payload: unknown }> = [];
    const deps: ExportWorkerDeps = {
      renderPdf: async () => FAKE_PDF,
      storePdf: async (jobId, pdf) => {
        store.set(jobId, pdf);
      },
      setStatus: async (s) => {
        statuses.push(s);
      },
      notify: (userId, event, payload) => {
        notifications.push({ userId, event, payload });
      },
      ...overrides,
    };
    return { deps, store, statuses, notifications };
  }

  it('gera o PDF, armazena e notifica export:ready (arquivo \u00e9 um PDF v\u00e1lido)', async () => {
    const { deps, store, statuses, notifications } = makeDeps();
    const outcome = await processExportJob(baseJob, deps);

    expect(outcome.bytes).toBe(FAKE_PDF.length);

    // o arquivo foi produzido e \u00e9 um PDF v\u00e1lido (n\u00e3o vazio, bytes %PDF)
    const stored = store.get('job-123');
    expect(stored).toBeDefined();
    expect(stored!.length).toBeGreaterThan(0);
    expect(stored!.subarray(0, 5).toString()).toBe('%PDF-');

    // estados: running \u2192 done
    expect(statuses.map((s) => s.state)).toEqual(['running', 'done']);
    expect(statuses[1].bytes).toBe(FAKE_PDF.length);

    // notifica\u00e7\u00e3o de sucesso para o usu\u00e1rio dono
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ userId: 'user-1', event: 'export:ready' });
  });

  it('em falha do render: status error, notifica export:failed e relan\u00e7a', async () => {
    const { deps, store, statuses, notifications } = makeDeps({
      renderPdf: async () => {
        throw new Error('chromium not available');
      },
    });

    await expect(processExportJob(baseJob, deps)).rejects.toThrow(
      'chromium not available',
    );

    expect(store.size).toBe(0);
    expect(statuses.map((s) => s.state)).toEqual(['running', 'error']);
    expect(statuses[1].message).toContain('chromium');
    expect(notifications[0]).toMatchObject({ userId: 'user-1', event: 'export:failed' });
  });
});

// Smoke GATED do Chromium real: prova que o renderer headless gera %PDF de uma
// p\u00e1gina que cont\u00e9m o marcador `[data-print-ready="true"]`. Habilite com
// EXPORT_E2E_CHROMIUM=1 (exige `npx playwright install chromium` + libs).
const e2e = process.env.EXPORT_E2E_CHROMIUM === '1' ? describe : describe.skip;
e2e('playwrightRenderer (Chromium real)', () => {
  it('gera um PDF v\u00e1lido a partir de uma p\u00e1gina com o marcador de pronto', async () => {
    const { playwrightRenderer } = await import('@/modules/export/pdf-service');
    const html =
      '<html><body><h1>Relat\u00f3rio</h1><div data-print-ready="true">ok</div></body></html>';
    const url = `data:text/html,${encodeURIComponent(html)}`;
    const pdf = await playwrightRenderer.render({
      url,
      title: 'Teste',
      brand: 'Prefeitura',
      generatedAt: new Date(),
      navigationTimeoutMs: 30000,
      readyTimeoutMs: 30000,
    });
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  }, 60000);
});
