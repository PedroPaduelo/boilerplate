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
      {/* Dark-first: em ferramenta profissional de análise, o escuro dá mais
          contraste aos gráficos e cansa menos em sessão longa — é o padrão dos
          consoles de dados em 2026. O toggle continua disponível e a escolha
          do usuário persiste; o script em index.html aplica antes do paint. */}
      <ThemeProvider defaultTheme="dark">
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
