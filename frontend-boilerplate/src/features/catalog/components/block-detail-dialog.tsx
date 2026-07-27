/**
 * Dialog de DETALHES de um bloco do catálogo — modo PLAYGROUND.
 *
 * Casca fina: o conteúdo (preview ao vivo + painel de configuração) vive no
 * `BlockPlayground` (`./playground`), o mesmo usado pela tela de detalhe do
 * gráfico (`/charts/:id`) com os DADOS REAIS da query. Aqui ele roda com as
 * fixtures do catálogo (read-only, sem persistência).
 *
 * `fullscreen` porque o playground é um editor lado a lado — o dialog padrão
 * (400px) não comporta preview + inspetor. `purpose="form"` evita fechar sem
 * querer clicando fora enquanto se edita o JSON.
 *
 * Estado 100% local (reset por `manifest.type` via `key`): ao fechar e reabrir,
 * volta para `defaultProps` + `dataContract.example`.
 */
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import type { CatalogEntry } from '../lib/catalog-entries';
import { BlockPlayground } from './playground';

export interface BlockDetailDialogProps {
  entry: CatalogEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function BlockDetailDialog({ entry, onOpenChange }: BlockDetailDialogProps) {
  if (!entry) return null;

  return (
    <Dialog isOpen onOpenChange={onOpenChange} variant="fullscreen" purpose="form">
      <BlockPlayground
        key={entry.type}
        entry={entry}
        variant="dialog"
        header={
          <DialogHeader
            hasDivider
            title={entry.definition.manifest.name}
            subtitle={entry.type}
            onOpenChange={onOpenChange}
          />
        }
      />
    </Dialog>
  );
}
