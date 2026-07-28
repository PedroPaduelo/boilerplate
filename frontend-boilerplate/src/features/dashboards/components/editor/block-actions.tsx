/**
 * Ações de UM bloco: editar, mover dentro da linha (←/→), mover para a linha
 * de cima/baixo, duplicar e remover. Sem drag-and-drop (decisão do MVP), o que
 * também deixa tudo operável por teclado.
 *
 * As setas são HORIZONTAIS de propósito. Antes eram ↑/↓ — herança do editor em
 * lista, onde os blocos de uma linha apareciam empilhados num formulário. No
 * canvas eles estão lado a lado, como no dashboard de verdade, e uma seta para
 * cima que move o bloco para a esquerda é uma instrução errada sobre o que vai
 * acontecer. Mover ENTRE linhas continua vertical (`ChevronsUp/Down`), porque
 * aí o movimento é mesmo vertical.
 *
 * Nas bordas o botão fica DESABILITADO com o motivo no tooltip, em vez de
 * sumir: um controle que aparece e desaparece conforme a posição faz a barra
 * "pular" e esconde do usuário que a ação existe.
 */
import {
  ArrowLeft,
  ArrowRight,
  ChevronsDown,
  ChevronsUp,
  Copy,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/Layout';

export interface BlockActionsProps {
  /** Nome humano do bloco — compõe o nome acessível de cada botão. */
  blockLabel: string;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canMoveRowUp: boolean;
  canMoveRowDown: boolean;
  /** Ausente no inspetor (lá o bloco já está aberto para edição). */
  onEdit?: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function BlockActions({
  blockLabel,
  canMoveLeft,
  canMoveRight,
  canMoveRowUp,
  canMoveRowDown,
  onEdit,
  onMoveLeft,
  onMoveRight,
  onMoveRowUp,
  onMoveRowDown,
  onDuplicate,
  onRemove,
}: BlockActionsProps) {
  return (
    <HStack gap={0.5} vAlign="center">
      {onEdit ? (
        <IconButton
          label={`Editar o bloco ${blockLabel}`}
          tooltip="Editar bloco"
          icon={<Icon icon={SlidersHorizontal} />}
          variant="ghost"
          size="sm"
          onClick={onEdit}
        />
      ) : null}
      <IconButton
        label={`Mover o bloco ${blockLabel} para a esquerda`}
        tooltip={canMoveLeft ? 'Mover para a esquerda' : 'Já é o primeiro da linha.'}
        icon={<Icon icon={ArrowLeft} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveLeft}
        onClick={onMoveLeft}
      />
      <IconButton
        label={`Mover o bloco ${blockLabel} para a direita`}
        tooltip={canMoveRight ? 'Mover para a direita' : 'Já é o último da linha.'}
        icon={<Icon icon={ArrowRight} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveRight}
        onClick={onMoveRight}
      />
      <IconButton
        label={`Mover o bloco ${blockLabel} para a linha acima`}
        tooltip={canMoveRowUp ? 'Mover para a linha acima' : 'Não há linha acima.'}
        icon={<Icon icon={ChevronsUp} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveRowUp}
        onClick={onMoveRowUp}
      />
      <IconButton
        label={`Mover o bloco ${blockLabel} para a linha abaixo`}
        tooltip={canMoveRowDown ? 'Mover para a linha abaixo' : 'Não há linha abaixo.'}
        icon={<Icon icon={ChevronsDown} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveRowDown}
        onClick={onMoveRowDown}
      />
      <IconButton
        label={`Duplicar o bloco ${blockLabel}`}
        tooltip="Duplicar (a cópia mantém a consulta)"
        icon={<Icon icon={Copy} />}
        variant="ghost"
        size="sm"
        onClick={onDuplicate}
      />
      <IconButton
        label={`Remover o bloco ${blockLabel}`}
        tooltip="Remover bloco"
        icon={<Icon icon={Trash2} />}
        variant="ghost"
        size="sm"
        onClick={onRemove}
      />
    </HStack>
  );
}
