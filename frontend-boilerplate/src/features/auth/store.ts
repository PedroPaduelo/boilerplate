import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: () => void;
}

/**
 * Fonte unica de verdade do token de autenticacao: o store persistido pelo
 * zustand (`persist`), na chave `auth`. Nada de `localStorage.setItem('token')`
 * em paralelo — o api-client le o token diretamente daqui via
 * `useAuthStore.getState().token`.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
