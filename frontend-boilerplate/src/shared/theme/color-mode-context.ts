import { createContext } from 'react';

/** Preferência do usuário. `system` acompanha o SO. */
export type ColorMode = 'dark' | 'light' | 'system';

export type ColorModeState = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  /** `system` já resolvido para o valor efetivo — use este para renderizar. */
  resolvedMode: 'dark' | 'light';
};

/**
 * O default é `undefined` DE PROPÓSITO.
 *
 * Com um objeto default cujo `setMode` fosse no-op, um componente montado fora
 * do provider continuaria renderizando e o toggle simplesmente não faria nada,
 * sem erro nem aviso. Com `undefined`, `useColorMode()` estoura na hora, no
 * lugar certo.
 *
 * Nome: `ColorMode` (e não `Theme`) para não colidir com o `useTheme()` do
 * Astryx, que resolve TOKENS do tema — responsabilidade diferente desta.
 */
export const ColorModeContext = createContext<ColorModeState | undefined>(undefined);

/** Chave de persistência. Mantida como `theme` para preservar a preferência já
 *  salva nos navegadores dos usuários e continuar casando com o script
 *  anti-flash do `index.html`. */
export const COLOR_MODE_STORAGE_KEY = 'theme';
