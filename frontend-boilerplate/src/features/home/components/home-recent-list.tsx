/**
 * "Onde eu estava": os artefatos mexidos por último (dashboards ou gráficos).
 *
 * É uma LISTA com divisores, não uma grade de cards: os itens são homogêneos
 * (título, quando mudou, em que estado está) e ler em linha mantém as colunas
 * alinhadas na vertical — que é como se varre e se compara. A linha inteira é
 * o link para o artefato.
 *
 * Componente de apresentação puro: recebe itens prontos e não conhece query,
 * rota nem permissão.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot, type StatusDotVariant } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import type { RecentArtifact } from '../use-home-overview';

interface StatusMeta {
  label: string;
  variant: StatusDotVariant;
}

const STATUS_META: Record<string, StatusMeta> = {
  PUBLISHED: { label: 'Publicado', variant: 'success' },
  DRAFT: { label: 'Rascunho', variant: 'neutral' },
};

const SKELETON_ROWS = [0, 1, 2];

export interface HomeRecentListProps {
  title: string;
  icon: LucideIcon;
  items: RecentArtifact[];
  isLoading: boolean;
  /** Destino do artefato clicado. */
  itemHref: (item: RecentArtifact) => string;
  /** Destino do "ver todos" — e o texto completo dele (dois links "Ver todos"
   *  na mesma tela seriam indistinguíveis para quem navega por leitor de tela). */
  allHref: string;
  allLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  /** CTA do vazio; a página decide se o papel do usuário permite a ação. */
  emptyAction?: ReactNode;
}

export function HomeRecentList({
  title,
  icon,
  items,
  isLoading,
  itemHref,
  allHref,
  allLabel,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: HomeRecentListProps) {
  return (
    <VStack gap={2}>
      <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
        <HStack gap={2} vAlign="center">
          <Icon icon={icon} color="secondary" />
          <Heading level={3}>{title}</Heading>
        </HStack>
        <Link href={allHref} isStandalone>
          {allLabel}
        </Link>
      </HStack>

      {isLoading ? (
        <HomeRecentListSkeleton title={title} />
      ) : items.length === 0 ? (
        <EmptyState
          isCompact
          headingLevel={4}
          title={emptyTitle}
          description={emptyDescription}
          actions={emptyAction}
        />
      ) : (
        <List hasDividers density="compact">
          {items.map((item) => {
            const status = STATUS_META[item.status] ?? {
              label: item.status,
              variant: 'neutral' as StatusDotVariant,
            };
            return (
              <ListItem
                key={item.id}
                href={itemHref(item)}
                label={item.title}
                // `hasTooltip` desligado: a data mora DENTRO do link da linha e
                // o tooltip do Timestamp cria um segundo ponto de tabulação ali.
                description={
                  <Timestamp
                    value={item.updatedAt}
                    format="auto"
                    type="supporting"
                    hasTooltip={false}
                  />
                }
                endContent={
                  <HStack gap={1.5} vAlign="center">
                    <StatusDot
                      variant={status.variant}
                      label={status.label}
                      aria-hidden="true"
                    />
                    <Text type="supporting">{status.label}</Text>
                  </HStack>
                }
              />
            );
          })}
        </List>
      )}
    </VStack>
  );
}

/** Carregando: mesma anatomia da linha real (título, data e coluna de estado). */
function HomeRecentListSkeleton({ title }: { title: string }) {
  return (
    <VStack role="status" aria-label={`Carregando ${title.toLowerCase()}`}>
      <List hasDividers density="compact">
        {SKELETON_ROWS.map((row) => (
          <ListItem
            key={row}
            label={<Skeleton width="45%" height={14} radius={1} index={row} />}
            description={<Skeleton width="25%" height={12} radius={1} index={row} />}
            endContent={<Skeleton width={72} height={12} radius={1} index={row} />}
          />
        ))}
      </List>
    </VStack>
  );
}
