/**
 * Faixa de continuações depois da resposta.
 *
 * Um clique já ENVIA — o mesmo contrato dos cartões do estado vazio. O agente
 * termina oferecendo próximos passos; se o usuário ainda tiver que redigir o
 * pedido na mão, a oferta era decorativa.
 *
 * Quem decide O QUE sugerir é `lib/follow-ups.ts` (função pura, testada). Este
 * componente só desenha — e sem sugestões não desenha nada: uma faixa vazia
 * ocuparia espaço prometendo uma ação que não existe.
 */
import { CornerDownLeft } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';

export interface FollowUpsProps {
  /** Continuações já derivadas da resposta (2 a 4). Vazio = não renderiza. */
  suggestions: readonly string[];
  /** Recebe o texto EXATO que vai virar a próxima pergunta. */
  onSelect: (prompt: string) => void;
  /** Agente offline ou turno em andamento: sugerir sem poder enviar frustra. */
  isDisabled?: boolean;
}

export function FollowUps({ suggestions, onSelect, isDisabled = false }: FollowUpsProps) {
  if (suggestions.length === 0) return null;

  return (
    <HStack
      gap={2}
      vAlign="center"
      wrap="wrap"
      role="group"
      aria-label="Continuar a conversa"
    >
      <Text type="supporting">Continuar com</Text>
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          size="sm"
          variant="secondary"
          label={suggestion}
          icon={<Icon icon={CornerDownLeft} />}
          isDisabled={isDisabled}
          tooltip={isDisabled ? 'O agente está indisponível agora.' : undefined}
          onClick={() => onSelect(suggestion)}
        />
      ))}
    </HStack>
  );
}
