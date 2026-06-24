import type * as React from "react"

/**
 * Um card do `ExpandableCards` (container de layout).
 *
 * Cada item representa UM sub-bloco do dashboard: no estado colapsado mostra o
 * `title` (+ `subtitle` e um `preview` opcional); ao clicar, expande num modal
 * com o `content` completo (o sub-bloco renderizado).
 */
export type ExpandableCardItem = {
  /** Chave única do card (id do sub-bloco). */
  id: string
  /** Título exibido no card colapsado e no cabeçalho do modal. */
  title: string
  /** Subtítulo curto (ex.: nome do tipo do bloco). */
  subtitle?: string
  /** Preview compacto exibido no card colapsado (miniatura do conteúdo). */
  preview?: React.ReactNode
  /** Conteúdo completo renderizado no modal expandido. */
  content: React.ReactNode
}
