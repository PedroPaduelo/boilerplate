import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { LoginPage } from '../login';
import { RegisterPage } from '../register';

describe('Telas de autenticação (fora do shell)', () => {
  it('login: título é o h1 da rota e o formulário está enquadrado com a marca', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Entrar na sua conta' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'auditorIA' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('login: oferece o caminho para criar conta como link de navegação', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('registro: título é o h1 da rota e o link volta para o login', () => {
    renderWithProviders(<RegisterPage />, { route: '/register' });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Criar sua conta' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
