/**
 * Cabeçalho da conversa aberta.
 *
 * Só carrega o que muda com a conversa: título, saúde do agente e as duas ações
 * de contexto (abrir a lista no mobile, excluir a conversa). O `h1` da tela é o
 * do TopNav do shell, então o título aqui é `level={2}`.
 */
import { AlertCircle, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Heading, Text } from '@astryxdesign/core/Text';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';

export interface ChatHeaderProps {
  title: string;
  /** `false` quando a chave do provedor não está configurada no servidor. */
  isAgentReady: boolean | null;
  /** No mobile a lista de conversas vira diálogo — o gatilho mora aqui. */
  isCompact: boolean;
  onOpenList: () => void;
  /** Ausente quando não há conversa aberta para excluir. */
  onDelete?: () => void;
}

export function ChatHeader({
  title,
  isAgentReady,
  isCompact,
  onOpenList,
  onDelete,
}: ChatHeaderProps) {
  return (
    <HStack gap={3} vAlign="center" justify="between">
      <HStack gap={2} vAlign="center">
        {isCompact ? (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon icon={MessageSquare} />}
            label="Ver conversas"
            tooltip="Ver conversas"
            onClick={onOpenList}
          />
        ) : null}
        <VStack gap={0}>
          <Heading level={2} maxLines={1}>
            {title}
          </Heading>
          <Text type="supporting" maxLines={1}>
            Agente de IA com acesso aos seus dados
          </Text>
        </VStack>
      </HStack>

      <HStack gap={2} vAlign="center">
        {/* Badge só para a exceção: um selo "tudo certo" em toda tela vira ruído
            e faz o alerta real passar despercebido. */}
        {isAgentReady === false ? (
          <Badge
            variant="error"
            icon={<Icon icon={AlertCircle} />}
            label="Agente indisponível"
          />
        ) : null}
        {onDelete ? (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon icon={Trash2} />}
            label="Excluir conversa"
            tooltip="Excluir conversa"
            onClick={onDelete}
          />
        ) : null}
      </HStack>
    </HStack>
  );
}
