# 10 — Export PDF

> Status: ✅ Decisão travada (rodada 6) — **server-side headless**.

## O que o usuário disse
- O usuário tem que conseguir **baixar um relatório/dashboard em PDF**.

## ✅ Decisão: geração server-side com headless browser
- **Por quê**: fidelidade total à tela (mesmos componentes Vitrine, gráficos SVG, layout),
  sem reimplementar render; controlável e consistente.
- **Como**:
  - Rota de impressão dedicada no FE: `/print/dashboards/:id` (layout limpo, sem chrome de app),
    que renderiza o dashboard **no modo published** com os filtros recebidos por query string.
  - Serviço no BE usa **headless Chromium** (Puppeteer/Playwright — o FE já tem Playwright
    como devDep) para abrir essa rota autenticada e gerar o PDF (`page.pdf`).
  - **Roda como job na fila (BullMQ)** quando for pesado; progresso/entrega via socket ou
    download direto para PDFs rápidos.
  - Cabeçalho/rodapé com título + marca da prefeitura + data; paginação por seção (rows).
- **Dados**: reflete os **filtros aplicados** no momento da exportação; usa o cache de dados
  (published) para coerência com o que está na tela.
- **Auth**: o headless acessa a rota com um token de serviço/sessão de curta duração.

## Decisões em aberto (menores)
- [ ] Puppeteer vs Playwright (provável Playwright, já presente no FE).
- [ ] Sempre via fila vs síncrono para dashboards pequenos.
- [ ] Marca/template visual do PDF (logo da prefeitura, cores).
