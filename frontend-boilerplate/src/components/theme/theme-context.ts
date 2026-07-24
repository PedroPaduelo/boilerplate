import { createContext } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
};

/**
 * O default do contexto é `undefined` DE PROPÓSITO.
 *
 * Antes havia um `initialState` cujo `setTheme` era um no-op (`() => null`).
 * Como `createContext` entregava esse objeto fora do provider, a checagem
 * `context === undefined` do `useTheme` nunca disparava: um componente montado
 * fora do `<ThemeProvider>` continuava renderizando e o clique no toggle
 * simplesmente NÃO FAZIA NADA, sem erro nem aviso. Com `undefined`, o erro
 * aparece na hora, no lugar certo.
 */
export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
);
