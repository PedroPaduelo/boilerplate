/**
 * SELEÇÃO do editor — que peça do dashboard o inspetor está editando.
 *
 * O editor deixou de ser uma lista de formulários e passou a ser um CANVAS com
 * um inspetor ao lado (o desenho de Grafana, Metabase e Retool): clica-se na
 * coisa e edita-se a coisa. Isso exige um estado que a lista não precisava —
 * "o que está selecionado" —, e ele mora aqui, fora dos componentes, porque é
 * a única peça de estado que canvas e inspetor compartilham.
 *
 * A seleção é sempre resolvida CONTRA O LAYOUT ATUAL. Remover o bloco
 * selecionado, trocar de aba ou desfazer uma linha não pode deixar o inspetor
 * apontando para um id que não existe mais: ele voltaria a mostrar campos de um
 * fantasma, e o próximo clique em "Remover" agiria sobre nada. Resolvendo na
 * leitura (e não com um efeito de limpeza) o estado inválido simplesmente nunca
 * chega à tela.
 */
import { useCallback, useMemo, useState } from 'react';
import { findBlock, type EditorLayout } from './lib/layout-editor';

export type EditorSelection =
  /** Nada selecionado: o inspetor mostra o dashboard (título, filtros, abas). */
  | { kind: 'dashboard' }
  | { kind: 'row'; rowId: string }
  | { kind: 'block'; blockId: string };

export const DASHBOARD_SELECTION: EditorSelection = { kind: 'dashboard' };

export interface EditorSelectionState {
  /** Seleção JÁ validada contra o layout — nunca aponta para um id inexistente. */
  selection: EditorSelection;
  selectRow: (rowId: string) => void;
  selectBlock: (blockId: string) => void;
  clear: () => void;
  /** Atalhos de leitura para o canvas marcar o que está ativo. */
  isRowSelected: (rowId: string) => boolean;
  isBlockSelected: (blockId: string) => boolean;
}

export function useEditorSelection(layout: EditorLayout): EditorSelectionState {
  const [raw, setRaw] = useState<EditorSelection>(DASHBOARD_SELECTION);

  const selection = useMemo<EditorSelection>(() => {
    if (raw.kind === 'row') {
      return layout.rows.some((row) => row.id === raw.rowId) ? raw : DASHBOARD_SELECTION;
    }
    if (raw.kind === 'block') {
      return findBlock(layout, raw.blockId) ? raw : DASHBOARD_SELECTION;
    }
    return raw;
  }, [raw, layout]);

  const selectRow = useCallback((rowId: string) => setRaw({ kind: 'row', rowId }), []);
  const selectBlock = useCallback(
    (blockId: string) => setRaw({ kind: 'block', blockId }),
    [],
  );
  const clear = useCallback(() => setRaw(DASHBOARD_SELECTION), []);

  return {
    selection,
    selectRow,
    selectBlock,
    clear,
    isRowSelected: (rowId) => selection.kind === 'row' && selection.rowId === rowId,
    isBlockSelected: (blockId) =>
      selection.kind === 'block' && selection.blockId === blockId,
  };
}
