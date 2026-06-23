import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"

export type MiddleTruncationProps = React.HTMLAttributes<HTMLElement> & {
  /** Texto a ser truncado. */
  text: string
  /** Comprimento máximo antes de truncar (default 20). */
  maxLength?: number
  /** String de ellipsis (default "…"). */
  ellipsis?: string
  /**
   * Se informado, força "no mínimo N chars preservados no fim".
   * Útil para paths com extensão (ex.: `minEnd={4}` preserva `.tsx`).
   * Sobrescreve a metade simétrica padrão.
   */
  minEnd?: number
  /** Tag HTML a renderizar (default "span"). */
  as?: "span" | "p" | "div"
  /** Se true, mostra tooltip no hover com texto completo (default true). */
  showTooltip?: boolean
}

/**
 * Trunca texto no meio, preservando início e fim.
 * Se `text.length <= maxLength`, retorna inteiro.
 * Senão, mantém `charsToShow - endChars` do início + ellipsis + `endChars` do fim.
 * O `endChars` vem de `minEnd` (se informado) ou da metade simétrica padrão.
 */
function truncateMiddle(
  text: string,
  maxLength: number = 20,
  ellipsis: string = "…",
  minEnd?: number
): string {
  if (text.length <= maxLength) return text

  const charsToShow = maxLength - ellipsis.length
  const endChars = minEnd ?? Math.floor(charsToShow / 2)
  const startChars = Math.max(0, charsToShow - endChars)

  return text.slice(0, startChars) + ellipsis + text.slice(-endChars)
}

function MiddleTruncation({
  text,
  maxLength = 20,
  ellipsis = "…",
  minEnd,
  as: Tag = "span",
  showTooltip = true,
  className,
  ...props
}: MiddleTruncationProps) {
  const truncated = truncateMiddle(text, maxLength, ellipsis, minEnd)

  if (!showTooltip) {
    return (
      <Tag
        data-slot="middle-truncation"
        className={cn("inline", className)}
        {...props}
      >
        {truncated}
      </Tag>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Tag
          data-slot="middle-truncation"
          className={cn("inline", className)}
          {...props}
        >
          {truncated}
        </Tag>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

export { MiddleTruncation }
