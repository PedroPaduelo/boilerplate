import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ConnectionFormDialog } from '../components/connection-form-dialog';
import type { Connection } from '../types';

// Mock dos hooks de dados — isola o form da rede (mutações espionadas).
const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useCreateConnection: () => ({ mutate: createMutate, isPending: false }),
  useUpdateConnection: () => ({ mutate: updateMutate, isPending: false }),
  useDepartments: () => ({ data: { departments: [] }, isLoading: false }),
}));

const editConnection: Connection = {
  id: 'conn-1',
  name: 'Data Warehouse',
  description: null,
  type: 'POSTGRES',
  host: 'db.example.com',
  port: 5432,
  database: 'analytics',
  username: 'readonly',
  sslMode: 'require',
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

describe('ConnectionFormDialog', () => {
  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
  });

  it('renderiza a senha como campo mascarado (type=password) e nunca em texto', () => {
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    expect(screen.getByLabelText(/senha/i)).toHaveAttribute('type', 'password');
  });

  it('valida campos obrigatórios INLINE e não chama a mutation quando inválido', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await user.click(screen.getByRole('button', { name: /criar conexão/i }));

    // Mensagens no próprio campo (FieldStatus), não em toast.
    expect(await screen.findByText('Informe o nome')).toBeInTheDocument();
    expect(screen.getByText('Informe o host')).toBeInTheDocument();
    expect(screen.getByText('Informe o banco de dados')).toBeInTheDocument();
    expect(screen.getByText('Informe o usuário')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha')).toBeInTheDocument();
    // Ambiente não tem padrão: sem escolha explícita o form não passa. Isto é
    // o que impede o app de voltar a "adivinhar" o ambiente de um banco.
    expect(screen.getByText('Escolha o ambiente do banco')).toBeInTheDocument();

    expect(createMutate).not.toHaveBeenCalled();
  });

  it('cria a conexão com os dados preenchidos', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={null} />,
    );

    await user.type(screen.getByRole('textbox', { name: /nome/i }), 'Novo banco');
    await user.type(screen.getByRole('textbox', { name: /host/i }), 'db.local');
    await user.type(screen.getByRole('textbox', { name: /banco de dados/i }), 'postgres');
    await user.type(screen.getByRole('textbox', { name: /usuário/i }), 'readonly');
    await user.type(screen.getByLabelText(/senha/i), 's3nh4');

    // Visibilidade padrão é "Departamento" e exige escolher um; com a lista
    // vazia, o caminho válido é publicar para a organização.
    await user.click(screen.getByRole('combobox', { name: /visibilidade/i }));
    await user.click(await screen.findByRole('option', { name: 'Organização' }));

    await user.click(screen.getByRole('combobox', { name: /ambiente/i }));
    await user.click(await screen.findByRole('option', { name: 'Homologação' }));

    await user.click(screen.getByRole('button', { name: /criar conexão/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      name: 'Novo banco',
      host: 'db.local',
      database: 'postgres',
      username: 'readonly',
      password: 's3nh4',
      port: 5432,
      type: 'POSTGRES',
      visibility: 'ORG',
      environment: 'HOMOLOG',
    });
  });

  it('em edição, envia os campos certos e OMITE a senha em branco (mantém a atual)', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionFormDialog isOpen onOpenChange={() => {}} connection={editConnection} />,
    );

    // A senha começa em branco mesmo em edição (nunca pré-preenchida).
    expect(screen.getByLabelText(/senha/i)).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const payload = updateMutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      id: 'conn-1',
      name: 'Data Warehouse',
      host: 'db.example.com',
      port: 5432,
      database: 'analytics',
      username: 'readonly',
      visibility: 'ORG',
      // Em edição o ambiente salvo é reidratado e reenviado como está.
      environment: 'PRODUCTION',
      isActive: true,
    });
    expect(payload).not.toHaveProperty('password');
    expect(createMutate).not.toHaveBeenCalled();
  });
});
