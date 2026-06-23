/**
 * Dialog de DETALHES de um bloco do catálogo — modo PLAYGROUND.
 *
 * Casca fina: o conteúdo (preview ao vivo + painel de edição) vive no
 * componente reutilizável `BlockPlayground` (`./block-playground`), que também
 * é usado pela tela de detalhe do gráfico (`/charts/:id`) com os DADOS REAIS da
 * query. Aqui ele roda em `variant="dialog"` com as fixtures do catálogo
 * (read-only, sem persistência).
 *
 * Estado 100% local (reset por `manifest.type` via `key`). Ao fechar e reabrir,
 * volta para `defaultProps` + `dataContract.example`.
 */
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { CatalogEntry } from '../lib/catalog-entries';
import { BlockPlayground } from './block-playground';

interface BlockDetailDialogProps {
  entry: CatalogEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function BlockDetailDialog({ entry, onOpenChange }: BlockDetailDialogProps) {
  // `key` do conteúdo = type do bloco → ao trocar de bloco, reseta o estado.
  const dialogKey = entry?.type ?? 'none';

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      {/* Modal 90vw × 85vh. Sobrescreve o default do shadcn (sm:max-w-lg
          = 512px) com !important + max-w-none no sm pra garantir que
          SEMPRE vença o default, mesmo com Tailwind JIT reorderando. */}
      <DialogContent className="!max-w-none sm:!max-w-[90vw] w-[90vw] !w-[90vw] max-h-[85vh] overflow-hidden p-0 gap-0">
        {entry ? (
          <BlockPlayground key={dialogKey} entry={entry} variant="dialog" />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
