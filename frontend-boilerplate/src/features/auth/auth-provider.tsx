import { useEffect, type ReactNode } from 'react';
import { apiClient } from '@/shared/lib/api-client';
import { useAuthStore } from './store';
import type { User } from './types';

/**
 * Provider de autenticação (ponto de composição da Fase 0).
 *
 * O store persiste APENAS o token (`partialize`), então após um reload o `user`
 * volta null. Este provider re-hidrata o `user` chamando `GET /auth/me` quando
 * há token mas não há user. Em 401 o interceptor do `api-client` já faz logout.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isHydrated || !token || user) return;

    let cancelled = false;
    apiClient
      .get<User>('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) logout();
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token, user, setUser, logout]);

  return <>{children}</>;
}
