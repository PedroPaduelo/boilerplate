/**
 * Duas proteções para o MESMO risco: perder trabalho não salvo.
 *
 *  1. ⌘S / Ctrl+S salva. É o gesto que todo mundo já tem no dedo — num editor,
 *     não interceptá-lo significa que o navegador abre "salvar página", que é
 *     ruído, e o rascunho continua sem salvar.
 *  2. Sair da página com alterações pendentes pede confirmação (`beforeunload`).
 *
 * Vive num hook, e não dentro do componente, porque o listener precisa de uma
 * REF para a ação: o objeto do rascunho é recriado a cada tecla digitada, e um
 * `useEffect` que dependesse dele registraria e removeria o listener a cada
 * caractere.
 */
import { useEffect, useRef } from 'react';

export interface EditorSaveGuardOptions {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function useEditorSaveGuard({
  isDirty,
  isSaving,
  onSave,
}: EditorSaveGuardOptions) {
  const state = useRef({ isDirty, isSaving, onSave });

  // A ref é atualizada num efeito, e não durante o render: escrever em ref no
  // corpo do componente é justamente o que a regra `react-hooks/refs` proíbe —
  // e com razão, porque no modo concorrente o render pode ser descartado.
  useEffect(() => {
    state.current = { isDirty, isSaving, onSave };
  }, [isDirty, isSaving, onSave]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveCombo =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's';
      if (!isSaveCombo) return;
      // Impedimos o "salvar página" do navegador SEMPRE que o atalho acontece
      // dentro do editor, mesmo sem nada a salvar: um diálogo de download no
      // meio da edição é pior do que um atalho que não faz nada.
      event.preventDefault();
      const { isDirty: dirty, isSaving: saving, onSave: save } = state.current;
      if (dirty && !saving) save();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!state.current.isDirty) return;
      event.preventDefault();
      // Navegadores modernos ignoram a mensagem e mostram a própria — o que
      // importa é `returnValue` estar setado.
      event.returnValue = '';
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
