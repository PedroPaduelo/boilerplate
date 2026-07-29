/**
 * PALCO do grafo — as cores de tudo que não é dado, nos dois fundos.
 *
 * `background: "dark"` pinta a área de plotagem com o cinza mais profundo do
 * tema e reequilibra o cromo para ler sobre ele. É o visual clássico de mapa
 * de rede (Obsidian, mapas estelares): pontos luminosos sobre a noite. O bloco
 * não inventa um "modo escuro" próprio — cada cor continua saindo de token do
 * design system, só muda QUAIS tokens.
 *
 * Um módulo só para os dois canvases (2D e 3D) lerem do MESMO lugar: palco
 * divergindo entre projeções seria o defeito clássico de cor copiada.
 */
import type { ChartPalette } from '@/shared/ui';

export interface StageColors {
  /** Cor do fundo da plotagem — `null` = transparente (superfície do card). */
  fill: string | null;
  /** Halo que separa nós encostados (a cor do próprio fundo). */
  halo: string;
  /** Traço das ligações em repouso. */
  edge: string;
  /** Rótulo de nó. */
  label: string;
  /** Rótulo do nó sob o cursor. */
  labelActive: string;
}

/** Cores do palco para o fundo pedido. Tudo RESOLVIDO (vai para SVG). */
export function stageColors(palette: ChartPalette, dark: boolean): StageColors {
  if (!dark) {
    return {
      fill: null,
      halo: palette.chrome('surface'),
      edge: palette.chrome('axis'),
      label: palette.chrome('label'),
      labelActive: palette.chrome('emphasis'),
    };
  }
  return {
    // O cinza mais profundo do tema (não existe degrau acima de 800).
    fill: palette.token('--ds-color-grey-800'),
    halo: palette.token('--ds-color-grey-800'),
    // Sobre o fundo escuro o cromo clareia um degrau, senão some.
    edge: palette.token('--ds-color-grey-500'),
    label: palette.token('--ds-color-grey-400'),
    labelActive: palette.token('--ds-color-grey-100'),
  };
}
