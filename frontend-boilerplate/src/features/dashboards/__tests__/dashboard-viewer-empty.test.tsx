/**
 * Vazios da tela de visualização.
 *
 * São dois vazios com SAÍDAS diferentes, e é isso que estes testes protegem —
 * a tentação aqui é sempre unificar num "Nenhum dado" genérico, que não
 * responde nada e deixa o usuário parado.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { DashboardViewerEmpty } from '../components/viewer/dashboard-viewer-empty';

describe('DashboardViewerEmpty', () => {
  it('dashboard NOVO: oferece o caminho de criação', () => {
    const onAskAgent = vi.fn();
    renderWithProviders(
      <DashboardViewerEmpty isDashboardEmpty canCreate onAskAgent={onAskAgent} />,
    );

    expect(screen.getByText('Este dashboard ainda está vazio')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Montar com IA' }).click();
    expect(onAskAgent).toHaveBeenCalled();
  });

  it('sem permissão de criar: explica, em vez de oferecer o que não dá', () => {
    renderWithProviders(
      <DashboardViewerEmpty isDashboardEmpty canCreate={false} onAskAgent={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: 'Montar com IA' })).toBeNull();
    expect(screen.getByText(/Assim que alguém adicionar/)).toBeInTheDocument();
  });

  it('ABA vazia: aponta para a navegação, não para criar', () => {
    // Aqui não falta criar nada — o dashboard tem conteúdo, só não nesta aba.
    // Oferecer "criar dashboard" responderia a pergunta errada.
    renderWithProviders(
      <DashboardViewerEmpty
        isDashboardEmpty={false}
        tabTitle="Por bairro"
        canCreate
        onAskAgent={vi.fn()}
      />,
    );

    expect(screen.getByText('“Por bairro” ainda não tem gráficos')).toBeInTheDocument();
    expect(screen.getByText(/use a navegação ao lado/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Montar com IA' })).toBeNull();
  });
});
