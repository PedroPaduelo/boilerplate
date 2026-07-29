/**
 * Cabeçalho da tela de visualização.
 *
 * O que estes testes protegem é a resposta a três perguntas que um painel
 * precisa responder sem ninguém pedir: ONDE estou (trilha), O QUE é isto
 * (título + estado de publicação) e DE QUANDO É o número que estou lendo. A
 * terceira é a que costuma faltar — e é a mais cara: um dashboard que mostra
 * dado velho sem avisar não é um dashboard desatualizado, é um dashboard
 * ERRADO.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { DashboardViewerHeader } from '../components/viewer/dashboard-viewer-header';
import type { DashFilter } from '../lib/dashboard-filters';

vi.mock('@/shared/hooks/use-app-toast', () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

const periodFilter: DashFilter = {
  id: 'f_periodo',
  type: 'date_range',
  label: 'Período',
};

function renderHeader(
  overrides: Partial<React.ComponentProps<typeof DashboardViewerHeader>> = {},
) {
  return renderWithProviders(
    <DashboardViewerHeader
      title="Dívida Ativa 2026"
      dashboardId="dash_1"
      isPublished
      values={{}}
      onFilterChange={vi.fn()}
      updatedAt={Date.now()}
      isFetching={false}
      isError={false}
      onRefresh={vi.fn()}
      canShare
      canExport
      isExporting={false}
      onExport={vi.fn()}
      {...overrides}
    />,
  );
}

describe('DashboardViewerHeader — identidade e orientação', () => {
  it('mostra a trilha com saída para a listagem', () => {
    renderHeader();

    const trilha = screen.getByRole('navigation', { name: 'Você está em' });
    expect(within(trilha).getByRole('link', { name: 'Dashboards' })).toHaveAttribute(
      'href',
      '/dashboards',
    );
  });

  it('mostra título e estado de publicação', () => {
    renderHeader();

    expect(
      screen.getByRole('heading', { name: 'Dívida Ativa 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('rascunho é anunciado como rascunho', () => {
    renderHeader({ isPublished: false });

    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });
});

describe('DashboardViewerHeader — frescor do dado', () => {
  it('em carregamento, avisa que os números podem mudar', () => {
    renderHeader({ isFetching: true });

    expect(screen.getByText('Atualizando os dados…')).toBeInTheDocument();
  });

  it('em falha, AVISA que o que está na tela pode estar velho', () => {
    /*
     * O estado mais importante dos três. Sem este aviso, uma falha de
     * atualização deixa números antigos na tela com cara de atuais — e alguém
     * leva esse número para uma reunião.
     */
    renderHeader({ isError: true });

    expect(screen.getByText(/podem estar desatualizados/)).toBeInTheDocument();
  });

  it('antes do primeiro dado, não mente dizendo "atualizado"', () => {
    renderHeader({ updatedAt: 0 });

    expect(screen.getByText('Aguardando os dados')).toBeInTheDocument();
  });

  it('com dado, mostra há quanto tempo (relativo, não carimbo)', () => {
    renderHeader({ updatedAt: Date.now() });

    expect(screen.getByText(/Atualizado/)).toBeInTheDocument();
  });
});

describe('DashboardViewerHeader — ações', () => {
  it('promove o filtro de PERÍODO para o cabeçalho', () => {
    // Período é o único filtro que muda o significado de todos os números ao
    // mesmo tempo — no meio da fileira de filtros ele se iguala a um
    // "situação = todas".
    renderHeader({ periodFilter });

    expect(screen.getByLabelText('Período (de)')).toBeInTheDocument();
    expect(screen.getByLabelText('Período (até)')).toBeInTheDocument();
  });

  it('sem filtro de data no layout, não inventa um seletor de período', () => {
    renderHeader();

    expect(screen.queryByLabelText('Período (de)')).not.toBeInTheDocument();
  });

  it('sem permissão de compartilhar, a ação não aparece', () => {
    renderHeader({ canShare: false });

    expect(screen.queryByRole('button', { name: 'Compartilhar' })).toBeNull();
  });

  it('atualizar aciona o recarregamento', () => {
    const onRefresh = vi.fn();
    renderHeader({ onRefresh });

    screen.getByRole('button', { name: 'Atualizar' }).click();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
