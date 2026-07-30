import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ConnectionsPage } from '../components/connections-page';
import type { Connection } from '../types';

/**
 * Regressão da listagem de conexões: a grade é a visão padrão e cada card
 * precisa expor o "Testar".
 *
 * O que este teste protege é uma correção de UX concreta, não a estética: a
 * lista mostrava "Não testado · Nunca testada" e NÃO oferecia forma de testar
 * (`useTestConnection` só era chamado dentro do workbench). Se alguém remover
 * o botão do card, o beco sem saída volta e este teste quebra.
 */
const { testMutate } = vi.hoisted(() => ({ testMutate: vi.fn() }));

const connection: Connection = {
  id: 'conn-1',
  name: 'Data Warehouse',
  description: null,
  type: 'POSTGRES',
  host: 'db.example.com',
  port: 5432,
  database: 'analytics',
  username: 'readonly',
  sslMode: 'require',
  baseUrl: null,
  options: null,
  ownerId: 'u1',
  departmentId: null,
  visibility: 'ORG',
  environment: 'PRODUCTION',
  isActive: true,
  status: 'UNKNOWN',
  lastTestedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/** Inativa: o teste de conectividade não faz sentido e precisa ficar barrado. */
const inactiveConnection: Connection = {
  ...connection,
  id: 'conn-2',
  name: 'Legado Desligado',
  isActive: false,
};

vi.mock('../hooks', () => ({
  useConnections: () => ({
    data: { connections: [connection, inactiveConnection] },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useTestConnection: () => ({
    mutate: testMutate,
    isPending: false,
    variables: undefined,
  }),
}));

// A página monta os diálogos de criar/excluir; isolamos para focar na listagem.
vi.mock('../components/connection-form-dialog', () => ({
  ConnectionFormDialog: () => null,
}));
vi.mock('../components/delete-connection-dialog', () => ({
  DeleteConnectionDialog: () => null,
}));

describe('ConnectionsPage — grade x tabela', () => {
  beforeEach(() => {
    testMutate.mockClear();
    window.localStorage.clear();
  });

  it('abre na GRADE e cada card leva o endereço da conexão', () => {
    renderWithProviders(<ConnectionsPage />);

    const cards = screen.getAllByTestId('connection-card');
    expect(cards).toHaveLength(2);
    // O endereço é o que de fato distingue duas conexões de nome parecido.
    expect(within(cards[0]).getByText('db.example.com:5432/analytics')).toBeVisible();
  });

  it('o card inteiro é um link para o workbench, sem engolir os botões aninhados', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getByRole('link', { name: 'Data Warehouse' })).toHaveAttribute(
      'href',
      '/connections/conn-1',
    );

    // Clicar em "Testar" dispara a mutação da conexão certa — e não navega.
    const card = screen.getAllByTestId('connection-card')[0];
    await user.click(within(card).getByRole('button', { name: /testar/i }));

    expect(testMutate).toHaveBeenCalledTimes(1);
    expect(testMutate).toHaveBeenCalledWith('conn-1');
  });

  it('bloqueia o teste de uma conexão inativa', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    const inactiveCard = screen.getAllByTestId('connection-card')[1];
    const button = within(inactiveCard).getByRole('button', { name: /testar/i });

    // O DS desabilita via `aria-disabled` (mantém o botão focável para o
    // tooltip explicar o motivo) — o que importa é que o clique não dispara.
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);
    expect(testMutate).not.toHaveBeenCalled();
  });

  it('alterna para a TABELA e guarda a preferência', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    // `SegmentedControlItem` é um radio (grupo de modos mutuamente exclusivos).
    await user.click(screen.getByRole('radio', { name: 'Tabela' }));

    expect(screen.queryAllByTestId('connection-card')).toHaveLength(0);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(window.localStorage.getItem('connections:view')).toBe('"table"');
  });
});
