/**
 * BlockBoundary — cerca de contenção de UM bloco.
 *
 * POR QUE É DO MOTOR, E NÃO DA TELA: quem renderiza um bloco não escolhe os
 * dados nem as props — no dashboard elas vêm de um layout JSON gerado pela IA,
 * na galeria vêm do playground. Ou seja, o conteúdo é SEMPRE de terceiros, e
 * conteúdo de terceiros erra. Sem esta cerca, uma prop no tipo errado
 * (`words: "a,b"` em vez de `["a","b"]`) lança durante o render e leva junto a
 * árvore inteira: o usuário vê "Unexpected Application Error" e perde a página,
 * não só o gráfico.
 *
 * O contrato aqui é o mesmo dos outros estados de bloco (`block-body.tsx`): o
 * lugar do bloco nunca fica em branco nem some — vira um aviso no tamanho do
 * bloco, com o tipo e a mensagem, e o resto da tela continua de pé.
 *
 * `resetKey` limpa o erro quando o que quebrou muda (nova prop, novo dado):
 * sem isso a cerca ficaria presa no estado de falha mesmo depois da correção.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Banner } from '@astryxdesign/core/Banner';

export interface BlockBoundaryProps {
  /** Tipo do bloco (`catalogType`) — aparece no aviso e ajuda a rastrear. */
  type: string;
  /**
   * Quando muda, a cerca tenta renderizar de novo. Use o que pode ter causado
   * a falha (props/dados serializados, id do bloco).
   */
  resetKey?: unknown;
  children: ReactNode;
}

interface BlockBoundaryState {
  error: Error | null;
  /** `resetKey` vigente na última vez que o estado foi avaliado. */
  key: unknown;
}

export class BlockBoundary extends Component<BlockBoundaryProps, BlockBoundaryState> {
  state: BlockBoundaryState = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<BlockBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: BlockBoundaryProps,
    state: BlockBoundaryState,
  ): Partial<BlockBoundaryState> | null {
    if (props.resetKey !== state.key) {
      return { error: null, key: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Um bloco que quebra é defeito de contrato (props/dados fora do schema),
    // não ruído: precisa aparecer no console com o tipo para ser rastreável.
    console.error(
      `[render-engine] bloco "${this.props.type}" falhou ao renderizar:`,
      error,
      info.componentStack,
    );
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Banner
        data-slot="block-crash"
        data-block-type={this.props.type}
        status="error"
        title="Não foi possível desenhar este bloco"
        description={`O bloco "${this.props.type}" recebeu uma configuração que ele não sabe desenhar (${error.message}). Ajuste as propriedades ou os dados para voltar a renderizar.`}
      />
    );
  }
}
