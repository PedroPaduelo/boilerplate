/**
 * O título da conversa, editável no lugar.
 *
 * O nome vem do servidor no fim do primeiro turno — um resumo da primeira
 * pergunta ("Quais tabelas existem nas minhas conexões e o que cada uma r").
 * Serve para achar a conversa depois, mas é um chute do modelo: quem vai
 * reencontrá-la semanas depois — ou projetá-la numa apresentação — precisa
 * poder chamá-la do que ela é.
 *
 * Edição NO LUGAR, sem diálogo: renomear é uma correção de rótulo, e abrir uma
 * janela para trocar meia dúzia de caracteres é cerimônia demais. O texto vira
 * campo exatamente onde estava, com o mesmo tamanho — o layout não pula.
 *
 * Teclado é caminho de primeira classe: `Enter` confirma, `Esc` desiste e devolve
 * o valor anterior. Sair do campo (clicar fora, `Tab`) SALVA em vez de descartar:
 * quem digitou um nome novo e clicou na conversa ao lado quis renomear, não
 * jogar fora o que escreveu.
 */
import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { HStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';

/** Cabe na barra sem virar reticências, e ainda descreve uma conversa. */
const TITLE_MAX_LENGTH = 120;

export interface ConversationTitleProps {
  title: string;
  /**
   * Ausente quando não há conversa aberta: sem alvo, o título é só um rótulo
   * ("Chat com o agente") e não deve oferecer edição.
   */
  onRename?: (title: string) => void;
}

export function ConversationTitle({ title, onRename }: ConversationTitleProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = draft !== null;

  /**
   * Foco e seleção ao abrir: o usuário quase sempre quer TROCAR o nome gerado,
   * não emendar nele. Com o texto já selecionado, digitar substitui.
   */
  useEffect(() => {
    if (!isEditing) return;
    const input = inputRef.current;
    input?.focus();
    input?.select();
  }, [isEditing]);

  if (!isEditing || !onRename) {
    return (
      <HStack gap={1} vAlign="center">
        <Heading level={2} maxLines={1}>
          {title}
        </Heading>
        {onRename ? (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon icon={Pencil} />}
            label="Renomear conversa"
            tooltip="Renomear conversa"
            onClick={() => setDraft(title)}
          />
        ) : null}
      </HStack>
    );
  }

  /** Confirma o que foi digitado. Vazio (ou só espaços) mantém o nome atual. */
  const commit = () => {
    const clean = draft.trim();
    if (clean && clean !== title) onRename(clean);
    setDraft(null);
  };

  return (
    <TextInput
      ref={inputRef}
      label="Título da conversa"
      isLabelHidden
      size="sm"
      width={320}
      value={draft}
      // O limite é do CAMPO, não do servidor: um título quilométrico não é
      // rejeitado, ele estoura a barra e some atrás das reticências. Cortar na
      // digitação é mais honesto que aceitar e depois truncar na exibição.
      onChange={(value) => setDraft(value.slice(0, TITLE_MAX_LENGTH))}
      onEnter={commit}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        // Descarta o rascunho: `Esc` é a saída sem consequência. O `blur` que
        // vem em seguida não pode salvar o que acabou de ser abandonado —
        // por isso o rascunho é zerado ANTES de o campo perder o foco.
        setDraft(null);
      }}
    />
  );
}
