import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { renderWithProviders } from '@/test/render';
import { RegisterForm } from '../components/register-form';

const { registerMutate, registerState } = vi.hoisted(() => ({
  registerMutate: vi.fn(),
  registerState: { isPending: false, isError: false, error: null as unknown },
}));

vi.mock('../hooks/use-auth', () => ({
  useRegister: () => ({ mutate: registerMutate, ...registerState }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    registerMutate.mockClear();
    registerState.isPending = false;
    registerState.isError = false;
    registerState.error = null;
  });

  it('rotula nome, e-mail e senha de forma acessível', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByRole('textbox', { name: /nome/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('valida inline e não chama a mutation quando os dados são inválidos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByRole('textbox', { name: /nome/i }), 'A');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText('O nome deve ter no mínimo 2 caracteres'),
    ).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido')).toBeInTheDocument();
    expect(registerMutate).not.toHaveBeenCalled();
  });

  it('submete os dados preenchidos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByRole('textbox', { name: /nome/i }), 'Ana Souza');
    await user.type(screen.getByRole('textbox', { name: /e-mail/i }), 'ana@empresa.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() =>
      expect(registerMutate).toHaveBeenCalledWith({
        name: 'Ana Souza',
        email: 'ana@empresa.com',
        password: 'segredo123',
      }),
    );
  });

  it('mostra a mensagem da API no banner quando o submit falha', () => {
    registerState.isError = true;
    registerState.error = new AxiosError('Request failed', '400', undefined, null, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any,
      data: { message: 'E-mail já cadastrado' },
    });

    renderWithProviders(<RegisterForm />);

    expect(screen.getByText('Não foi possível criar a conta')).toBeInTheDocument();
    expect(screen.getByText('E-mail já cadastrado')).toBeInTheDocument();
  });
});
