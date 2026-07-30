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
  canModifyArtifact,
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

/** Traduz uma lista de ações + handlers no formato de itens do DropdownMenu. */
function toMenuItems(
  keys: ArtifactActionKey[],
  handlers: DashboardActionHandlers,
  labels: Partial<Record<ArtifactActionKey, string>> = {},
): DropdownMenuOption[] {
  const items: DropdownMenuOption[] = [];
  for (const key of keys) {
    const onClick = handlers[key];
    if (!onClick) continue;
    const meta = ACTION_META[key];
    if (meta.dividerBefore && items.length > 0) items.push({ type: 'divider' });
    items.push({ label: labels[key] ?? meta.label, icon: meta.icon, onClick });
  }
  return items;
}

/** Itens do menu de ações de um dashboard, já filtrados por permissão. */
export function buildDashboardActions(
  ctx: ArtifactPermContext,
  handlers: DashboardActionHandlers,
): DropdownMenuOption[] {
  return toMenuItems(availableArtifactActions(ctx), handlers);
}

/**
 * Ações de um RELATÓRIO EXTERNO (legado) — propositalmente CURTAS.
 *
 * Publicar, exportar em PDF, compartilhar por link público e duplicar dependem
 * de um layout que este item não tem: o conteúdo mora fora daqui. Oferecê-los
 * seria entregar botões que só sabem falhar (e o backend recusa todos). Restam
 * as três operações que existem de verdade sobre um atalho: abrir o relatório,
 * corrigir o cadastro e tirá-lo da lista.
 */
export function buildExternalDashboardActions(
  ctx: ArtifactPermContext,
  handlers: DashboardActionHandlers,
): DropdownMenuOption[] {
  const keys: ArtifactActionKey[] = ['open'];
  if (canModifyArtifact(ctx)) keys.push('edit', 'delete');

  return toMenuItems(keys, handlers, {
    open: 'Abrir relatório',
    edit: 'Editar cadastro',
    // "Excluir" prometeria apagar o relatório — que continua existindo lá fora.
    delete: 'Remover da lista',
  });
}
