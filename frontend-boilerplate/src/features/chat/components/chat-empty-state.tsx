/**
 * Conversa vazia: boas-vindas + sugestões clicáveis.
 *
 * Clicar já ENVIA a pergunta (um clique em vez de "preencher e depois enviar"):
 * o objetivo é tirar o usuário do branco da página no menor número de passos.
 */
import { Bot } from 'lucide-react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { SUGGESTED_PROMPTS } from '../lib/suggested-prompts';

export interface ChatEmptyStateProps {
  onPick: (prompt: string) => void;
  /** Sem agente configurado não adianta sugerir: os cartões ficam inativos. */
  isDisabled?: boolean;
}

export function ChatEmptyState({ onPick, isDisabled = false }: ChatEmptyStateProps) {
  return (
    <VStack gap={6} hAlign="center" maxWidth={640} width="100%">
      <EmptyState
        icon={<Icon icon={Bot} size="lg" />}
        headingLevel={2}
        title="O que você quer investigar hoje?"
        description="Pergunte em português. O agente consulta suas conexões, escreve o SQL e devolve a resposta — com o gráfico pronto para salvar."
      />

      <Grid columns={{ minWidth: 260, max: 2 }} gap={2} width="100%">
        {SUGGESTED_PROMPTS.map(({ icon, title, prompt }) => (
          <ClickableCard
            key={title}
            label={title}
            padding={3}
            isDisabled={isDisabled}
            onClick={() => onPick(prompt)}
          >
            <HStack gap={3} vAlign="start">
              <Icon icon={icon} size="sm" color="accent" />
              <VStack gap={0.5}>
                <Text type="label">{title}</Text>
                <Text type="supporting" maxLines={2}>
                  {prompt}
                </Text>
              </VStack>
            </HStack>
          </ClickableCard>
        ))}
      </Grid>
    </VStack>
  );
}
