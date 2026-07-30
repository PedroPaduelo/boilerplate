import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ConnectionFormDialog } from '../components/connection-form-dialog';
import type { Connection } from '../types';

/**
 * Cadastro de conexão do tipo API (gateway) — o segundo tipo de fonte.
 *
 * O que estes testes protegem: escolher "API (gateway)" tem que TROCAR o
 * formulário, não só o rótulo. Se os campos de Postgres continuarem exigidos,
 * o usuário fica travado num formulário que pede host e senha de um banco que
 * ele não alcança — que é exatamente o problema que o gateway veio resolver.
 */

const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useCreateConnection: () => ({ mutate: createMutate, isPending: false }),
  useUpdateConnection: () => ({ mutate: updateMutate, isPending: false }),
  useDepartments: () => ({ data: { departments: [] }, isLoading: false }),
}));

/** Conexão de gateway já existente (para o caminho de edição). */
const gatewayConnection: Connection = {
  id: 'conn-gw',
  name: 'Tributário (gateway)',
  description: null,
  type: 'API_GATEWAY',
  host: 'gw.exemplo.com',
  port: 443,
  database: 'TRIBUTARIO_IPATINGA',
  username: 'gateway',
  sslMode: 'require',
  baseUrl: 'https://gw.exemplo.com',
  options: null,
  ownerId: 'u1',
  departmentId: null,
  visibility: 'ORG',
  environment: 'PRODUCTION',
  isActive: true,
  status: 'OK',
  lastTestedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/** Seleciona o tipo "API (gateway)" no rádio de tipo. */
async function escolherTipoApi(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /API \(gateway\)/i }));
}

describe('ConnectionFormDialog — tipo API (gateway)', () => {
  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
  });

  it('começa em "Banco de dados" e mostra os campos de Postgres', () => {
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    expect(screen.getByRole('radio', { name: /Banco de dados/i })).toBeChecked();
    expect(screen.getByRole('textbox', { name: /host/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /URL do gateway/i })).toBeNull();
  });

  it('ao escolher API, troca host/usuário/senha por URL e token', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await escolherTipoApi(user);

    expect(
      await screen.findByRole('textbox', { name: /URL do gateway/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/token de acesso/i)).toBeInTheDocument();
    // Os campos do outro transporte somem — não ficam invisíveis e obrigatórios.
    expect(screen.queryByRole('textbox', { name: /host/i })).toBeNull();
    expect(screen.queryByRole('textbox', { name: /usuário/i })).toBeNull();
    expect(screen.queryByLabelText(/^senha/i)).toBeNull();
    // SSL sai de cena: no gateway ele é decidido pelo esquema da URL.
    expect(screen.queryByRole('combobox', { name: /SSL/i })).toBeNull();
  });

  it('o token é campo mascarado (nunca em texto claro)', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await escolherTipoApi(user);

    expect(await screen.findByLabelText(/token de acesso/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('valida URL e token INLINE, sem chamar a mutation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await escolherTipoApi(user);
    await user.click(screen.getByRole('button', { name: /criar conexão/i }));

    expect(await screen.findByText('Informe a URL do gateway')).toBeInTheDocument();
    expect(screen.getByText('Informe o token de acesso')).toBeInTheDocument();
    // As exigências do OUTRO tipo não podem vazar para este formulário.
    expect(screen.queryByText('Informe o host')).toBeNull();
    expect(screen.queryByText('Informe o usuário')).toBeNull();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('exige esquema http(s) na URL — erro que diz o que falta', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await escolherTipoApi(user);
    await user.type(
      await screen.findByRole('textbox', { name: /URL do gateway/i }),
      'gw.exemplo.com',
    );
    await user.click(screen.getByRole('button', { name: /criar conexão/i }));

    expect(
      await screen.findByText('A URL deve começar com http:// ou https://'),
    ).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('cria a conexão enviando type/baseUrl/token — e NENHUM campo de Postgres', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await escolherTipoApi(user);
    await user.type(screen.getByRole('textbox', { name: /nome/i }), 'Tributário');
    await user.type(
      await screen.findByRole('textbox', { name: /URL do gateway/i }),
      'https://gw.exemplo.com',
    );
    await user.type(screen.getByLabelText(/token de acesso/i), 'tok-123');

    await user.click(screen.getByRole('combobox', { name: /visibilidade/i }));
    await user.click(await screen.findByRole('option', { name: 'Organização' }));
    await user.click(screen.getByRole('combobox', { name: /ambiente/i }));
    await user.click(await screen.findByRole('option', { name: 'Produção' }));

    await user.click(screen.getByRole('button', { name: /criar conexão/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const payload = createMutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'Tributário',
      type: 'API_GATEWAY',
      baseUrl: 'https://gw.exemplo.com',
      token: 'tok-123',
      visibility: 'ORG',
      environment: 'PRODUCTION',
    });
    // Sujar o registro com endereço vazio faria a listagem exibir ":0/".
    expect(payload).not.toHaveProperty('host');
    expect(payload).not.toHaveProperty('username');
    expect(payload).not.toHaveProperty('password');
    // Banco em branco é omitido: quem informa o nome é o gateway, no teste.
    expect(payload).not.toHaveProperty('database');
  });

  it('em edição, o tipo fica travado e o token em branco MANTÉM o atual', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog
        isOpen
        onOpenChange={() => {}}
        connection={gatewayConnection}
      />,
    );

    // Reidrata a URL, nunca o segredo.
    expect(screen.getByRole('textbox', { name: /URL do gateway/i })).toHaveValue(
      'https://gw.exemplo.com',
    );
    expect(screen.getByLabelText(/token de acesso/i)).toHaveValue('');
    // `aria-disabled` (e não `disabled`) é o comportamento do DS: o rádio
    // continua focável para que o leitor de tela anuncie o motivo do bloqueio,
    // mas a seleção fica travada.
    expect(screen.getByRole('radio', { name: /API \(gateway\)/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const payload = updateMutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      id: 'conn-gw',
      baseUrl: 'https://gw.exemplo.com',
      database: 'TRIBUTARIO_IPATINGA',
    });
    expect(payload).not.toHaveProperty('token');
    expect(payload).not.toHaveProperty('password');
  });
});
