import type { LucideIcon } from 'lucide-react';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { ListItem } from '@astryxdesign/core/List';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { StatusDot, type StatusDotVariant } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { ArtifactDeleteRow } from './artifact-delete-row';

/**
 * Estado do artefato → ponto de cor + rótulo. Cor sozinha nunca carrega o
 * significado: o ponto é decorativo (`aria-hidden`) e quem nomeia o estado é o
 * texto ao lado, que também é o que o leitor de tela anuncia.
 */
interface StatusMeta {
  label: string;
  variant: StatusDotVariant;
}

const STATUS_META: Record<string, StatusMeta> = {
  PUBLISHED: { label: 'Publicado', variant: 'success' },
  DRAFT: { label: 'Rascunho', variant: 'neutral' },
};

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: 'Privado',
  DEPARTMENT: 'Departamento',
  ORG: 'Organização',
};

export interface ArtifactCardAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Motivo do desabilitado — vira sufixo do rótulo no menu. */
  disabledReason?: string;
  /** Insere um separador ANTES desta ação. */
  separatorBefore?: boolean;
}

/**
 * Props do modo de confirmação inline. Quando setado, a linha se TRANSFORMA em
 * uma confirmação (sem modal/overlay/portal) — ver `artifact-delete-row.tsx`.
 */
export interface ArtifactCardConfirming {
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export interface ArtifactCardProps {
  title: string;
  icon: LucideIcon;
  status: string;
  visibility: string;
  metaPrimary?: string;
  metaSecondary?: string;
  updatedAt: string;
  onOpen: () => void;
  onPrefetch?: () => void;
  actions: ArtifactCardAction[];
  confirming?: ArtifactCardConfirming;
}

/**
 * LINHA de artefato (dashboard ou gráfico) das telas de listagem.
 *
 * O nome do arquivo/export é histórico (as features já o importam como
 * `ArtifactCard`); o que ele renderiza é um `ListItem` — dado denso e
 * homogêneo se lê em LINHA, não em card. Uma grade de cards idênticos gasta
 * três vezes mais altura por item, quebra o alinhamento das colunas de
 * metadado e transforma varredura vertical em caça ao tesouro. O `List` do
 * pai dá os divisores e a densidade; aqui só descrevemos o conteúdo da linha.
 *
 * Anatomia: ícone do tipo → título (+ metadados) → estado, visibilidade,
 * atualização e o menu "…". O `ListItem` com `onClick` já embute o padrão de
 * botão invisível: a linha inteira é o alvo de clique e existe UM único ponto
 * de tabulação, sem roubar o foco do menu que vive no `endContent`.
 */
export function ArtifactCard({
  title,
  icon,
  status,
  visibility,
  metaPrimary,
  metaSecondary,
  updatedAt,
  onOpen,
  onPrefetch,
  actions,
  confirming,
}: ArtifactCardProps) {
  // MODO DE CONFIRMAÇÃO — a própria linha vira o painel de confirmação.
  if (confirming) {
    return (
      <ArtifactDeleteRow
        title={title}
        onConfirm={confirming.onConfirm}
        onCancel={confirming.onCancel}
        isPending={confirming.isPending}
      />
    );
  }

  const statusMeta = STATUS_META[status] ?? { label: status, variant: 'neutral' };
  const meta = [metaPrimary, metaSecondary].filter(Boolean).join(' · ');

  return (
    <ListItem
      data-testid="artifact-row"
      label={title}
      description={meta || undefined}
      startContent={<Icon icon={icon} color="secondary" />}
      endContent={
        <HStack gap={3} vAlign="center">
          <HStack gap={1.5} vAlign="center">
            <StatusDot
              variant={statusMeta.variant}
              label={statusMeta.label}
              aria-hidden="true"
            />
            <Text type="supporting">{statusMeta.label}</Text>
          </HStack>
          <Text type="supporting">{VISIBILITY_LABEL[visibility] ?? visibility}</Text>
          <Timestamp value={updatedAt} format="auto" type="supporting" hasTooltip />
          {actions.length > 0 ? (
            <MoreMenu
              label={`Ações de ${title}`}
              size="sm"
              items={toMenuItems(actions)}
            />
          ) : null}
        </HStack>
      }
      onClick={onOpen}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    />
  );
}

/**
 * Converte as ações do artefato em itens do `MoreMenu`. Ação desabilitada
 * carrega o MOTIVO no próprio rótulo — o menu não tem tooltip por item, e
 * item apagado sem explicação vira suporte técnico.
 */
function toMenuItems(actions: ArtifactCardAction[]): DropdownMenuOption[] {
  const items: DropdownMenuOption[] = [];
  for (const action of actions) {
    if (action.separatorBefore && items.length > 0) {
      items.push({ type: 'divider' });
    }
    const suffix =
      action.disabled && action.disabledReason ? ` (${action.disabledReason})` : '';
    items.push({
      label: `${action.label}${suffix}`,
      icon: <Icon icon={action.icon} />,
      isDisabled: action.disabled,
      onClick: action.disabled ? undefined : action.onSelect,
    });
  }
  return items;
}
