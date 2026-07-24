import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Testes da paleta de comandos (⌘K).
 *
 * Cobrem o contrato que o usuário percebe: o atalho abre/fecha, os artefatos
 * reais aparecem como itens, a busca filtra e escolher um item navega. O
 * RBAC também é verificado — um VIEWER não pode ver ações de criação.
 */

// jsdom não implementa a API de Pointer Capture usada pelo Radix Dialog.
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
});

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

vi.mock('@/components/theme/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', theme: 'dark', setTheme: vi.fn() }),
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

function renderPalette() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

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
    renderPalette();

    expect(screen.queryByPlaceholderText(/Buscar dashboards/i)).not.toBeInTheDocument();

    await openWithShortcut(user);

    expect(await screen.findByPlaceholderText(/Buscar dashboards/i)).toBeInTheDocument();
  });

  it('lista artefatos reais (dashboards, gráficos e conexões)', async () => {
    const user = userEvent.setup();
    renderPalette();
    await openWithShortcut(user);

    expect(await screen.findByText('Painel de Arrecadação')).toBeInTheDocument();
    expect(screen.getByText('Despesas por Órgão')).toBeInTheDocument();
    expect(screen.getByText('Receita mensal')).toBeInTheDocument();
    expect(screen.getByText('Postgres Fiscal')).toBeInTheDocument();
  });

  it('filtra pelo termo digitado', async () => {
    const user = userEvent.setup();
    renderPalette();
    await openWithShortcut(user);

    const input = await screen.findByPlaceholderText(/Buscar dashboards/i);
    await user.type(input, 'arrecad');

    expect(await screen.findByText('Painel de Arrecadação')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Despesas por Órgão')).not.toBeInTheDocument();
    });
  });

  it('navega ao escolher um artefato e fecha a paleta', async () => {
    const user = userEvent.setup();
    renderPalette();
    await openWithShortcut(user);

    await user.click(await screen.findByText('Painel de Arrecadação'));

    expect(navigateFn).toHaveBeenCalledWith('/dashboards/d1');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Buscar dashboards/i)).not.toBeInTheDocument();
    });
  });

  it('VIEWER não vê as ações de criação (RBAC)', async () => {
    state.user = { id: 'v', role: 'VIEWER' };
    const user = userEvent.setup();
    renderPalette();
    await openWithShortcut(user);

    await screen.findByPlaceholderText(/Buscar dashboards/i);
    expect(screen.queryByText('Criar novo dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Perguntar ao agente')).not.toBeInTheDocument();

    // …mas continua podendo navegar pelo que tem permissão de ver. Consulta
    // pelos ITENS (role=option) — "Dashboards" também é título de grupo, e um
    // getByText casaria com os dois.
    const itemValues = screen
      .getAllByRole('option')
      .map((el) => el.getAttribute('data-value'));
    expect(itemValues).toContain('Dashboards');
  });
});
