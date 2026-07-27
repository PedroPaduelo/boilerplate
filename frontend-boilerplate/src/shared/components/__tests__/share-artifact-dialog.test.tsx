import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ShareArtifactDialog } from '../share-artifact-dialog';

/* ------------------------------------------------------------------ mocks -- */

const { shareMock, toastMock } = vi.hoisted(() => ({
  shareMock: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  },
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/hooks/use-share', () => ({
  useCreateShare: () => shareMock,
}));

vi.mock('@/shared/hooks/use-app-toast', () => ({
  useAppToast: () => toastMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  shareMock.isPending = false;
  shareMock.isError = false;
});

describe('ShareArtifactDialog', () => {
  it('pede a validade antes de gerar o link', () => {
    renderWithProviders(
      <ShareArtifactDialog
        open
        onOpenChange={vi.fn()}
        targetType="DASHBOARD"
        targetId="d1"
        targetTitle="Vendas Mensais"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Compartilhar link público' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vendas Mensais/)).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Validade do link' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar link' })).toBeInTheDocument();
  });

  it('gerar link envia o alvo e a duração escolhida', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShareArtifactDialog
        open
        onOpenChange={vi.fn()}
        targetType="CHART"
        targetId="c1"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar link' }));

    expect(shareMock.mutate).toHaveBeenCalledWith(
      { targetType: 'CHART', targetId: 'c1', durationSeconds: 60 * 60 * 24 * 7 },
      expect.anything(),
    );
  });

  it('sem alvo, a ação fica desabilitada com o motivo', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShareArtifactDialog
        open
        onOpenChange={vi.fn()}
        targetType="DASHBOARD"
        targetId={null}
      />,
    );

    // Com tooltip, o DS desabilita via `aria-disabled` (o botão continua
    // focável para que o leitor de tela anuncie o motivo).
    const button = screen.getByRole('button', { name: 'Gerar link' });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.click(button);
    expect(shareMock.mutate).not.toHaveBeenCalled();
  });

  it('falha na criação mostra um banner de erro', () => {
    shareMock.isError = true;
    renderWithProviders(
      <ShareArtifactDialog
        open
        onOpenChange={vi.fn()}
        targetType="DASHBOARD"
        targetId="d1"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível gerar o link');
  });

  it('com o link criado, mostra a URL e copia com feedback', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    shareMock.mutate.mockImplementation(
      (_input: unknown, options?: { onSuccess?: (link: { url: string }) => void }) => {
        options?.onSuccess?.({ url: '/public/tok123' });
      },
    );

    renderWithProviders(
      <ShareArtifactDialog
        open
        onOpenChange={vi.fn()}
        targetType="DASHBOARD"
        targetId="d1"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar link' }));

    await waitFor(() => {
      expect(screen.getByTestId('share-url')).toHaveTextContent('/public/tok123');
    });

    await user.click(screen.getByRole('button', { name: 'Copiar link' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/public/tok123`);
    });
    expect(toastMock.success).toHaveBeenCalledWith('Link copiado');
  });
});
