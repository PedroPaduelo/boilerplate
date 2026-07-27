import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { Download, LayoutDashboard, Trash2 } from 'lucide-react';
import { renderWithProviders } from '@/test/render';
import { ArtifactCard, type ArtifactCardProps } from '../artifact-card';

function renderRow(overrides: Partial<ArtifactCardProps> = {}) {
  const props: ArtifactCardProps = {
    title: 'Vendas Mensais',
    icon: LayoutDashboard,
    status: 'PUBLISHED',
    visibility: 'ORG',
    metaPrimary: 'Meu dashboard',
    metaSecondary: 'Financeiro',
    updatedAt: '2024-01-02T00:00:00.000Z',
    onOpen: vi.fn(),
    actions: [],
    ...overrides,
  };
  return { props, ...renderWithProviders(<ArtifactCard {...props} />) };
}

describe('ArtifactCard (linha de artefato)', () => {
  it('mostra título, metadados, estado e visibilidade', () => {
    renderRow();
    expect(screen.getByText('Vendas Mensais')).toBeInTheDocument();
    expect(screen.getByText('Meu dashboard · Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Organização')).toBeInTheDocument();
  });

  it('a linha inteira é um único alvo clicável que abre o artefato', async () => {
    const user = userEvent.setup();
    const { props } = renderRow();

    const row = screen.getByRole('button', { name: /Vendas Mensais/ });
    await user.click(row);

    expect(props.onOpen).toHaveBeenCalledTimes(1);
  });

  it('dispara o prefetch ao passar o mouse (sem esperar o clique)', () => {
    const onPrefetch = vi.fn();
    renderRow({ onPrefetch });

    fireEvent.mouseEnter(screen.getByTestId('artifact-row'));

    expect(onPrefetch).toHaveBeenCalled();
  });

  it('publica as ações num menu com nome acessível por artefato', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderRow({
      actions: [
        { key: 'export', label: 'Exportar', icon: Download, onSelect },
        {
          key: 'delete',
          label: 'Excluir',
          icon: Trash2,
          onSelect: vi.fn(),
          destructive: true,
          separatorBefore: true,
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Ações de Vendas Mensais' }));

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Exportar/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('menuitem', { name: /Excluir/ })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: /Exportar/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('ação desabilitada explica o motivo e não executa', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderRow({
      actions: [
        {
          key: 'export',
          label: 'Exportar',
          icon: Download,
          onSelect,
          disabled: true,
          disabledReason: 'chega com o PDF',
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Ações de Vendas Mensais' }));

    const item = await screen.findByRole('menuitem', {
      name: /Exportar \(chega com o PDF\)/,
    });
    await user.click(item);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('sem ações, não renderiza um menu vazio', () => {
    renderRow({ actions: [] });
    expect(
      screen.queryByRole('button', { name: 'Ações de Vendas Mensais' }),
    ).not.toBeInTheDocument();
  });

  it('em modo de confirmação, a própria linha vira a confirmação de exclusão', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderRow({ confirming: { onConfirm, onCancel } });

    const group = screen.getByRole('group', {
      name: 'Confirmar exclusão de Vendas Mensais',
    });
    expect(group).toBeInTheDocument();
    expect(screen.getByText('Excluir Vendas Mensais?')).toBeInTheDocument();
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('durante a exclusão, os botões ficam inertes e o progresso é visível', () => {
    renderRow({
      confirming: { onConfirm: vi.fn(), onCancel: vi.fn(), isPending: true },
    });

    expect(screen.getByTestId('confirm-delete')).toBeDisabled();
    expect(screen.getByTestId('cancel-delete')).toBeDisabled();
    expect(screen.getByTestId('confirm-delete')).toHaveTextContent(/Excluindo\.\.\./);
  });
});
