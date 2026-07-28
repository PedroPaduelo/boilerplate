/**
 * O que o agente CRIOU no turno, como cartão acionável.
 *
 * Sem isto o agente anuncia em texto que fez um dashboard e o usuário precisa
 * caçá-lo na listagem: o trabalho fica pronto e some. O cartão leva direto ao
 * artefato — navegação pela prop `href` do DS, que o `LinkProvider` do shell
 * converte para client-side (sem recarregar a página e sem perder o socket).
 *
 * `deleted` é o caso que quebra a simetria: não há para onde ir, então o cartão
 * NÃO vira link (link morto é pior que nenhum link) e muda de peso visual —
 * "apaguei o seu dashboard" e "criei um dashboard" são fatos opostos e não
 * podem sair com a mesma cara.
 */
import { ArrowUpRight, BarChart3, LayoutDashboard, Trash2 } from 'lucide-react';
import type { BadgeVariant } from '@astryxdesign/core/Badge';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import type { ChatArtifact } from '../model';

type ArtifactKind = ChatArtifact['kind'];
type ArtifactAction = ChatArtifact['action'];

const KIND_LABEL: Record<ArtifactKind, string> = {
  chart: 'Gráfico',
  dashboard: 'Dashboard',
};

const KIND_ICON = { chart: BarChart3, dashboard: LayoutDashboard } as const;

/** Rotas reais das telas de detalhe (`/charts/:id`, `/dashboards/:id`). */
const KIND_PATH: Record<ArtifactKind, string> = {
  chart: '/charts',
  dashboard: '/dashboards',
};

const ACTION_LABEL: Record<ArtifactAction, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  published: 'Publicado',
  unpublished: 'Despublicado',
  deleted: 'Excluído',
};

const ACTION_VARIANT: Record<ArtifactAction, BadgeVariant> = {
  created: 'success',
  updated: 'info',
  published: 'success',
  unpublished: 'warning',
  deleted: 'error',
};

export interface ArtifactCardProps {
  artifact: ChatArtifact;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const { kind, id, title, action } = artifact;
  const kindLabel = KIND_LABEL[kind];
  const badge = <Badge variant={ACTION_VARIANT[action]} label={ACTION_LABEL[action]} />;

  if (action === 'deleted') {
    return (
      <Card padding={3} variant="red">
        <HStack gap={3} vAlign="center">
          <Icon icon={Trash2} size="sm" color="error" />
          <VStack gap={0.5}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              {/* Riscado: o item não existe mais — a informação não pode
                  depender só da cor do selo. */}
              <Text type="label" hasStrikethrough maxLines={1}>
                {title}
              </Text>
              {badge}
            </HStack>
            <Text type="supporting">
              {kindLabel} excluído pelo agente. Não há mais o que abrir.
            </Text>
          </VStack>
        </HStack>
      </Card>
    );
  }

  return (
    <ClickableCard
      padding={3}
      label={`Abrir ${kindLabel.toLowerCase()}: ${title}`}
      href={`${KIND_PATH[kind]}/${id}`}
    >
      <HStack gap={3} vAlign="center" justify="between">
        <HStack gap={3} vAlign="center">
          <Icon icon={KIND_ICON[kind]} size="sm" color="accent" />
          <VStack gap={0.5}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text type="label" maxLines={1}>
                {title}
              </Text>
              {badge}
            </HStack>
            <Text type="supporting">Abrir {kindLabel.toLowerCase()}</Text>
          </VStack>
        </HStack>
        <Icon icon={ArrowUpRight} size="sm" color="secondary" />
      </HStack>
    </ClickableCard>
  );
}
