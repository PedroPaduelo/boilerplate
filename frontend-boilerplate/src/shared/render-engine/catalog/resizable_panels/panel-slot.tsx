/**
 * Um painel redimensionável + a divisória que o separa do próximo.
 *
 * Cada painel é um COMPONENTE próprio de propósito único porque cada um tem seu
 * próprio estado de tamanho (`useResizable`). Manter um hook por componente
 * (em vez de um hook por painel dentro do pai) é o que permite adicionar ou
 * remover filhos em runtime — no editor de dashboard, por exemplo — sem
 * violar as regras dos hooks.
 *
 * A direção decide QUAL zona do `Layout` hospeda o painel:
 *  - `horizontal` → `LayoutPanel` (largura arrastável, divisória vertical);
 *  - `vertical`   → `LayoutHeader` (altura arrastável, divisória horizontal).
 */
import type { ReactNode } from 'react';
import { LayoutHeader, LayoutPanel } from '@astryxdesign/core/Layout';
import { ResizeHandle, useResizable } from '@astryxdesign/core/Resizable';

export type PanelDirection = 'horizontal' | 'vertical';

/** Tamanho mínimo de um painel (px) — abaixo disso o conteúdo fica ilegível. */
const MIN_PANEL_SIZE = 96;

export interface PanelSlotProps {
  direction: PanelDirection;
  /** Tamanho inicial: px (número) ou porcentagem (ex.: '30%'). */
  defaultSize: number | string;
  /** Rótulo acessível da divisória (lido por leitor de tela). */
  label: string;
  children: ReactNode;
}

export function PanelSlot({ direction, defaultSize, label, children }: PanelSlotProps) {
  const region = useResizable({ defaultSize, minSizePx: MIN_PANEL_SIZE });
  const isHorizontal = direction === 'horizontal';

  return (
    <>
      {isHorizontal ? (
        <LayoutPanel width={region.size} padding={2} data-slot="resizable-panel">
          {children}
        </LayoutPanel>
      ) : (
        <LayoutHeader height={region.size} padding={2} data-slot="resizable-panel">
          {children}
        </LayoutHeader>
      )}
      <ResizeHandle
        direction={direction}
        hasDivider
        resizable={region.props}
        label={label}
      />
    </>
  );
}
