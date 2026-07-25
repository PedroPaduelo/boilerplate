/**
 * Regressão do contrato de SCROLL e ALTURA do shell.
 *
 * Duas famílias de rota convivem no mesmo `<main>` e precisam de contratos
 * OPOSTOS:
 *
 *  - rota normal → o conteúdo cresce e o `<main>` rola;
 *  - rota full-bleed (workbench, ex.: detalhe da conexão) → a própria página
 *    gerencia o scroll dos painéis internos, então o `<main>` NÃO pode rolar e
 *    precisa entregar uma cadeia de altura definida (`h-full`) para o `h-full`
 *    da página resolver.
 *
 * Quebrar isso não gera erro nenhum — só um layout torto que passa batido em
 * review: sem `h-full` no wrapper, a página era dimensionada pelo conteúdo e
 * sobrava buraco vazio em telas altas (182px numa janela de 1080) enquanto
 * estourava em telas baixas (146px numa de 800), empurrando a barra de status
 * do workbench para fora da tela. Com o `<main>` rolando junto, aparecia ainda
 * o scroll duplo.
 *
 * jsdom não calcula layout, então o que se trava aqui é o CONTRATO de classes.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../dashboard-layout';

vi.mock('@/features/command-palette/command-palette', () => ({
  CommandPalette: () => null,
}));
vi.mock('@/features/command-palette/command-trigger', () => ({
  CommandTrigger: () => null,
}));
vi.mock('../app-sidebar', () => ({ AppSidebar: () => null }));
// Depende de contexto de tema; irrelevante para o contrato testado aqui.
vi.mock('@/components/theme/theme-toggle', () => ({ ThemeToggle: () => null }));

function montar(rota: string) {
  const { container } = render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="*" element={<div data-testid="pagina" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  const main = container.querySelector('main')!;
  return { main, wrapper: main.firstElementChild as HTMLElement };
}

describe('DashboardLayout — contrato de scroll/altura', () => {
  it('rota normal: o <main> rola e o conteúdo recebe respiro e largura máxima', () => {
    const { main, wrapper } = montar('/dashboards');

    expect(main.className).toContain('overflow-y-auto');
    expect(main.className).not.toContain('overflow-hidden');
    expect(wrapper.className).toContain('max-w-[1760px]');
  });

  it('rota full-bleed: o <main> NÃO rola (evita scroll duplo)', () => {
    const { main } = montar('/connections/abc123');

    expect(main.className).toContain('overflow-hidden');
    expect(main.className).not.toContain('overflow-y-auto');
  });

  it('rota full-bleed: o wrapper repassa a altura, senão o h-full da página não resolve', () => {
    const { wrapper } = montar('/connections/abc123');

    expect(wrapper.className).toContain('h-full');
    expect(wrapper.className).toContain('min-h-0');
    // Full-bleed é workbench: sem respiro nem teto de largura.
    expect(wrapper.className).not.toContain('max-w-');
    expect(wrapper.className).not.toContain('px-4');
  });

  it('a LISTA de conexões continua sendo rota normal (só o detalhe é full-bleed)', () => {
    const { main, wrapper } = montar('/connections');

    expect(main.className).toContain('overflow-y-auto');
    expect(wrapper.className).toContain('max-w-[1760px]');
  });
});
