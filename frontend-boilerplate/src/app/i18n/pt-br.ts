/**
 * Catálogo pt-BR do design system (Astryx).
 *
 * O Astryx embarca só `en.json` e `pseudo.json` — quem consome injeta os demais
 * idiomas via `<InternationalizationProvider messages={...}>`. Sem este arquivo
 * TODO texto que nasce dentro do DS sai em inglês no meio de uma interface em
 * português: `aria-label="Send"` no botão de enviar, "Scroll to bottom" no
 * tooltip do chat, "Copy code" no `CodeBlock`.
 *
 * ORDEM DAS CHAVES = a mesma de `@astryxdesign/core/locales/en.json`. É de
 * propósito: revisar tradução é diffar os dois arquivos lado a lado, e ordem
 * alfabética espalharia chaves irmãs (`sortedBy` / `sortedByWithPriority`) por
 * lugares distantes.
 *
 * REGRAS QUE VALERAM AQUI:
 *  - Limite físico manda. A `description` de cada chave no `en.json` diz onde a
 *    string cai ("keep short — narrow pill", "very short", "sits on a tiny icon
 *    button"). Rótulo de botão de ícone é "Enviar", não "Enviar mensagem".
 *  - Placeholder ICU é contrato: `{label}`, `{count, plural, ...}`, `{page,
 *    number}` são copiados literalmente. Trocar o nome não dá erro de
 *    compilação — quebra em runtime, na tela do usuário.
 *  - Rótulo de leitor de tela é DESCRITIVO, não literal: quem só ouve a tela
 *    precisa saber o que o botão faz, não a tradução palavra a palavra.
 *  - Vocabulário: o mesmo que as telas já usam ("Buscar…", "Sem dados",
 *    "Limpar", "Excluir", "Expandir"/"Recolher"). Termo técnico consagrado fica
 *    em inglês quando traduzir confunde mais.
 *
 * CHAVE FALTANDO NÃO QUEBRA: o `resolve()` do DS cai para `pt` e depois para o
 * `en` embarcado (ver `dist/i18n/resolve.js`). Uma atualização do DS que traga
 * chave nova degrada para inglês — feio, não fatal. Quem avisa é o teste de
 * cobertura em `app/__tests__/i18n.test.tsx`, que compara este catálogo com o
 * `en.json` instalado.
 */
import type { Catalog } from '@astryxdesign/core/i18n';

export const ptBR: Catalog = {
  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  '@astryx.pagination.label': { defaultMessage: 'Paginação' },
  '@astryx.pagination.previous': { defaultMessage: 'Ir para a página anterior' },
  '@astryx.pagination.next': { defaultMessage: 'Ir para a próxima página' },
  '@astryx.pagination.goToPage': { defaultMessage: 'Ir para a página {page, number}' },
  '@astryx.pagination.pageIndicators': { defaultMessage: 'Indicadores de página' },
  '@astryx.pagination.itemsPerPage': { defaultMessage: 'Itens por página' },
  '@astryx.pagination.count': {
    defaultMessage: '{from, number}–{to, number} de {total, number}',
  },
  '@astryx.pagination.pageOfTotal': {
    defaultMessage: 'Página {current, number} de {total, number}',
  },
  '@astryx.pagination.pageAnnounce': { defaultMessage: 'Página {current, number}' },

  // ---------------------------------------------------------------------------
  // PowerSearch — construtor de filtros
  // ---------------------------------------------------------------------------
  '@astryx.powersearch.editor.field': { defaultMessage: 'Campo' },
  '@astryx.powersearch.editor.operator': { defaultMessage: 'Operador' },
  '@astryx.powersearch.editor.addFilter': { defaultMessage: '+ Adicionar filtro' },
  '@astryx.powersearch.editor.removeFilter': { defaultMessage: 'Remover filtro' },
  '@astryx.powersearch.editor.groupOperator': { defaultMessage: 'Operador do grupo' },
  '@astryx.powersearch.editor.group': { defaultMessage: 'Grupo' },
  '@astryx.powersearch.editor.delete': { defaultMessage: 'Excluir' },
  '@astryx.powersearch.editor.cancel': { defaultMessage: 'Cancelar' },
  '@astryx.powersearch.editor.apply': { defaultMessage: 'Aplicar' },

  // ---------------------------------------------------------------------------
  // PowerSearch — editor de valor
  // ---------------------------------------------------------------------------
  '@astryx.powersearch.valueEditor.value': { defaultMessage: 'Valor' },
  '@astryx.powersearch.valueEditor.values': { defaultMessage: 'Valores' },
  // "Time" aqui é hora do relógio (HH:MM), não duração: "Hora", nunca "Tempo".
  '@astryx.powersearch.valueEditor.time': { defaultMessage: 'Hora' },
  '@astryx.powersearch.valueEditor.date': { defaultMessage: 'Data' },
  '@astryx.powersearch.valueEditor.relativeDate': { defaultMessage: 'Data relativa' },
  '@astryx.powersearch.valueEditor.startDate': { defaultMessage: 'Data inicial' },
  '@astryx.powersearch.valueEditor.endDate': { defaultMessage: 'Data final' },
  '@astryx.powersearch.valueEditor.entities': { defaultMessage: 'Entidades' },
  '@astryx.powersearch.valueEditor.searchPlaceholder': { defaultMessage: 'Buscar…' },
  '@astryx.powersearch.valueEditor.enterValuePlaceholder': {
    defaultMessage: 'Digite um valor…',
  },
  '@astryx.powersearch.valueEditor.addValuesPlaceholder': {
    defaultMessage: 'Adicione valores…',
  },
  '@astryx.powersearch.valueEditor.enterNumberPlaceholder': {
    defaultMessage: 'Digite um número…',
  },
  '@astryx.powersearch.valueEditor.selectValuesPlaceholder': {
    defaultMessage: 'Selecione valores…',
  },

  // ---------------------------------------------------------------------------
  // PowerSearch — operadores.
  // Rendem INLINE dentro da frase do filtro (`Nome contém acme`), então ficam em
  // minúscula e conjugados na 3ª pessoa, como no inglês.
  // ---------------------------------------------------------------------------
  '@astryx.powersearch.operator.contains': { defaultMessage: 'contém' },
  '@astryx.powersearch.operator.notContains': { defaultMessage: 'não contém' },
  '@astryx.powersearch.operator.startsWith': { defaultMessage: 'começa com' },
  '@astryx.powersearch.operator.notStartsWith': { defaultMessage: 'não começa com' },
  '@astryx.powersearch.operator.endsWith': { defaultMessage: 'termina com' },
  '@astryx.powersearch.operator.notEndsWith': { defaultMessage: 'não termina com' },
  '@astryx.powersearch.operator.is': { defaultMessage: 'é' },
  '@astryx.powersearch.operator.isNot': { defaultMessage: 'não é' },
  // O DS separa igualdade de TEXTO (`is`) da de NÚMERO (`equals`) justamente
  // para permitir divergir. Em português `Idade é 30` soa truncado — número usa
  // a forma matemática.
  '@astryx.powersearch.operator.equals': { defaultMessage: 'é igual a' },
  '@astryx.powersearch.operator.notEquals': { defaultMessage: 'é diferente de' },
  '@astryx.powersearch.operator.greaterThan': { defaultMessage: 'é maior que' },
  '@astryx.powersearch.operator.lessThan': { defaultMessage: 'é menor que' },
  '@astryx.powersearch.operator.greaterThanOrEqual': {
    defaultMessage: 'é maior ou igual a',
  },
  '@astryx.powersearch.operator.lessThanOrEqual': {
    defaultMessage: 'é menor ou igual a',
  },
  // Data: "anterior/posterior" e não "antes/depois de" — o valor vem colado
  // logo em seguida (`Criado é anterior a 01/01/2024`).
  '@astryx.powersearch.operator.before': { defaultMessage: 'é anterior a' },
  '@astryx.powersearch.operator.after': { defaultMessage: 'é posterior a' },
  '@astryx.powersearch.operator.between': { defaultMessage: 'está entre' },
  '@astryx.powersearch.operator.isTrue': { defaultMessage: 'é verdadeiro' },
  '@astryx.powersearch.operator.isFalse': { defaultMessage: 'é falso' },
  '@astryx.powersearch.operator.isAnyOf': { defaultMessage: 'é um dos' },
  '@astryx.powersearch.operator.isNoneOf': { defaultMessage: 'não é nenhum dos' },

  // ---------------------------------------------------------------------------
  // PowerSearch — resumos com plural (ICU)
  // ---------------------------------------------------------------------------
  '@astryx.powersearch.valueEditor.itemsCount': {
    defaultMessage: '{count, number} {count, plural, one {item} other {itens}}',
  },
  '@astryx.powersearch.valueEditor.entitiesCount': {
    defaultMessage: '{count, number} {count, plural, one {entidade} other {entidades}}',
  },
  '@astryx.powersearch.valueEditor.dateRange': { defaultMessage: 'intervalo de datas' },
  '@astryx.powersearch.valueEditor.filtersCount': {
    defaultMessage: '{count, number} {count, plural, one {filtro} other {filtros}}',
  },
  '@astryx.powersearch.resultCount': {
    defaultMessage: '{count, number} {count, plural, one {resultado} other {resultados}}',
  },

  // ---------------------------------------------------------------------------
  // AlertDialog, AppShell, AvatarGroup, Banner, Calendar, Carousel
  // ---------------------------------------------------------------------------
  '@astryx.alertDialog.cancel': { defaultMessage: 'Cancelar' },
  // "Mobile" = tela pequena (celular/tablet), não "móvel/que se move".
  '@astryx.appShell.mobileNavigation': { defaultMessage: 'Navegação em telas pequenas' },
  '@astryx.avatarGroup.label': { defaultMessage: 'Avatares' },
  // Banner é persistente: "Dispensar" (some agora) em vez de "Fechar", que fica
  // reservado para o que tem estado aberto/fechado (dialog, popover).
  '@astryx.banner.dismiss': { defaultMessage: 'Dispensar' },
  '@astryx.calendar.previousMonth': { defaultMessage: 'Mês anterior' },
  '@astryx.calendar.nextMonth': { defaultMessage: 'Próximo mês' },
  '@astryx.carousel.label': { defaultMessage: 'Carrossel' },
  '@astryx.carousel.scrollLeft': { defaultMessage: 'Rolar para a esquerda' },
  '@astryx.carousel.scrollRight': { defaultMessage: 'Rolar para a direita' },

  // ---------------------------------------------------------------------------
  // Chat — status de envio.
  // Concordam com "mensagem" (feminino) porque entram em
  // `@astryx.chat.messageAriaLabel`: "Mensagem entregue", "Mensagem lida".
  // ---------------------------------------------------------------------------
  '@astryx.chat.status.sending': { defaultMessage: 'Enviando' },
  '@astryx.chat.status.sent': { defaultMessage: 'Enviada' },
  '@astryx.chat.status.delivered': { defaultMessage: 'Entregue' },
  '@astryx.chat.status.read': { defaultMessage: 'Lida' },
  // "Failed" descreve o RESULTADO para quem escreveu: a mensagem não saiu.
  // "Falhou" no aria-label viraria "Mensagem Falhou" — agramatical.
  '@astryx.chat.status.failed': { defaultMessage: 'Não enviada' },
  '@astryx.chat.messageAriaLabel': { defaultMessage: 'Mensagem {status}' },
  '@astryx.chat.pastedText.expand': { defaultMessage: 'Expandir' },

  // ---------------------------------------------------------------------------
  // CheckboxList, CommandPalette (estados vazios), Date/Time inputs
  // ---------------------------------------------------------------------------
  '@astryx.checkboxList.item.checkbox': { defaultMessage: 'Caixa de seleção' },
  '@astryx.commandPalette.emptySearch': { defaultMessage: 'Nenhum resultado' },
  '@astryx.commandPalette.emptyBootstrap': { defaultMessage: 'Digite para buscar' },
  '@astryx.dateRangeInput.presetDateRanges': { defaultMessage: 'Períodos predefinidos' },
  '@astryx.dateTimeInput.timePlaceholder': { defaultMessage: 'Selecione um horário' },

  // ---------------------------------------------------------------------------
  // Dialog, DropdownMenu, Lightbox, Markdown, MobileNav
  // ---------------------------------------------------------------------------
  '@astryx.dialog.close': { defaultMessage: 'Fechar' },
  '@astryx.dropdownMenu.label': { defaultMessage: 'Menu' },
  '@astryx.lightbox.close': { defaultMessage: 'Fechar' },
  '@astryx.lightbox.previous': { defaultMessage: 'Anterior' },
  '@astryx.lightbox.next': { defaultMessage: 'Próximo' },
  '@astryx.markdown.taskList': { defaultMessage: 'Lista de tarefas' },
  '@astryx.markdown.table': { defaultMessage: 'Tabela' },
  '@astryx.mobileNav.closeNavigation': { defaultMessage: 'Fechar navegação' },

  // ---------------------------------------------------------------------------
  // MultiSelector, Popover, Selector
  // ---------------------------------------------------------------------------
  '@astryx.multiSelector.selectAll': { defaultMessage: 'Selecionar todos' },
  '@astryx.multiSelector.searchPlaceholder': { defaultMessage: 'Buscar…' },
  '@astryx.multiSelector.searchOptions': { defaultMessage: 'Buscar opções' },
  // "Popover" não é palavra de usuário; para quem ouve a tela, o que importa é
  // que aquilo é um painel flutuante que o botão fecha.
  '@astryx.popover.close': { defaultMessage: 'Fechar painel' },
  '@astryx.selector.searchPlaceholder': { defaultMessage: 'Buscar…' },
  '@astryx.selector.searchOptions': { defaultMessage: 'Buscar opções' },

  // ---------------------------------------------------------------------------
  // SideNav, TabList
  // ---------------------------------------------------------------------------
  '@astryx.sideNav.label': { defaultMessage: 'Navegação lateral' },
  '@astryx.sideNav.resizeSidebar': { defaultMessage: 'Redimensionar barra lateral' },
  '@astryx.sideNav.heading.openMenu': { defaultMessage: 'Abrir menu' },
  '@astryx.tabList.label': { defaultMessage: 'Abas' },

  // ---------------------------------------------------------------------------
  // Table — rótulo, vazio, filtros, seleção e ordenação
  // ---------------------------------------------------------------------------
  '@astryx.table.label': { defaultMessage: 'Tabela' },
  '@astryx.table.noData': { defaultMessage: 'Sem dados' },
  '@astryx.table.filter.allPlaceholder': { defaultMessage: 'Todos' },
  // O app chama isto de "Limpar filtros" nas telas; dentro do painel, "Limpar".
  '@astryx.table.filter.reset': { defaultMessage: 'Limpar' },
  '@astryx.table.filter.apply': { defaultMessage: 'Aplicar' },
  '@astryx.table.selection.selectAllRows': {
    defaultMessage: 'Selecionar todas as linhas',
  },
  '@astryx.table.selection.selectRow': { defaultMessage: 'Selecionar linha' },
  '@astryx.table.sort.ascending': { defaultMessage: 'Ordenar em ordem crescente' },
  '@astryx.table.sort.descending': { defaultMessage: 'Ordenar em ordem decrescente' },
  '@astryx.table.sort.clear': { defaultMessage: 'Remover ordenação' },
  // Palavras soltas: entram como `{direction}` nas duas chaves abaixo.
  '@astryx.table.sort.direction.ascending': { defaultMessage: 'crescente' },
  '@astryx.table.sort.direction.descending': { defaultMessage: 'decrescente' },
  '@astryx.table.sort.sortBy': { defaultMessage: 'Ordenar por {label}' },
  '@astryx.table.sort.sortedBy': {
    defaultMessage: 'Ordenar por {label}, em ordem {direction}',
  },
  '@astryx.table.sort.sortedByWithPriority': {
    defaultMessage:
      'Ordenar por {label}, em ordem {direction}, prioridade {rank, number} de {total, number}',
  },

  // ---------------------------------------------------------------------------
  // Toast, Tokenizer, TopNav, TreeList, Typeahead
  // ---------------------------------------------------------------------------
  '@astryx.toast.dismiss': { defaultMessage: 'Dispensar notificação' },
  '@astryx.toast.viewport': { defaultMessage: 'Notificações' },
  '@astryx.tokenizer.clearAll': { defaultMessage: 'Limpar tudo' },
  '@astryx.topNav.heading.openMenu': { defaultMessage: 'Abrir menu' },
  '@astryx.topNav.landmarkLabel': { defaultMessage: 'Navegação superior' },
  // "Children" = nós filhos da árvore. "Alternar filhos" seria literal e
  // incompreensível em voz alta.
  '@astryx.treeList.toggleChildren': {
    defaultMessage: 'Expandir ou recolher os subitens',
  },
  '@astryx.typeahead.emptySearchResults': {
    defaultMessage: 'Nenhum resultado encontrado',
  },
  '@astryx.typeahead.loading': { defaultMessage: 'Carregando' },
  '@astryx.typeahead.searchResults': { defaultMessage: 'Resultados da busca' },
  '@astryx.typeahead.clearSelection': { defaultMessage: 'Limpar seleção' },

  // ---------------------------------------------------------------------------
  // Breadcrumbs
  // ---------------------------------------------------------------------------
  '@astryx.breadcrumbs.label': { defaultMessage: 'Trilha de navegação' },

  // ---------------------------------------------------------------------------
  // Chat — composer
  // ---------------------------------------------------------------------------
  '@astryx.chat.composer.placeholder': { defaultMessage: 'Digite uma mensagem…' },
  '@astryx.chat.composerDrawer.label': { defaultMessage: 'Itens' },
  '@astryx.chat.composerInput.label': { defaultMessage: 'Campo de mensagem' },
  '@astryx.chat.speechRecognition.noSpeechDetected': {
    defaultMessage: 'Nenhuma fala foi detectada.',
  },

  // ---------------------------------------------------------------------------
  // CommandPalette, ContextMenu
  // ---------------------------------------------------------------------------
  '@astryx.commandPalette.label': { defaultMessage: 'Paleta de comandos' },
  '@astryx.commandPalette.input.placeholder': { defaultMessage: 'Buscar…' },
  '@astryx.commandPalette.list.label': { defaultMessage: 'Comandos' },
  '@astryx.contextMenu.label': { defaultMessage: 'Menu de contexto' },

  // ---------------------------------------------------------------------------
  // DateInput / DateRangeInput / DateTimeInput / TimeInput
  // ---------------------------------------------------------------------------
  '@astryx.dateInput.placeholder': { defaultMessage: 'Selecione uma data' },
  '@astryx.dateInput.dialogLabel': { defaultMessage: 'Escolher data' },
  '@astryx.dateInput.closeCalendar': { defaultMessage: 'Fechar calendário' },
  '@astryx.dateInput.openCalendar': { defaultMessage: 'Abrir calendário' },
  // Chave separada da de cima só para PERMITIR divergir (é o botão de fora, não
  // o X de dentro). O inglês manda a mesma string nas duas; mantemos igual.
  '@astryx.dateInput.toggleCalendarClose': { defaultMessage: 'Fechar calendário' },
  '@astryx.dateInput.clear': { defaultMessage: 'Limpar {label}' },
  '@astryx.dateTimeInput.timeSuffix': { defaultMessage: 'Horário de {label}' },
  '@astryx.dateRangeInput.placeholder': { defaultMessage: 'Selecione um período' },
  '@astryx.dateRangeInput.dialogLabel': { defaultMessage: 'Escolher período' },
  // O inglês fala só em "date" mesmo o campo sendo data+hora — não inventamos
  // o "e hora" que o DS deliberadamente não pôs.
  '@astryx.dateTimeInput.placeholder': { defaultMessage: 'Selecione uma data' },
  '@astryx.dateTimeInput.dialogLabel': { defaultMessage: 'Escolher data' },

  // ---------------------------------------------------------------------------
  // Link, MobileNav, MoreMenu, MultiSelector, Outline
  // ---------------------------------------------------------------------------
  '@astryx.link.newTab': { defaultMessage: '(abre em uma nova aba)' },
  '@astryx.mobileNav.toggle.open': { defaultMessage: 'Abrir navegação' },
  '@astryx.moreMenu.label': { defaultMessage: 'Mais opções' },
  '@astryx.multiSelector.selectPlaceholder': { defaultMessage: 'Selecione…' },
  '@astryx.outline.label': { defaultMessage: 'Sumário' },

  // ---------------------------------------------------------------------------
  // PowerSearch (raiz), Resizable, Selector, SideNav/TopNav headings
  // ---------------------------------------------------------------------------
  // Nome acessível do campo: substantivo ("Busca") lê melhor que o verbo.
  '@astryx.powersearch.label': { defaultMessage: 'Busca' },
  '@astryx.powersearch.placeholder': { defaultMessage: 'Buscar…' },
  '@astryx.resizable.handle.label': { defaultMessage: 'Divisor redimensionável' },
  '@astryx.selector.placeholder': { defaultMessage: 'Selecione…' },
  '@astryx.sideNav.heading.dialogLabel': { defaultMessage: 'Menu de navegação' },
  '@astryx.table.pagination.label': { defaultMessage: 'Paginação da tabela' },
  '@astryx.timeInput.placeholder': { defaultMessage: 'Selecione um horário' },
  '@astryx.topNav.heading.dialogLabel': { defaultMessage: 'Menu de navegação' },
  '@astryx.typeahead.searchPlaceholder': { defaultMessage: 'Buscar…' },

  // ---------------------------------------------------------------------------
  // Banner (expandir/recolher), ChatComposerDrawer
  // ---------------------------------------------------------------------------
  '@astryx.banner.collapse': { defaultMessage: 'Recolher' },
  '@astryx.banner.expand': { defaultMessage: 'Expandir' },
  '@astryx.chatComposerDrawer.expand': { defaultMessage: 'Expandir {label}' },
  '@astryx.chatComposerDrawer.collapse': { defaultMessage: 'Recolher {label}' },

  // ---------------------------------------------------------------------------
  // Chat — layout, mensagens e botões
  // ---------------------------------------------------------------------------
  // Pílula estreita flutuando sobre a conversa: duas palavras é o teto.
  '@astryx.chatLayout.newMessages': { defaultMessage: 'Novas mensagens' },
  // Tooltip VISÍVEL (não só leitor de tela): diz o destino, não o gesto.
  '@astryx.chatLayoutScrollButton.scrollToBottom': {
    defaultMessage: 'Ir para a última mensagem',
  },
  '@astryx.chatMessage.messageFrom': { defaultMessage: 'Mensagem de {sender}' },
  '@astryx.chatSendButton.stop': { defaultMessage: 'Parar' },
  // Botão de ícone (avião de papel): uma palavra. "Enviar mensagem" não cabe.
  '@astryx.chatSendButton.send': { defaultMessage: 'Enviar' },
  '@astryx.chatTriggerMenu.suggestions': { defaultMessage: 'Sugestões' },
  '@astryx.citation.label': { defaultMessage: 'Citação {number}: {title}' },

  // ---------------------------------------------------------------------------
  // CodeBlock
  // ---------------------------------------------------------------------------
  '@astryx.codeBlock.copied': { defaultMessage: 'Copiado' },
  '@astryx.codeBlock.copyCode': { defaultMessage: 'Copiar código' },
  '@astryx.codeBlock.code': { defaultMessage: 'Código' },

  // ---------------------------------------------------------------------------
  // FileInput, Lightbox, MobileNav, MultiSelector, NumberInput, Selector
  // ---------------------------------------------------------------------------
  '@astryx.fileInput.clearLabel': { defaultMessage: 'Limpar {label}' },
  '@astryx.lightbox.mediaViewer': { defaultMessage: 'Visualizador de mídia' },
  '@astryx.mobileNav.navigation': { defaultMessage: 'Navegação' },
  // "Clear all {label}" pediria concordância ("todos os"/"todas as") com um
  // rótulo de gênero desconhecido em runtime. "Limpar seleção de X" diz o mesmo
  // e funciona com qualquer rótulo.
  '@astryx.multiSelector.clearAll': { defaultMessage: 'Limpar seleção de {label}' },
  '@astryx.numberInput.clearLabel': { defaultMessage: 'Limpar {label}' },
  '@astryx.selector.clearLabel': { defaultMessage: 'Limpar {label}' },

  // ---------------------------------------------------------------------------
  // SideNav — colapso e itens
  // ---------------------------------------------------------------------------
  '@astryx.sideNavCollapseButton.expandSidebar': {
    defaultMessage: 'Expandir barra lateral',
  },
  '@astryx.sideNavCollapseButton.collapseSidebar': {
    defaultMessage: 'Recolher barra lateral',
  },
  '@astryx.sideNavItem.expand': { defaultMessage: 'Expandir {label}' },
  '@astryx.sideNavItem.collapse': { defaultMessage: 'Recolher {label}' },

  // ---------------------------------------------------------------------------
  // Table — filtro por coluna, agrupamento, expansão de linha e árvore
  // ---------------------------------------------------------------------------
  // Serve de rótulo visível, placeholder E aria-label ao mesmo tempo: curto.
  '@astryx.tableFiltering.filterByColumn': { defaultMessage: 'Filtrar {header}' },
  '@astryx.tableGroupedRows.expandGroup': { defaultMessage: 'Expandir grupo {groupKey}' },
  '@astryx.tableGroupedRows.collapseGroup': {
    defaultMessage: 'Recolher grupo {groupKey}',
  },
  '@astryx.tableRowExpansion.collapseRow': { defaultMessage: 'Recolher linha' },
  '@astryx.tableRowExpansion.expandRow': { defaultMessage: 'Expandir linha' },
  '@astryx.tableRowExpansion.collapseAllRows': {
    defaultMessage: 'Recolher todas as linhas',
  },
  '@astryx.tableRowExpansion.expandAllRows': {
    defaultMessage: 'Expandir todas as linhas',
  },
  '@astryx.tableTree.collapseRow': { defaultMessage: 'Recolher linha' },
  '@astryx.tableTree.expandRow': { defaultMessage: 'Expandir linha' },

  // ---------------------------------------------------------------------------
  // TextInput, Thumbnail, TimeInput, Token
  // ---------------------------------------------------------------------------
  '@astryx.textInput.clearLabel': { defaultMessage: 'Limpar {label}' },
  '@astryx.thumbnail.remove': { defaultMessage: 'Remover {accessibleName}' },
  '@astryx.thumbnail.open': { defaultMessage: 'Abrir {accessibleName}' },
  '@astryx.timeInput.clearLabel': { defaultMessage: 'Limpar {label}' },
  '@astryx.token.remove': { defaultMessage: 'Remover {label}' },
};
