import { describe, it, expect, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/store';
import { attachAuthToken, handleResponseError } from './api-client';

function makeConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

describe('api-client', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  it('anexa o JWT do store no header Authorization', () => {
    useAuthStore.setState({ token: 'abc123' });
    const out = attachAuthToken(makeConfig());
    expect(out.headers.Authorization).toBe('Bearer abc123');
  });

  it('não anexa Authorization quando não há token', () => {
    useAuthStore.setState({ token: null });
    const out = attachAuthToken(makeConfig());
    expect(out.headers.Authorization).toBeUndefined();
  });

  it('em 401 faz logout (limpa o estado de auth) e propaga o erro', async () => {
    // Numa rota pública evita o redirect (e o ruído de navegação do jsdom).
    window.history.pushState({}, '', '/login');
    useAuthStore.setState({
      user: {
        id: 'u',
        email: 'e@x.com',
        name: null,
        role: 'ADMIN',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      token: 'abc123',
      isAuthenticated: true,
    });

    const err = new AxiosError('unauth', 'ERR', makeConfig(), undefined, {
      status: 401,
      data: {},
      statusText: 'Unauthorized',
      headers: {},
      config: makeConfig(),
    });

    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('em erro não-401 apenas propaga (sem logout)', async () => {
    useAuthStore.setState({ token: 'keepme', isAuthenticated: true });
    const err = new AxiosError('server', 'ERR', makeConfig(), undefined, {
      status: 500,
      data: {},
      statusText: 'Server Error',
      headers: {},
      config: makeConfig(),
    });
    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(useAuthStore.getState().token).toBe('keepme');
  });
});
