/**
 * WorkbenchStatusBar — barra de status (rodapé) estilo IDE: uma faixa fina,
 * densa e rolável horizontalmente, com itens à esquerda e à direita.
 *
 * Modelo de slots: passe `left` e `right` com o conteúdo já montado (spans com
 * ícones/pontos de status). O grupo da direita é empurrado com `ml-auto`. Sem
 * estado próprio — só a casca visual.
 *
 * Extraído da composição `dba-workbench` (o footer/status bar). O elemento
 * raiz expõe `data-slot="workbench-status-bar"` e aceita className/props
 * padrão de um <footer>.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface WorkbenchStatusBarProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Itens à esquerda (status, conexão, encoding…). */
  left?: React.ReactNode
  /** Itens à direita (empurrados com `ml-auto`). */
  right?: React.ReactNode
}

function WorkbenchStatusBar({
  left,
  right,
  className,
  children,
  ...props
}: WorkbenchStatusBarProps) {
  return (
    <footer
      data-slot="workbench-status-bar"
      className={cn(
        "flex shrink-0 items-center gap-2 overflow-x-auto border-t border-border bg-card px-3 py-1 text-[10px] tabular-nums text-muted-foreground md:gap-4",
        className
      )}
      {...props}
    >
      {left}
      {children}
      {right ? (
        <span className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          {right}
        </span>
      ) : null}
    </footer>
  )
}

export { WorkbenchStatusBar }
