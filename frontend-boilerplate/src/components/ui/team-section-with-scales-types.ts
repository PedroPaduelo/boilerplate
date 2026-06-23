import type * as React from "react"

/** Link social de um membro do time. */
export interface TeamMemberSocial {
  /** Rótulo acessível e fallback textual quando não há `icon`. */
  label: string
  /** URL de destino. */
  href: string
  /** Ícone opcional (ex.: lucide). Quando ausente, exibe o `label`. */
  icon?: React.ReactNode
}

/** Membro do time exibido em um card. */
export interface TeamMember {
  /** Nome do membro. */
  name: string
  /** Cargo/função. */
  role: string
  /** URL do avatar. */
  image: string
  /** Bio curta opcional. */
  bio?: string
  /** Links sociais opcionais. */
  socials?: TeamMemberSocial[]
}

export type TeamSectionWithScalesProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "children" | "title"
> & {
  /** Texto pequeno acima do título (eyebrow). */
  eyebrow?: React.ReactNode
  /** Título da seção. */
  title?: React.ReactNode
  /** Descrição abaixo do título. */
  description?: React.ReactNode
  /** Lista de membros do time. */
  members: TeamMember[]
}
