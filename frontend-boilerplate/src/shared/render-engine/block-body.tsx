/**
 * Corpos de bloco que NÃO são o componente do catálogo: o aviso de tipo
 * desconhecido e os três estados sem dados (carregando, erro, vazio).
 *
 * Estão juntos porque respondem à mesma pergunta — "o que aparece no lugar do
 * gráfico quando ele não pode ser desenhado?" — e a resposta nunca é uma área
 * em branco: um bloco mudo dentro de um dashboard parece bug de render.
 */
import { Banner } from '@astryxdesign/core/Banner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';
import type { BlockRenderState } from './types';

/** Tipo de bloco sem componente registrado (layout novo, front antigo). */
export function BlockUnknown({ type, className }: { type: string; className?: string }) {
  return (
    <Banner
      data-slot="block-unknown"
      data-block-type={type}
      className={className}
      status="warning"
      title="Bloco não implementado"
      description={`Nenhum componente registrado para o tipo "${type}".`}
    />
  );
}

export interface BlockPlaceholderProps {
  state: Exclude<BlockRenderState, 'success'>;
  /** Mensagem do backend, quando `state === 'error'`. */
  error?: string;
}

/** Esqueleto / erro / vazio de um bloco folha. */
export function BlockPlaceholder({ state, error }: BlockPlaceholderProps) {
  if (state === 'error') {
    return (
      <Banner
        data-slot="block-error"
        status="error"
        title="Erro ao carregar o bloco"
        description={error}
      />
    );
  }

  if (state === 'empty') {
    return (
      <EmptyState
        data-slot="block-empty"
        isCompact
        title="Sem dados"
        description="A consulta deste bloco não retornou linhas."
      />
    );
  }

  // skeleton | loading — a mesma silhueta: uma linha de rótulo e a área do
  // gráfico, para o bloco não "pular" quando os dados chegam.
  return (
    <VStack gap={2} data-slot="block-skeleton">
      <Skeleton width="33%" height={16} radius={1} />
      <Skeleton width="100%" height={96} radius={2} index={1} />
    </VStack>
  );
}
