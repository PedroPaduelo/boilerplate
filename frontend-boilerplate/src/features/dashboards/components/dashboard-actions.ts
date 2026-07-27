/**
 * Ações de UMA linha de dashboard (menu "…" da listagem).
 *
 * A decisão de QUAIS ações existem continua no RBAC compartilhado
 * (`availableArtifactActions`) — aqui só traduzimos aquela lista para o formato
 * declarativo do `DropdownMenu`/`MoreMenu` do Astryx (`items`). Ação sem
 * handler é ignorada, então a tela liga apenas o que sabe executar.
 */
import {
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Share2,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import type { IconType } from '@astryxdesign/core/Icon';
import {
  availableArtifactActions,
  type ArtifactActionKey,
  type ArtifactPermContext,
} from '@/shared/lib/artifact-rbac';

interface ActionMeta {
  label: string;
  icon: IconType;
  /** Insere um divisor ANTES desta ação (separa o destrutivo do resto). */
  dividerBefore?: boolean;
}

const ACTION_META: Record<ArtifactActionKey, ActionMeta> = {
  open: { label: 'Abrir', icon: ExternalLink },
  edit: { label: 'Editar', icon: Pencil },
  publish: { label: 'Publicar', icon: UploadCloud },
  unpublish: { label: 'Despublicar', icon: Upload },
  share: { label: 'Compartilhar', icon: Share2 },
  export: { label: 'Exportar', icon: Download },
  duplicate: { label: 'Duplicar', icon: Copy },
  delete: { label: 'Excluir', icon: Trash2, dividerBefore: true },
};

export type DashboardActionHandlers = Partial<Record<ArtifactActionKey, () => void>>;

/** Itens do menu de ações de um dashboard, já filtrados por permissão. */
export function buildDashboardActions(
  ctx: ArtifactPermContext,
  handlers: DashboardActionHandlers,
): DropdownMenuOption[] {
  const items: DropdownMenuOption[] = [];
  for (const key of availableArtifactActions(ctx)) {
    const onClick = handlers[key];
    if (!onClick) continue;
    const meta = ACTION_META[key];
    if (meta.dividerBefore && items.length > 0) items.push({ type: 'divider' });
    items.push({ label: meta.label, icon: meta.icon, onClick });
  }
  return items;
}
