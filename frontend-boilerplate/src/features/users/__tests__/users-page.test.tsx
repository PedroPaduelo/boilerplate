import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/features/auth/store';
import { UsersPage } from '../index';
import type { User, UsersResponse, UserStats } from '../types';

const users: User[] = [
  {
    id: 'u1',
    name: 'Ana Souza',
    email: 'ana@empresa.com',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2024-03-10T12:00:00.000Z',
  },
  {
    id: 'u2',
    name: 'Bruno Lima',
    email: 'bruno@empresa.com',
    role: 'VIEWER',
    isActive: false,
    createdAt: '2024-04-02T12:00:00.000Z',
  },
];

const stats: UserStats = { total: 2, active: 1, inactive: 1, admins: 1 };

const { listState, statsState, refetch, mutate, reset } = vi.hoisted(() => ({
  listState: {
    data: undefined as UsersResponse | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null as unknown,
  },
  statsState: { data: undefined as UserStats | undefined, isLoading: false },
  refetch: vi.fn(),
  mutate: vi.fn(),
  reset: vi.fn(),
}));

/**
 * `reset` é criado UMA vez (como o `reset` do `useMutation`, que é estável
 * entre renders). Devolvê-lo de dentro do mock — `reset: vi.fn()` — criaria uma
 * função nova a cada render: o efeito que reidrata o formulário depende dela,
 * então rodaria em todo render e o diálogo entraria em laço infinito
 * ("Maximum update depth exceeded") por um defeito do mock, não da tela.
 */
vi.mock('../hooks/use-users', () => ({
  useUsers: () => ({ ...listState, refetch }),
  useUserStats: () => ({ ...statsState }),
  useCreateUser: () => ({ mutate, isPending: false, isError: false, error: null, reset }),
  useUpdateUser: () => ({ mutate, isPending: false, isError: false, error: null, reset }),
  useDeleteUser: () => ({ mutate, isPending: false }),
}));

function setCurrentUser(id: string) {
  useAuthStore.setState({
    user: {
      id,
      email: 'ana@empresa.com',
      name: 'Ana Souza',
      role: 'ADMIN',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    token: 'tok',
    isAuthenticated: true,
    isHydrated: true,
  });
}

describe('UsersPage', () => {
  beforeEach(() => {
    refetch.mockClear();
    mutate.mockClear();
    listState.data = { users, total: 2, page: 1, pageSize: 50, totalPages: 1 };
    listState.isLoading = false;
    listState.isFetching = false;
    listState.isError = false;
    listState.error = null;
    statsState.data = stats;
    statsState.isLoading = false;
    setCurrentUser('u1');
  });

  it('mostra esqueleto enquanto carrega, sem tabela nem vazio', () => {
    listState.isLoading = true;
    listState.data = undefined;
    statsState.isLoading = true;
    statsState.data = undefined;

    renderWithProviders(<UsersPage />, { route: '/users' });

    expect(screen.getByLabelText('Carregando usuários')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum usuário cadastrado')).not.toBeInTheDocument();
  });

  it('mostra banner de erro com ação de tentar de novo', async () => {
    const user = userEvent.setup();
    listState.isError = true;
    listState.data = undefined;

    renderWithProviders(<UsersPage />, { route: '/users' });

    expect(screen.getByText('Não foi possível carregar os usuários')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('mostra estado vazio com ação primária quando não há usuários', async () => {
    const user = userEvent.setup();
    listState.data = { users: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };

    renderWithProviders(<UsersPage />, { route: '/users' });

    const empty = screen
      .getByRole('heading', { name: 'Nenhum usuário cadastrado' })
      // O EmptyState é a região `role="status"` inteira; o `div` mais próximo
      // do título só embrulha título + descrição, e as ações são irmãs dele.
      .closest('[role="status"]') as HTMLElement;

    // A ação do estado vazio abre o mesmo formulário de criação do topo.
    await user.click(within(empty).getByRole('button', { name: 'Novo usuário' }));
    expect(
      await screen.findByRole('heading', { name: 'Novo usuário' }),
    ).toBeInTheDocument();
  });

  it('lista os usuários em linhas de tabela com função e status', () => {
    renderWithProviders(<UsersPage />, { route: '/users' });

    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Usuário' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Função' }),
    ).toBeInTheDocument();

    const rows = within(table).getAllByRole('row');
    // 1 cabeçalho + 2 usuários
    expect(rows).toHaveLength(3);

    const anaRow = within(table).getByText('Ana Souza').closest('tr')!;
    expect(within(anaRow).getByText('Admin')).toBeInTheDocument();
    expect(within(anaRow).getByText('Ativo')).toBeInTheDocument();

    const brunoRow = within(table).getByText('Bruno Lima').closest('tr')!;
    expect(within(brunoRow).getByText('Visualizador')).toBeInTheDocument();
    expect(within(brunoRow).getByText('Inativo')).toBeInTheDocument();
  });

  it('resume o quadro de usuários nas métricas do topo', () => {
    renderWithProviders(<UsersPage />, { route: '/users' });

    expect(screen.getByText('Total de usuários')).toBeInTheDocument();
    expect(screen.getByText('Admins')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('desabilita a exclusão do próprio usuário e explica o motivo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { route: '/users' });

    const selfDelete = screen.getByRole('button', { name: 'Excluir Ana Souza' });
    expect(selfDelete).toHaveAttribute('aria-disabled', 'true');

    await user.hover(selfDelete);
    expect(
      await screen.findByText('Você não pode excluir o próprio usuário'),
    ).toBeInTheDocument();

    // Pelo PAPEL, não pelo texto: o `<dialog>` do DS fica montado o tempo todo
    // e só entra na árvore de acessibilidade quando abre — procurar o título em
    // texto acharia a marcação fechada e acusaria uma abertura que não houve.
    await user.click(selfDelete);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('pede confirmação explícita antes de excluir outro usuário', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { route: '/users' });

    await user.click(screen.getByRole('button', { name: 'Excluir Bruno Lima' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Excluir usuário?')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Bruno Lima será removido permanentemente/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Excluir usuário' }));
    expect(mutate).toHaveBeenCalledWith('u2', expect.anything());
  });

  it('abre o formulário de edição com os dados do usuário da linha', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { route: '/users' });

    await user.click(screen.getByRole('button', { name: 'Editar Bruno Lima' }));

    expect(
      await screen.findByRole('heading', { name: 'Editar usuário' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /nome/i })).toHaveValue('Bruno Lima');
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toHaveValue(
      'bruno@empresa.com',
    );
  });

  it('deixa buscar por nome ou e-mail sem sair da tela', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { route: '/users' });

    const search = screen.getByRole('textbox', { name: 'Buscar usuários' });
    await user.type(search, 'bruno');
    expect(search).toHaveValue('bruno');
  });
});
