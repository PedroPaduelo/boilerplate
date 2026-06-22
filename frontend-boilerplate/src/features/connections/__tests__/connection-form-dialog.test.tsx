import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionFormDialog } from '../components/connection-form-dialog';
import type { Connection } from '../types';

// Mock dos hooks de dados — isola o form da rede (mutations espionadas).
const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useCreateConnection: () => ({ mutate: createMutate, isPending: false }),
  useUpdateConnection: () => ({ mutate: updateMutate, isPending: false }),
  useDepartments: () => ({ data: { departments: [] } }),
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
    render(
      <ConnectionFormDialog open onOpenChange={() => {}} connection={null} />,
    );
    const password = screen.getByLabelText(/senha/i);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('valida campos obrigatórios e NÃO chama a mutation quando inválido', async () => {
    render(
      <ConnectionFormDialog open onOpenChange={() => {}} connection={null} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /criar conexão/i }));

    expect(await screen.findByText('Informe o nome')).toBeInTheDocument();
    expect(screen.getByText('Informe o host')).toBeInTheDocument();
    expect(screen.getByText('Informe o banco de dados')).toBeInTheDocument();
    expect(screen.getByText('Informe o usuário')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha')).toBeInTheDocument();

    expect(createMutate).not.toHaveBeenCalled();
  });

  it('em edição, submete chamando updateConnection com os campos certos e SEM senha (em branco mantém)', async () => {
    render(
      <ConnectionFormDialog
        open
        onOpenChange={() => {}}
        connection={editConnection}
      />,
    );

    // A senha começa em branco mesmo em edição (nunca pré-preenchida).
    const password = screen.getByLabelText(/senha/i);
    expect(password).toHaveValue('');

    fireEvent.click(
      screen.getByRole('button', { name: /salvar alterações/i }),
    );

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
      isActive: true,
    });
    // Senha em branco => NÃO vai no payload (mantém a atual).
    expect(payload).not.toHaveProperty('password');
    expect(createMutate).not.toHaveBeenCalled();
  });
});
