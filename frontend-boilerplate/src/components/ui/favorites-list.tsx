/**
 * FavoritesList — lista de itens favoritados (estrela) para uma sidebar. Cada
 * item mostra uma estrela preenchida e um rótulo (mono por padrão).
 * Opcionalmente, um botão de remover (StarOff) aparece no hover. Mostra um
 * estado vazio quando não há itens.
 *
 * Extraída da composição `dba-workbench` (seção "Favoritos" da sidebar). O
 * elemento raiz expõe `data-slot="favorites-list"`.
 */

import * as React from "react"
import { Star, StarOff } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export interface FavoritesListItem {
  id: string
  label: React.ReactNode
}

export interface FavoritesListProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect"> {
  items: FavoritesListItem[]
  onSelect?: (id: string) => void
  /** Quando passado, exibe um botão de remover (StarOff) no hover. */
  onRemove?: (id: string) => void
  /** Texto exibido quando não há favoritos. Default: "Nenhum favorito". */
  emptyLabel?: React.ReactNode
}

function FavoritesList({
  items,
  onSelect,
  onRemove,
  emptyLabel = "Nenhum favorito",
  className,
  ...props
}: FavoritesListProps) {
  return (
    <ul
      data-slot="favorites-list"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {items.map((item) => (
        <li key={item.id} className="group/fav flex items-center">
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <Star className="size-3 shrink-0 fill-amber-500 text-amber-500" />
            <span className="min-w-0 flex-1 truncate font-mono">{item.label}</span>
          </button>
          {onRemove ? (
            <button
              type="button"
              aria-label="Remover dos favoritos"
              onClick={() => onRemove(item.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/fav:opacity-100"
            >
              <StarOff className="size-3" />
            </button>
          ) : null}
        </li>
      ))}
      {items.length === 0 ? (
        <li className="px-2 py-1 text-[10px] italic text-muted-foreground/60">
          {emptyLabel}
        </li>
      ) : null}
    </ul>
  )
}

export { FavoritesList }
