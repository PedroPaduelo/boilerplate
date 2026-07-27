import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { LoginForm } from '../components/login-form';

const { loginMutate, loginState } = vi.hoisted(() => ({
  loginMutate: vi.fn(),
  loginState: { isPending: false, isError: false },
}));

vi.mock('../hooks/use-auth', () => ({
  useLogin: () => ({ mutate: loginMutate, ...loginState }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    loginMutate.mockClear();
    loginState.isPending = false;
    loginState.isError = false;
  });

  it('rotula os campos de forma acessível', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument();
    // Campo de senha não tem papel ARIA: a consulta acessível é pelo rótulo.
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('mostra erro de validação INLINE no campo e não chama a mutation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument();
    expect(screen.getByText('A senha tem no mínimo 6 caracteres')).toBeInTheDocument();
    // Erro de campo é inline: não sobe para o banner de falha de submit.
    expect(screen.queryByText('Não foi possível entrar')).not.toBeInTheDocument();
    expect(loginMutate).not.toHaveBeenCalled();
  });

  it('liga a mensagem de erro ao input (aria-invalid + aria-describedby)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await screen.findByText('Informe seu e-mail');

    const email = screen.getByRole('textbox', { name: /e-mail/i });
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby');
  });

  it('submete as credenciais digitadas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByRole('textbox', { name: /e-mail/i }), 'ana@empresa.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(loginMutate).toHaveBeenCalledWith({
        email: 'ana@empresa.com',
        password: 'segredo123',
      }),
    );
  });

  it('percorre e envia pelo teclado (Tab até a senha, Enter submete)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    // O e-mail já nasce focado (hasAutoFocus): o teclado começa no primeiro campo.
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toHaveFocus();
    await user.keyboard('ana@empresa.com');

    await user.tab();
    expect(screen.getByLabelText('Senha')).toHaveFocus();
    await user.keyboard('segredo123{Enter}');

    await waitFor(() =>
      expect(loginMutate).toHaveBeenCalledWith({
        email: 'ana@empresa.com',
        password: 'segredo123',
      }),
    );
  });

  it('mostra a falha de submit como banner no topo do formulário', () => {
    loginState.isError = true;
    renderWithProviders(<LoginForm />);

    expect(screen.getByText('Não foi possível entrar')).toBeInTheDocument();
    expect(
      screen.getByText('Confira o e-mail e a senha e tente novamente.'),
    ).toBeInTheDocument();
  });

  it('desabilita o envio enquanto a requisição está em voo', () => {
    loginState.isPending = true;
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
  });
});
