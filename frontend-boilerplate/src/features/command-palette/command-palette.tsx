/**
 * Paleta de comandos (⌘K / Ctrl+K).
 *
 * Por que existe: o público do auditorIA é técnico (analistas, auditores) e
 * trabalha em sessões longas. Navegar por cliques na sidebar para achar um
 * dashboard entre dezenas é lento. A paleta dá acesso a QUALQUER lugar do
 * produto — navegação, artefatos por nome e ações — sem tirar as mãos do
 * teclado.
 *
 * Busca, navegação por teclado (setas/Home/End/Enter/Esc), agrupamento e o
 * rodapé de dicas vêm do `CommandPalette` do design system; aqui só montamos os
 * itens e reagimos à escolha.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandPalette as Palette } from '@astryxdesign/core/CommandPalette';
import { CommandPaletteInput } from '@astryxdesign/core/CommandPalette';
import { createStaticSource } from '@astryxdesign/core/Typeahead';
import { Kbd } from '@astryxdesign/core/Kbd';
import { useCommandActions, type CommandAction } from './use-command-actions';
import { CommandPaletteRow } from './command-palette-row';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const actions = useCommandActions();

  // ⌘K / Ctrl+K abre e fecha; a própria paleta trata Esc.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchSource = useMemo(
    () =>
      createStaticSource(actions, {
        keywords: (item) => item.auxiliaryData?.keywords ?? [],
      }),
    [actions],
  );

  const handleSelect = useCallback(
    (id: string) => {
      actions.find((action) => action.id === id)?.auxiliaryData?.run();
    },
    [actions],
  );

  const renderItem = useCallback(
    (item: CommandAction) => <CommandPaletteRow item={item} />,
    [],
  );

  return (
    <Palette
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onValueChange={handleSelect}
      searchSource={searchSource}
      renderItem={renderItem}
      label="Paleta de comandos"
      input={
        <CommandPaletteInput
          placeholder="Buscar dashboards, gráficos, conexões ou ações…"
          endContent={<Kbd keys="escape" />}
        />
      }
      emptySearchText="Nada encontrado. Tente outro termo."
      emptyBootstrapText="Digite para buscar dashboards, gráficos e conexões."
    />
  );
}
