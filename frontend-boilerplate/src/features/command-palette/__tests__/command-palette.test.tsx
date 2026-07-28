/**
 * Testes da paleta de comandos (⌘K).
 *
 * Cobrem o contrato que o usuário percebe: o atalho abre/fecha, os artefatos
 * reais aparecem como itens, a busca filtra, o teclado navega e escolher um
 * item executa a ação. O RBAC também é verificado — um VIEWER não pode ver
 * ações de criação.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

const { state, navigateFn, createMutate } = vi.hoisted(() => ({
  state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
  navigateFn: vi.fn(),
  createMutate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateFn };
});

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

vi.mock('@/features/dashboards/hooks', () => ({
  useDashboards: () => ({
    data: {
      dashboards: [
        { id: 'd1', title: 'Painel de Arrecadação', status: 'PUBLISHED' },
        { id: 'd2', title: 'Despesas por Órgão', status: 'DRAFT' },
      ],
    },
  }),
  useCreateDashboard: () => ({ mutate: createMutate, isPending: false }),
}));

vi.mock('@/features/charts/hooks', () => ({
  useCharts: () => ({
    data: { charts: [{ id: 'c1', title: 'Receita mensal', status: 'PUBLISHED' }] },
  }),
}));

vi.mock('@/features/connections/hooks', () => ({
  useConnections: () => ({
    data: { connections: [{ id: 'x1', name: 'Postgres Fiscal', database: 'fiscal' }] },
  }),
}));

import { CommandPalette } from '../command-palette';

const PLACEHOLDER = /Buscar dashboards/i;

/** Dispara o atalho global (⌘K / Ctrl+K) como o usuário faria. */
async function openWithShortcut(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{Control>}k{/Control}');
}

describe('CommandPalette', () => {
  beforeEach(() => {
    navigateFn.mockClear();
    createMutate.mockClear();
    state.user = { id: 'me', role: 'CREATOR' };
  });

  it('fica fechada até o atalho ser acionado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // O `<dialog>` fechado continua no DOM, mas fora da árvore acessível —
    // por isso a consulta é por papel, não por texto solto.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openWithShortcut(user);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it('lista artefatos reais (dashboards, gráficos e conexões)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    expect(
      await screen.findByRole('option', { name: /Painel de Arrecadação/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Despesas por Órgão/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Receita mensal/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Postgres Fiscal/ })).toBeInTheDocument();
  });

  it('filtra pelo termo digitado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), 'arrecad');

    expect(
      await screen.findByRole('option', { name: /Painel de Arrecadação/ }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('option', { name: /Despesas por Órgão/ }),
      ).not.toBeInTheDocument();
    });
  });

  it('acha um item por sinônimo, não só pelo rótulo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), 'ia');

    expect(
      await screen.findByRole('option', { name: /Perguntar ao agente/ }),
    ).toBeInTheDocument();
  });

  it('navega ao escolher um artefato e fecha a paleta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    await user.click(
      await screen.findByRole('option', { name: /Painel de Arrecadação/ }),
    );

    expect(navigateFn).toHaveBeenCalledWith('/dashboards/d1');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('navega pelo teclado: seta para baixo + Enter executa o item destacado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    await screen.findByRole('option', { name: /Perguntar ao agente/ });
    await user.keyboard('{ArrowDown}{Enter}');

    expect(navigateFn).toHaveBeenCalledWith('/chat');
  });

  it('texto que não casa com nada vira pergunta ao agente, com a pergunta na URL', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    const pergunta = 'quais notas fiscais fogem do padrão';
    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), pergunta);

    await user.click(
      await screen.findByRole('option', { name: new RegExp(`Perguntar ao agente`) }),
    );

    // A pergunta viaja na URL: quem abre o chat já a encontra escrita no
    // composer, pronta para revisar e enviar.
    expect(navigateFn).toHaveBeenCalledWith(`/chat?q=${encodeURIComponent(pergunta)}`);
  });

  it('termo curto não vira pergunta — é busca, e a busca continua funcionando', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), 'rece');

    expect(
      await screen.findByRole('option', { name: /Receita mensal/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Perguntar ao agente: “/ }),
    ).not.toBeInTheDocument();
  });

  it('VIEWER não vê as ações de criação (RBAC)', async () => {
    state.user = { id: 'v', role: 'VIEWER' };
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);
    await openWithShortcut(user);

    await screen.findByPlaceholderText(PLACEHOLDER);
    expect(
      screen.queryByRole('option', { name: /Criar novo dashboard/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Perguntar ao agente/ }),
    ).not.toBeInTheDocument();

    // …mas continua podendo navegar pelo que tem permissão de ver.
    expect(screen.getByRole('option', { name: /Visão geral/ })).toBeInTheDocument();
  });
});
