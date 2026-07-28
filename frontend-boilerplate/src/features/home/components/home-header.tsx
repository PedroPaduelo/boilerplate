/**
 * Abertura da Visão geral: quem é o usuário, o que a tela responde e as duas
 * ações que ele mais faz. Nada de KPI aqui — número é assunto da faixa abaixo.
 */
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Heading, Text } from '@astryxdesign/core/Text';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { greeting } from '../lib/greeting';

export interface HomeHeaderProps {
  userName: string | undefined;
  canManageArtifacts: boolean;
  isCreating: boolean;
  onCreateDashboard: () => void;
}

export function HomeHeader({
  userName,
  canManageArtifacts,
  isCreating,
  onCreateDashboard,
}: HomeHeaderProps) {
  const firstName = userName?.split(' ')[0] ?? 'que bom te ver';

  return (
    <HStack gap={4} justify="between" vAlign="start" wrap="wrap">
      <VStack gap={1} maxWidth={640}>
        <Text type="supporting">Visão geral</Text>
        <Heading level={2}>{`${greeting()}, ${firstName}`}</Heading>
        <Text type="supporting">
          Seu ponto de partida: o estado do ambiente, o que ficou pendente e um atalho
          para perguntar aos seus dados.
        </Text>
      </VStack>

      {canManageArtifacts ? (
        <HStack gap={2} wrap="wrap">
          <Button
            variant="primary"
            label="Perguntar ao agente"
            icon={<Icon icon={Sparkles} />}
            href="/chat"
          />
          <Button
            label="Novo dashboard"
            icon={<Icon icon={Plus} />}
            isLoading={isCreating}
            onClick={onCreateDashboard}
          />
        </HStack>
      ) : null}
    </HStack>
  );
}
