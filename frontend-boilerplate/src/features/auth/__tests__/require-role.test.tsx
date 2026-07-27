import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import type { Role } from '@/shared/lib/rbac';
import { useAuthStore } from '../store';
import { RequireRole } from '../components/require-role';

function setUser(role: Role) {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'u@x.com',
      name: 'U',
      role,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    token: 'tok',
    isAuthenticated: true,
    isHydrated: true,
  });
}

describe('RequireRole (guarda por papel/permissão)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  it('BARRA papel sem a permissão exigida (403 inline)', () => {
    setUser('VIEWER');
    renderWithProviders(
      <RequireRole permission="connections:manage">
        <div>conteudo-secreto</div>
      </RequireRole>,
    );

    expect(screen.queryByText('conteudo-secreto')).not.toBeInTheDocument();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
  });

  it('PERMITE papel com a permissão exigida', () => {
    setUser('ADMIN');
    renderWithProviders(
      <RequireRole permission="connections:manage">
        <div>conteudo-secreto</div>
      </RequireRole>,
    );

    expect(screen.getByText('conteudo-secreto')).toBeInTheDocument();
  });

  it('BARRA por papel (roles) e redireciona quando fallback=redirect', () => {
    setUser('CREATOR');
    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireRole roles="ADMIN" fallback="redirect">
              <div>painel-admin</div>
            </RequireRole>
          }
        />
        <Route path="/" element={<div>home</div>} />
      </Routes>,
      { route: '/admin' },
    );

    expect(screen.queryByText('painel-admin')).not.toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('PERMITE quando o papel está na lista', () => {
    setUser('ANALYST');
    renderWithProviders(
      <RequireRole roles={['ADMIN', 'ANALYST']}>
        <div>relatorios</div>
      </RequireRole>,
    );

    expect(screen.getByText('relatorios')).toBeInTheDocument();
  });

  it('redireciona para /login quando não autenticado', () => {
    useAuthStore.setState({ user: null, token: null, isHydrated: true });
    renderWithProviders(
      <Routes>
        <Route
          path="/x"
          element={
            <RequireRole permission="artifacts:view">
              <div>x</div>
            </RequireRole>
          }
        />
        <Route path="/login" element={<div>tela-login</div>} />
      </Routes>,
      { route: '/x' },
    );

    expect(screen.getByText('tela-login')).toBeInTheDocument();
  });

  it('mostra estado de carregando (com rótulo) enquanto o store não hidratou', () => {
    useAuthStore.setState({ user: null, token: 'tok', isHydrated: false });
    renderWithProviders(
      <RequireRole roles="ADMIN">
        <div>conteudo</div>
      </RequireRole>,
    );

    expect(screen.queryByText('conteudo')).not.toBeInTheDocument();
    expect(screen.getByText('Verificando suas permissões…')).toBeInTheDocument();
  });
});
