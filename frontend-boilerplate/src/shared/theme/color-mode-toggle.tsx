import { Moon, Sun } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { useColorMode } from './use-color-mode';

/** Alterna entre claro e escuro. O rótulo descreve a AÇÃO (o que vai
 *  acontecer), não o estado atual — é o que o leitor de tela anuncia. */
export function ColorModeToggle() {
  const { resolvedMode, setMode } = useColorMode();
  const isDark = resolvedMode === 'dark';

  return (
    <IconButton
      variant="ghost"
      icon={<Icon icon={isDark ? Sun : Moon} />}
      label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
    />
  );
}
