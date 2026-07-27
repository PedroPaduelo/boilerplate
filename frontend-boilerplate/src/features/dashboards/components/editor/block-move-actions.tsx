/**
 * Ações de posição de UM bloco: mover dentro da linha (↑/↓), mover para a linha
 * de cima/baixo, e remover. Sem drag-and-drop (decisão do MVP) — o que também
 * deixa a operação inteira acessível por teclado.
 *
 * Nas bordas o botão fica DESABILITADO com o motivo no tooltip, em vez de
 * sumir: um controle que aparece e desaparece conforme a posição faz a barra
 * "pular" e esconde do usuário que a ação existe.
 */
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Trash2 } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/Layout';

export interface BlockMoveActionsProps {
  /** Compõe o nome acessível de cada botão (há vários blocos por tela). */
  blockId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveRowUp: boolean;
  canMoveRowDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onRemove: () => void;
}

export function BlockMoveActions({
  blockId,
  canMoveUp,
  canMoveDown,
  canMoveRowUp,
  canMoveRowDown,
  onMoveUp,
  onMoveDown,
  onMoveRowUp,
  onMoveRowDown,
  onRemove,
}: BlockMoveActionsProps) {
  return (
    <HStack gap={0.5} vAlign="center">
      <IconButton
        label={`Mover o bloco ${blockId} para cima`}
        tooltip={canMoveUp ? 'Mover para cima' : 'Já é o primeiro bloco da linha.'}
        icon={<Icon icon={ArrowUp} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveUp}
        onClick={onMoveUp}
      />
      <IconButton
        label={`Mover o bloco ${blockId} para baixo`}
        tooltip={canMoveDown ? 'Mover para baixo' : 'Já é o último bloco da linha.'}
        icon={<Icon icon={ArrowDown} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveDown}
        onClick={onMoveDown}
      />
      <IconButton
        label={`Mover o bloco ${blockId} para a linha acima`}
        tooltip={canMoveRowUp ? 'Mover para a linha acima' : 'Não há linha acima.'}
        icon={<Icon icon={ChevronsUp} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveRowUp}
        onClick={onMoveRowUp}
      />
      <IconButton
        label={`Mover o bloco ${blockId} para a linha abaixo`}
        tooltip={canMoveRowDown ? 'Mover para a linha abaixo' : 'Não há linha abaixo.'}
        icon={<Icon icon={ChevronsDown} />}
        variant="ghost"
        size="sm"
        isDisabled={!canMoveRowDown}
        onClick={onMoveRowDown}
      />
      <IconButton
        label={`Remover o bloco ${blockId}`}
        tooltip="Remover bloco"
        icon={<Icon icon={Trash2} />}
        variant="ghost"
        size="sm"
        onClick={onRemove}
      />
    </HStack>
  );
}
