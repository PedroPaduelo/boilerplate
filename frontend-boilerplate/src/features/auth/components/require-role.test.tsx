import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store';
import type { Role } from '@/shared/lib/rbac';
import { RequireRole } from './require-role';

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
    render(
      <MemoryRouter>
        <RequireRole permission="connections:manage">
          <div>conteudo-secreto</div>
        </RequireRole>
      </MemoryRouter>,
    );
    expect(screen.queryByText('conteudo-secreto')).not.toBeInTheDocument();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
  });

  it('PERMITE papel com a permissão exigida', () => {
    setUser('ADMIN');
    render(
      <MemoryRouter>
        <RequireRole permission="connections:manage">
          <div>conteudo-secreto</div>
        </RequireRole>
      </MemoryRouter>,
    );
    expect(screen.getByText('conteudo-secreto')).toBeInTheDocument();
  });

  it('BARRA por papel (roles) e redireciona quando fallback=redirect', () => {
    setUser('CREATOR');
    render(
      <MemoryRouter initialEntries={['/admin']}>
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
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText('painel-admin')).not.toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('PERMITE quando o papel está na lista', () => {
    setUser('ANALYST');
    render(
      <MemoryRouter>
        <RequireRole roles={['ADMIN', 'ANALYST']}>
          <div>relatorios</div>
        </RequireRole>
      </MemoryRouter>,
    );
    expect(screen.getByText('relatorios')).toBeInTheDocument();
  });

  it('redireciona para /login quando não autenticado', () => {
    useAuthStore.setState({ user: null, token: null, isHydrated: true });
    render(
      <MemoryRouter initialEntries={['/x']}>
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
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('tela-login')).toBeInTheDocument();
  });
});
