import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { auditoriaTheme } from './ds/auditoria';
import {
  COLOR_MODE_STORAGE_KEY,
  ColorModeContext,
  type ColorMode,
} from './color-mode-context';

function systemMode(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredMode(fallback: ColorMode): ColorMode {
  try {
    return (localStorage.getItem(COLOR_MODE_STORAGE_KEY) as ColorMode | null) ?? fallback;
  } catch {
    // localStorage bloqueado (modo privado): segue no padrão.
    return fallback;
  }
}

/**
 * Controlador ÚNICO da aparência.
 *
 * O Astryx é `color-scheme`-driven (usa `light-dark()` no CSS), não tem classe
 * `.dark`. Este provider é o único lugar que escreve aparência no `<html>`:
 *
 *   - `style.colorScheme` → o que o Astryx (e os controles nativos do browser,
 *     como scrollbars e autofill) realmente leem;
 *   - `<Theme mode>`      → propaga o modo para os componentes Astryx e faz o
 *     `useTheme()` resolver os tokens certos nos gráficos.
 */
export function ColorModeProvider({
  children,
  defaultMode = 'dark',
}: {
  children: ReactNode;
  defaultMode?: ColorMode;
}) {
  const [mode, setModeState] = useState<ColorMode>(() => readStoredMode(defaultMode));
  const [systemPreference, setSystemPreference] = useState<'dark' | 'light'>(systemMode);

  const resolvedMode = mode === 'system' ? systemPreference : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  // Só observa o SO quando a preferência é `system` — fora disso a escolha
  // explícita do usuário manda.
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) =>
      setSystemPreference(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ColorMode) => {
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
    } catch {
      // Persistência é best-effort; a troca vale para a sessão atual.
    }
    setModeState(next);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, resolvedMode }),
    [mode, setMode, resolvedMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <Theme theme={auditoriaTheme} mode={resolvedMode}>
        {children}
      </Theme>
    </ColorModeContext.Provider>
  );
}
