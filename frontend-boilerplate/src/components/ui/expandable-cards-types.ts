import type * as React from "react"

/** Um card do `ExpandableCards`. */
export type ExpandableCard = {
  /** Título exibido no card e no modal expandido. */
  title: string
  /** Descrição curta exibida abaixo do título. */
  description: string
  /** URL da imagem (thumbnail e cabeçalho do modal). */
  src: string
  /** Rótulo do botão de ação. */
  ctaText: string
  /** Destino do botão de ação. */
  ctaLink: string
  /** Conteúdo expandido — função que retorna nós ou nós diretos. */
  content: (() => React.ReactNode) | React.ReactNode
}
