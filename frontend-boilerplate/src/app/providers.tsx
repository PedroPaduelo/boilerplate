import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { AuthProvider } from '@/features/auth/auth-provider';
import { SocketProvider } from '@/shared/socket';
import { queryClient } from '@/shared/lib/query-client';
import { ErrorBoundary } from './error-boundary';

/**
 * PONTO ÚNICO DE COMPOSIÇÃO DE PROVIDERS (território fechado da Fase 0).
 *
 * Ordem (de fora p/ dentro):
 *   ErrorBoundary → ThemeProvider → QueryClientProvider → AuthProvider →
 *   SocketProvider → children (+ Toaster global).
 *
 * Todas as trilhas FE consomem estes providers via hooks
 * (`useQuery`/`useQueryClient`, `useSocket`, `useAuthStore`). NINGUÉM edita este
 * arquivo para plugar features — rotas entram via `features/<x>/routes.tsx`
 * (ver `@/shared/lib/feature-routes`).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster position="top-right" richColors />
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
