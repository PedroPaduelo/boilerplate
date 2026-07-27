/**
 * Atalho para o catálogo de blocos.
 *
 * É o caso legítimo de card: um item discreto, com fronteira de interação
 * clara, que leva a UM destino. `ClickableCard` já resolve alvo de clique,
 * foco visível e semântica de link (via `href` — o `LinkProvider` do shell
 * converte para navegação client-side).
 */
import { ArrowRight, Blocks } from 'lucide-react';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';

export function HomeCatalogShortcut() {
  return (
    <ClickableCard href="/catalog" label="Explore o catálogo de blocos" variant="muted">
      <HStack gap={3} vAlign="center">
        <Icon icon={Blocks} size="lg" color="accent" />
        <StackItem size="fill">
          <VStack gap={0.5}>
            <Text weight="medium">Explore o catálogo de blocos</Text>
            <Text type="supporting">
              Veja com dados de exemplo todos os blocos que você — e o agente — podem usar
              para montar um painel.
            </Text>
          </VStack>
        </StackItem>
        <Icon icon={ArrowRight} color="secondary" />
      </HStack>
    </ClickableCard>
  );
}
