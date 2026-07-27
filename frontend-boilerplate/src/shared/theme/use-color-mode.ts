import { useContext } from 'react';
import { ColorModeContext, type ColorModeState } from './color-mode-context';

/**
 * Modo de cor (light/dark/system) da aplicação.
 *
 * Não confundir com o `useTheme()` do Astryx: aquele resolve VALORES de token
 * para consumidores não-CSS (SVG/canvas dos gráficos); este controla a
 * PREFERÊNCIA de aparência do usuário.
 */
export function useColorMode(): ColorModeState {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode deve ser usado dentro de <ColorModeProvider>');
  }
  return context;
}
