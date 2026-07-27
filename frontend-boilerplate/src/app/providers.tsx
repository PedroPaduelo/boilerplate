import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { LayerProvider } from '@astryxdesign/core/Layer';
import { LinkProvider } from '@astryxdesign/core/Link';
import { ColorModeProvider } from '@/shared/theme';
import { RouterLinkAdapter } from '@/shared/lib/router-link';
import { AuthProvider } from '@/features/auth/auth-provider';
import { SocketProvider } from '@/shared/socket';
import { queryClient } from '@/shared/lib/query-client';
import { ErrorBoundary } from './error-boundary';

/**
 * PONTO ÚNICO DE COMPOSIÇÃO DE PROVIDERS (território fechado).
 *
 * Ordem (de fora p/ dentro):
 *   ErrorBoundary → ColorModeProvider → LayerProvider → LinkProvider →
 *   QueryClientProvider → AuthProvider → SocketProvider → children
 *
 * Por que esta ordem:
 *   - `ColorModeProvider` engloba tudo porque aplica o `<Theme>` do Astryx: os
 *     tokens precisam existir antes de qualquer componente do DS renderizar.
 *   - `LayerProvider` vem antes de quem dispara toast (`useAppToast`), pois é
 *     ele que monta o viewport onde os toasts aparecem.
 *   - `LinkProvider` acima do router-aware tree: faz TODO link do Astryx
 *     (SideNavItem, Link, Breadcrumbs) navegar client-side.
 *
 * Dark-first: em ferramenta de análise o escuro dá mais contraste aos gráficos
 * e cansa menos em sessão longa. O toggle continua disponível, a escolha
 * persiste, e o script do `index.html` aplica antes do primeiro paint.
 *
 * NINGUÉM edita este arquivo para plugar features — rotas entram via
 * `features/<x>/routes.tsx` (ver `@/shared/lib/feature-routes`).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ColorModeProvider defaultMode="dark">
        <LayerProvider toast={{ position: 'topEnd' }}>
          <LinkProvider component={RouterLinkAdapter}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <SocketProvider>{children}</SocketProvider>
              </AuthProvider>
            </QueryClientProvider>
          </LinkProvider>
        </LayerProvider>
      </ColorModeProvider>
    </ErrorBoundary>
  );
}
