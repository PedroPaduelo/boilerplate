import type { ReactNode } from 'react';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading, Text } from '@astryxdesign/core/Text';

export interface ArtifactListHeaderProps {
  /** Categoria acima do título (ex.: "Artefatos"). */
  eyebrow: string;
  title: string;
  description: string;
  /** Ação primária da tela (ex.: "Novo dashboard"). */
  action?: ReactNode;
}

/**
 * Cabeçalho das telas de listagem: identifica ONDE o usuário está e qual é a
 * ação primária. O `eyebrow` é um `label` (não um heading) para não competir
 * com o `Heading` nem furar a sequência de níveis do documento — o `h1` da
 * página já vive no TopNav do shell, então aqui o título é `h2`.
 */
export function ArtifactListHeader({
  eyebrow,
  title,
  description,
  action,
}: ArtifactListHeaderProps) {
  return (
    <HStack gap={4} vAlign="start" hAlign="between" wrap="wrap">
      <VStack gap={1}>
        <Text type="label" color="secondary">
          {eyebrow}
        </Text>
        <Heading level={2}>{title}</Heading>
        <Text type="supporting" maxLines={2}>
          {description}
        </Text>
      </VStack>
      {action}
    </HStack>
  );
}
