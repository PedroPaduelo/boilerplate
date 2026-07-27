/**
 * Ações de linha de um gráfico → itens de menu do DS.
 *
 * A LISTA de ações permitidas vem do RBAC compartilhado
 * (`availableArtifactActions`, que espelha o backend); aqui só traduzimos cada
 * chave para rótulo + ícone e ligamos no handler. Ação sem handler é ignorada.
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
  type LucideIcon,
} from 'lucide-react';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import {
  availableArtifactActions,
  type ArtifactActionKey,
  type ArtifactPermContext,
} from '@/shared/lib/artifact-rbac';

interface ActionMeta {
  label: string;
  icon: LucideIcon;
  /** Insere um divisor ANTES desta ação (separa o destrutivo do resto). */
  separatorBefore?: boolean;
}

const ACTION_META: Record<ArtifactActionKey, ActionMeta> = {
  open: { label: 'Abrir', icon: ExternalLink },
  edit: { label: 'Editar', icon: Pencil },
  publish: { label: 'Publicar', icon: UploadCloud },
  unpublish: { label: 'Despublicar', icon: Upload },
  share: { label: 'Compartilhar', icon: Share2 },
  export: { label: 'Exportar', icon: Download },
  duplicate: { label: 'Duplicar', icon: Copy },
  delete: { label: 'Excluir', icon: Trash2, separatorBefore: true },
};

export type ChartActionHandlers = Partial<Record<ArtifactActionKey, () => void>>;

/** Ações desabilitadas (chave → motivo, exibido no próprio rótulo). */
export type ChartDisabledActions = Partial<Record<ArtifactActionKey, string>>;

export function buildChartMenuItems(
  ctx: ArtifactPermContext,
  handlers: ChartActionHandlers,
  disabled: ChartDisabledActions = {},
): DropdownMenuOption[] {
  const items: DropdownMenuOption[] = [];
  for (const key of availableArtifactActions(ctx)) {
    const onClick = handlers[key];
    if (!onClick) continue;
    const meta = ACTION_META[key];
    const reason = disabled[key];
    if (meta.separatorBefore && items.length > 0) items.push({ type: 'divider' });
    items.push({
      label: reason ? `${meta.label} — ${reason}` : meta.label,
      // `icon` aceita o componente SVG direto (IconType) — sem JSX aqui.
      icon: meta.icon,
      isDisabled: Boolean(reason),
      onClick,
    });
  }
  return items;
}
