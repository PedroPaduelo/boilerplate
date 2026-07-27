/**
 * Vocabulário do `expandable_cards`. Vivia na UI legada (que sai no cutover) e
 * passa a morar no próprio bloco — é ele quem define o formato.
 *
 * Cada item representa UM sub-bloco do dashboard: colapsado mostra `title`
 * (+ `subtitle` e um `preview` opcional); expandido, o `content` completo.
 */
import type { ReactNode } from 'react';

export interface ExpandableCardItem {
  /** Chave única do card (id do sub-bloco). */
  id: string;
  /** Título do card colapsado e do cabeçalho do modal. */
  title: string;
  /** Subtítulo curto (ex.: nome do tipo do bloco). */
  subtitle?: string;
  /** Miniatura decorativa exibida no card colapsado. */
  preview?: ReactNode;
  /** Conteúdo completo, renderizado no modal. */
  content: ReactNode;
}

/** Espaçamento entre os cards da grade colapsada. */
export type ExpandableCardsGap = 'sm' | 'md' | 'lg';
