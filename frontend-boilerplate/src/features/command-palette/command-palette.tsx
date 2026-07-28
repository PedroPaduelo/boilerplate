/**
 * Paleta de comandos (⌘K / Ctrl+K).
 *
 * Por que existe: o público do auditorIA é técnico (analistas, auditores) e
 * trabalha em sessões longas. Navegar por cliques na sidebar para achar um
 * dashboard entre dezenas é lento. A paleta dá acesso a QUALQUER lugar do
 * produto — navegação, artefatos por nome e ações — sem tirar as mãos do
 * teclado.
 *
 * E, desde esta versão, também a QUALQUER PERGUNTA: digitar um texto que não
 * casa com nada oferece "Perguntar ao agente: «…»" no topo. A pergunta viaja
 * na URL (`/chat?q=`) e chega escrita no composer, pronta para revisar e
 * enviar. Não disparamos o turno sozinho: numa ferramenta de auditoria a
 * pergunta é a premissa da evidência — quem pergunta confere antes de gastar
 * uma execução.
 *
 * Busca, navegação por teclado (setas/Home/End/Enter/Esc), agrupamento e o
 * rodapé de dicas vêm do `CommandPalette` do design system; aqui só montamos os
 * itens e reagimos à escolha.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandPalette as Palette } from '@astryxdesign/core/CommandPalette';
import { CommandPaletteInput } from '@astryxdesign/core/CommandPalette';
import { createStaticSource, type SearchSource } from '@astryxdesign/core/Typeahead';
import { Kbd } from '@astryxdesign/core/Kbd';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { useCommandActions, type CommandAction } from './use-command-actions';
import { buildAskItem, readAskQuestion } from './lib/command-items';
import { CommandPaletteRow } from './command-palette-row';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const actions = useCommandActions();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = hasPermission(role, 'artifacts:manage');

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

  /**
   * Fonte de busca = a lista estática + o item "perguntar" no topo.
   *
   * Envolver em vez de concatenar antes: o item depende do que foi DIGITADO,
   * então só pode nascer dentro do `search`.
   */
  const searchSource = useMemo<SearchSource<CommandAction>>(() => {
    const base = createStaticSource(actions, {
      keywords: (item) => item.auxiliaryData?.keywords ?? [],
    });
    return {
      search: async (query: string) => {
        const results = await base.search(query);
        const ask = buildAskItem(query, {
          canManage,
          canUseConnections: false,
          isAdmin: false,
        });
        return ask ? [ask, ...results] : results;
      },
      bootstrap: () => base.bootstrap(),
    };
  }, [actions, canManage]);

  const handleSelect = useCallback(
    (id: string) => {
      // O item "perguntar" carrega o texto no id — ele não está na lista
      // estática, então procurá-lo por lá nunca acharia nada.
      const question = readAskQuestion(id);
      if (question) {
        navigate(`/chat?q=${encodeURIComponent(question)}`);
        return;
      }
      actions.find((action) => action.id === id)?.auxiliaryData?.run();
    },
    [actions, navigate],
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
          placeholder="Buscar dashboards, gráficos, conexões — ou perguntar ao agente…"
          endContent={<Kbd keys="escape" />}
        />
      }
      emptySearchText="Nada encontrado com esse termo. Escreva uma pergunta para mandar ao agente."
      emptyBootstrapText="Digite para buscar dashboards, gráficos e conexões — ou faça uma pergunta."
    />
  );
}
