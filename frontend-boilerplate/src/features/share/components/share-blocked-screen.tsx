/**
 * Bloqueio do link público (T-G1): revogado, expirado, inexistente ou falha.
 *
 * Quem cai aqui NÃO está logado: não há shell, menu ou histórico para onde
 * voltar, então a tela precisa se sustentar sozinha — dizer o que aconteceu e
 * qual é a saída (pedir um link novo a quem enviou).
 *
 * É `EmptyState`, não `Banner`: o visitante anônimo não tem nenhuma ação a
 * executar aqui, e um botão que não leva a lugar nenhum seria pior que
 * nenhum botão. O `role="alert"` garante que o motivo seja anunciado de
 * imediato por leitor de tela, já que a tela inteira é a mensagem.
 */
import { Ban, Clock, FileQuestion, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import type { ShareBlockReason } from '../types';

interface BlockCopy {
  icon: LucideIcon;
  title: string;
  description: string;
}

const BLOCK_COPY: Record<ShareBlockReason, BlockCopy> = {
  expired: {
    icon: Clock,
    title: 'Link expirado',
    description:
      'O tempo de acesso a este compartilhamento terminou. Solicite um novo link a quem o enviou.',
  },
  revoked: {
    icon: Ban,
    title: 'Link revogado',
    description: 'Este link de compartilhamento foi revogado e não está mais disponível.',
  },
  not_found: {
    icon: FileQuestion,
    title: 'Link não encontrado',
    description:
      'Não encontramos este compartilhamento. Verifique se o endereço está correto e completo.',
  },
  error: {
    icon: ShieldAlert,
    title: 'Não foi possível abrir',
    description:
      'Ocorreu um erro ao abrir este compartilhamento. Tente novamente em instantes.',
  },
};

export function ShareBlockedScreen({ reason }: { reason: ShareBlockReason }) {
  const copy = BLOCK_COPY[reason] ?? BLOCK_COPY.error;

  return (
    <Center axis="both" minHeight="100vh">
      <EmptyState
        role="alert"
        data-slot="share-blocked"
        data-reason={reason}
        // Único cabeçalho da rota pública: a hierarquia do documento começa aqui.
        headingLevel={1}
        icon={<Icon icon={copy.icon} size="lg" color="secondary" />}
        title={copy.title}
        description={copy.description}
      />
    </Center>
  );
}
