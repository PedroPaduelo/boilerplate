/**
 * Regressão do contrato de ENQUADRAMENTO do shell.
 *
 * Duas famílias de rota convivem no mesmo `<main>` e precisam de contratos
 * OPOSTOS:
 *
 *  - rota normal → conteúdo com respiro (o `contentPadding` do AppShell dá a
 *    margem de leitura de listagens e formulários);
 *  - rota full-bleed (workbench, ex.: detalhe da conexão) → a própria página
 *    ocupa 100% da área útil e gerencia o scroll dos painéis internos, então o
 *    shell não pode impor padding.
 *
 * Quebrar isso não gera erro nenhum — só um layout torto que passa batido em
 * review: com padding no workbench, a barra de status é empurrada para fora da
 * tela; sem padding nas listagens, o texto cola na borda.
 *
 * O scroll em si é do shell (`height="fill"`), não do documento — por isso o
 * `<body>` é travado no CSS global.
 *
 * jsdom não calcula layout. O que se trava aqui é o contrato observável: a
 * landmark `main` existe, o título da rota é anunciado como `h1`, e o
 * enquadramento do conteúdo MUDA entre as duas famílias de rota. Comparamos as
 * classes entre si (não com um valor literal), porque os nomes são gerados pelo
 * StyleX e mudariam a cada build do design system.
 */
import { describe, it, expect, vi } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { DashboardLayout } from '../dashboard-layout';

vi.mock('@/features/command-palette/command-palette', () => ({
  CommandPalette: () => null,
}));
vi.mock('@/features/command-palette/command-trigger', () => ({
  CommandTrigger: () => null,
}));
vi.mock('../app-sidebar', () => ({ AppSidebar: () => null }));
// O shell escuta o socket para refletir o que o agente faz; irrelevante aqui.
vi.mock('@/shared/socket/use-agent-live-updates', () => ({
  useAgentLiveUpdates: () => {},
}));

function montar(rota: string) {
  const { container, unmount } = renderWithProviders(
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="*" element={<div data-testid="pagina" />} />
      </Route>
    </Routes>,
    { route: rota },
  );
  const main = container.querySelector('[role="main"]') as HTMLElement;
  return { main, unmount };
}

describe('DashboardLayout — contrato de enquadramento', () => {
  it('expõe a landmark principal e o título da rota ativa', () => {
    montar('/dashboards');

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboards');
  });

  it('oferece "pular para o conteúdo" (navegação por teclado)', () => {
    montar('/dashboards');

    const skip = screen.getByTestId('skip-to-content');
    expect(skip).toHaveAttribute('href', '#astryx-app-shell-main');
    expect(document.querySelector('#astryx-app-shell-main')).toBeInTheDocument();
  });

  it('rota full-bleed usa enquadramento DIFERENTE da rota normal', () => {
    const normal = montar('/dashboards');
    const classesNormal = normal.main.className;
    normal.unmount();

    const fullBleed = montar('/connections/abc123');
    const classesFullBleed = fullBleed.main.className;

    expect(classesFullBleed).not.toEqual(classesNormal);
  });

  it('a LISTA de conexões continua sendo rota normal (só o detalhe é full-bleed)', () => {
    const lista = montar('/connections');
    const classesLista = lista.main.className;
    lista.unmount();

    const detalhe = montar('/connections/abc123');
    const classesDetalhe = detalhe.main.className;
    detalhe.unmount();

    const outraNormal = montar('/dashboards');

    expect(classesLista).toEqual(outraNormal.main.className);
    expect(classesLista).not.toEqual(classesDetalhe);
  });
});
