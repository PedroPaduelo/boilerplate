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
import type { ArtifactActionKey, ArtifactPermContext } from '@/shared/lib/artifact-rbac';
import { availableArtifactActions } from '@/shared/lib/artifact-rbac';
import type { ArtifactCardAction } from './artifact-card';

interface ActionMeta {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
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
  delete: { label: 'Excluir', icon: Trash2, destructive: true, separatorBefore: true },
};

/** Motivo padrão exibido junto de uma ação desabilitada. */
const DEFAULT_DISABLED_REASON = 'indisponível agora';

export type ArtifactActionHandlers = Partial<Record<ArtifactActionKey, () => void>>;

/**
 * Converte as ações permitidas (por RBAC) em itens prontos para o
 * `ArtifactCard`, ligando cada uma ao handler correspondente. Ações sem handler
 * são ignoradas. `disabledKeys` mostra a ação DESABILITADA com o motivo no
 * rótulo (ex.: "Exportar (chega com o PDF)") — some-a-esmo é pior: o usuário
 * fica procurando um recurso que ele sabe que existe.
 */
export function buildArtifactCardActions(
  ctx: ArtifactPermContext,
  handlers: ArtifactActionHandlers,
  disabledKeys: ArtifactActionKey[] = [],
  disabledReason: string = DEFAULT_DISABLED_REASON,
): ArtifactCardAction[] {
  const result: ArtifactCardAction[] = [];
  for (const key of availableArtifactActions(ctx)) {
    const handler = handlers[key];
    if (!handler) continue;
    const meta = ACTION_META[key];
    const disabled = disabledKeys.includes(key);
    result.push({
      key,
      label: meta.label,
      icon: meta.icon,
      onSelect: handler,
      destructive: meta.destructive,
      separatorBefore: meta.separatorBefore,
      disabled,
      disabledReason: disabled ? disabledReason : undefined,
    });
  }
  return result;
}
