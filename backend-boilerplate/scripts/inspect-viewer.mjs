/**
 * Inspeção estrutural da tela de visualização (complemento do screenshot).
 *
 * Imprime o que importa para julgar COMPOSIÇÃO — títulos, ações, estados dos
 * blocos e as caixas (posição/tamanho) dos slots do motor. É o que permite
 * afirmar "os dois cards da linha terminam na mesma altura" sem abrir a imagem.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const API = process.env.API_URL ?? 'http://localhost:4000';

const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'analyst@prefeitura.local', password: 'user1234' }),
});
const auth = await login.json();
const list = await fetch(`${API}/dashboards?pageSize=5`, {
  headers: { authorization: `Bearer ${auth.token}` },
});
const { dashboards } = await list.json();
const target = dashboards[0];

const browser = await chromium.launch({
  // Inspeção local: o backend só libera CORS para a porta 5173, e esta
  // ferramenta sobe o Vite em outra. Desligar a checagem vale AQUI (navegador
  // descartável, sem credencial real) e em lugar nenhum além disto.
  args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
// O store persiste SÓ o token (`partialize`) — injetar mais que isso não ajuda.
await page.addInitScript((t) => {
  localStorage.setItem('auth', JSON.stringify({ state: { token: t }, version: 0 }));
}, auth.token);

page.on('response', (r) => {
  if (r.url().includes('/dashboards') && r.status() >= 400) {
    console.log('HTTP', r.status(), r.url());
  }
});
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 200));
});
// `?tab=` opcional (3º argumento): as abas mostram conteúdos diferentes, e
// inspecionar sempre a primeira esconde metade da tela.
const tab = process.argv[3] ? `?tab=${process.argv[3]}` : '';
await page.goto(`${BASE}/dashboards/${target.id}/view${tab}`, {
  waitUntil: 'domcontentloaded',
});

// Momento do ESQUELETO: capturado antes de os dados chegarem, porque é
// justamente o estado que some rápido demais para inspecionar à mão.
// Amostra repetida: o esqueleto vive por instantes, e em dev o app leva um
// tempo variável para montar. Uma única leitura pega o instante errado.
let carregando = [];
for (let i = 0; i < 25 && carregando.length === 0; i += 1) {
  await page.waitForTimeout(150);
  carregando = await page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="chart-loading"]')].map(
      (s) =>
        `${s.getAttribute('data-skeleton-shape')} ${Math.round(s.getBoundingClientRect().height)}px` +
        ` filhos=${s.childElementCount}`,
    ),
  );
}
console.log('silhuetas no carregamento:', JSON.stringify(carregando));

await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

const report = await page.evaluate(() => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  };
  const texts = (sel) =>
    [...document.querySelectorAll(sel)].map((el) => el.textContent?.trim().slice(0, 70));

  return {
    titulo: document.querySelector('h1,h2')?.textContent?.trim(),
    trilha: texts('nav[aria-label] a').slice(0, 4),
    frescor: document.querySelector('[data-slot="data-freshness"]')?.textContent?.trim(),
    acoes: [...document.querySelectorAll('button')]
      .map((b) => b.getAttribute('aria-label') || b.textContent?.trim())
      .filter(Boolean)
      .slice(0, 14),
    abas: [...document.querySelectorAll('[data-testid^="tab-item-"]')].map(
      (a) => `${a.textContent?.trim().slice(0, 30)} @ ${box(a)}`,
    ),
    secoesNav: texts('.astryx-side-nav-section > *:first-child').slice(0, 6),
    blocos: [...document.querySelectorAll('[data-slot="block"]')].map(
      (b) =>
        `${b.getAttribute('data-block-type')} [${b.getAttribute('data-block-state')}]` +
        ` emphasis=${b.getAttribute('data-block-emphasis')} ${box(b)}` +
        ` cls="${(b.className || '').slice(0, 70)}"` +
        ` borda=${getComputedStyle(b.firstElementChild ?? b).borderColor}`,
    ),
    molduras: [...document.querySelectorAll('[data-slot="block-frame"]')].map(
      (f) =>
        `emphasis=${f.getAttribute('data-block-emphasis')} state=${f.getAttribute('data-block-frame-state')} ${box(f)}`,
    ),
    unidades: texts('[data-slot="block-frame-unit"]'),
    esqueletos: [...document.querySelectorAll('[data-slot="chart-loading"]')].map(
      (s) => `${s.getAttribute('data-skeleton-shape')} ${box(s)}`,
    ),
    celulas: [...document.querySelectorAll('[data-slot="dashboard-cell"]')].map(box),
    vazio: document.querySelector('[data-testid^="viewer-empty"]')?.textContent?.trim(),
  };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
