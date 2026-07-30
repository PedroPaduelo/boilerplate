/**
 * Helper de render para testes.
 *
 * Componentes do Astryx dependem de contexto: `<Theme>` (tokens), `LayerProvider`
 * (viewport de toast) e `LinkProvider` (navegação client-side). Renderizar uma
 * tela sem esses providers estoura em runtime — e o erro aponta para o
 * componente, não para o teste, o que custa caro para diagnosticar.
 *
 * Use `renderWithProviders` em qualquer teste que monte UI real.
 */
import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import { LayerProvider } from '@astryxdesign/core/Layer';
import { LinkProvider } from '@astryxdesign/core/Link';
import { ColorModeProvider } from '@/shared/theme';
import { APP_LOCALE, dsMessages } from '@/app/i18n';
import { RouterLinkAdapter } from '@/shared/lib/router-link';

/** QueryClient isolado por teste: sem retry e sem cache entre casos, senão um
 *  teste contamina o seguinte e a falha aparece longe da causa. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Rota inicial do MemoryRouter. */
  route?: string;
  /** Passe um client próprio para inspecionar o cache no teste. */
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    ...options
  }: RenderWithProvidersOptions = {},
): RenderResult & { queryClient: QueryClient } {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      /*
       * `InternationalizationProvider` com o MESMO catálogo do app (pt-BR).
       *
       * Sem ele o design system caía no catálogo `en` embutido, e os testes
       * passavam a afirmar textos que o usuário nunca vê: um teste de
       * acessibilidade procurando o botão "Collapse sidebar" ficava verde
       * enquanto a tela real dizia "Recolher barra lateral" — ou seja, o teste
       * não estava protegendo o nome acessível de nada. Renderizar como o app
       * renderiza é o propósito deste helper.
       */
      <InternationalizationProvider locale={APP_LOCALE} messages={dsMessages}>
        <ColorModeProvider defaultMode="light">
          <LayerProvider>
            <MemoryRouter initialEntries={[route]}>
              <LinkProvider component={RouterLinkAdapter}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
              </LinkProvider>
            </MemoryRouter>
          </LayerProvider>
        </ColorModeProvider>
      </InternationalizationProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}
