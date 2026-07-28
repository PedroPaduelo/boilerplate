/**
 * Tela do Chat — `/chat`.
 *
 * Frame: `Layout` com a lista de conversas no painel inicial, cabeçalho fixo e a
 * conversa ocupando o conteúdo. O scroll, a doca do composer e o botão de
 * "novas mensagens" são do `ChatLayout` (dentro de `ChatConversation`), não
 * nossos — por isso esta página não mede altura nem observa scroll.
 *
 * No mobile a lista fixa comeria dois terços da tela: abaixo de `md` ela vira um
 * diálogo, acionado pelo botão de conversas do cabeçalho.
 */
import { useState } from 'react';
import { Bot } from 'lucide-react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutPanel,
} from '@astryxdesign/core/Layout';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useConversations } from '../use-conversations';
import { ChatConversation } from './chat-conversation';
import { ChatConversationList } from './chat-conversation-list';
import { ChatHeader } from './chat-header';

/** Abaixo de `md` a lista fixa não cabe — mesmo limiar da navegação do shell. */
const COMPACT_QUERY = '(max-width: 767px)';

export function ChatPage() {
  const {
    conversations,
    activeId,
    activeConversation,
    isLoading,
    error,
    isAgentReady,
    isCreating,
    select,
    reload,
    create,
    remove,
  } = useConversations();

  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const conversationList = (
    <ChatConversationList
      conversations={conversations}
      activeId={activeId}
      isLoading={isLoading}
      error={error}
      isCreating={isCreating}
      onSelect={(id) => {
        select(id);
        setIsListOpen(false);
      }}
      onCreate={() => {
        create();
        setIsListOpen(false);
      }}
      onRetry={reload}
    />
  );

  return (
    <>
      <Layout
        height="fill"
        start={
          isCompact ? undefined : (
            <LayoutPanel hasDivider width={272} padding={0} label="Conversas">
              {conversationList}
            </LayoutPanel>
          )
        }
        header={
          <LayoutHeader hasDivider padding={3}>
            <ChatHeader
              title={activeConversation?.title ?? 'Chat com o agente'}
              isAgentReady={isAgentReady}
              isCompact={isCompact}
              onOpenList={() => setIsListOpen(true)}
              onDelete={activeId ? () => setIsDeleteOpen(true) : undefined}
            />
          </LayoutHeader>
        }
        content={
          /**
           * `flex min-h-0 flex-col` NÃO é enfeite — sem isso a conversa não rola.
           *
           * `isScrollable={false}` diz ao `LayoutContent` para não rolar (quem
           * rola é o `ChatLayout`, que precisa manter a doca do composer fixa).
           * Só que isso o deixa `display: block` com `overflow: clip`. O
           * `ChatLayout` se declara `flex: 1 1 0%` esperando um pai flex — num
           * pai block essas propriedades são INERTES, então ele assume
           * `height: auto` e cresce com o conteúdo, enquanto o pai corta o que
           * passa da altura da tela.
           *
           * Medido numa conversa real: pai com 779px visíveis, filho com 1413px
           * — 634px de resposta cortados e SEM scroll em lugar nenhum. O usuário
           * simplesmente não alcançava o fim da própria conversa.
           *
           * `flex-col` dá ao filho um contexto flex de verdade; `min-h-0` é o
           * que permite ele ENCOLHER (o padrão `min-height: auto` de um item
           * flex se recusa a ficar menor que o conteúdo — é a origem clássica
           * desse bug).
           */
          <LayoutContent
            padding={0}
            isScrollable={false}
            className="flex min-h-0 flex-col"
          >
            {isLoading ? (
              // Enquanto a lista não chega não dá para saber se o usuário tem
              // conversas: mostrar o vazio aqui AFIRMARIA que não tem — e quem
              // tem 20 conversas veria "crie uma conversa" a cada abertura.
              <Center height="100%">
                <Spinner size="lg" label="Carregando suas conversas" />
              </Center>
            ) : activeId ? (
              <ChatConversation
                key={activeId}
                conversationId={activeId}
                isAgentReady={isAgentReady}
              />
            ) : (
              <Center height="100%">
                <EmptyState
                  headingLevel={3}
                  icon={<Icon icon={Bot} size="lg" />}
                  title="Selecione ou crie uma conversa"
                  description="O agente de IA tem acesso aos seus dados e às ferramentas do sistema."
                  actions={
                    <Button
                      label="Nova conversa"
                      variant="primary"
                      isLoading={isCreating}
                      onClick={create}
                    />
                  }
                />
              </Center>
            )}
          </LayoutContent>
        }
      />

      {/* MOBILE: a mesma lista, em diálogo. Só é montada abaixo de `md` — no
          desktop ela já está no painel e duplicá-la duplicaria os controles. */}
      {isCompact ? (
        <Dialog isOpen={isListOpen} onOpenChange={setIsListOpen} width={320}>
          <DialogHeader title="Suas conversas" onOpenChange={setIsListOpen} />
          {conversationList}
        </Dialog>
      ) : null}

      <AlertDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Excluir conversa"
        description={`“${activeConversation?.title ?? 'Esta conversa'}” e todas as suas mensagens serão removidas. Não dá para desfazer.`}
        actionLabel="Excluir definitivamente"
        cancelLabel="Cancelar"
        onAction={() => {
          if (activeId) remove(activeId);
          setIsDeleteOpen(false);
        }}
      />
    </>
  );
}
