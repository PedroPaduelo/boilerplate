import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { GlowingEffect, type GlowingEffectProps } from "@/components/ui/glowing-effect"

export interface DashboardPanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Título do painel (header). */
  title: string
  /** Descrição opcional, abaixo do título (variante "card"). */
  description?: string
  /** Ícone exibido antes do título (variante "framed"). */
  icon?: React.ReactNode
  /** Slot de ação à direita do header (ex.: Badge, Button). */
  action?: React.ReactNode
  /**
   * Layout do painel:
   * - "card" (default): card com padding interno e header título/descrição.
   * - "framed": header com borda inferior + ícone e corpo flush (denso).
   */
  variant?: "card" | "framed"
  /** Classe extra do corpo (variante "framed"). */
  bodyClassName?: string
  /** Conteúdo do painel. */
  children?: React.ReactNode
  /**
   * Liga o brilho de borda (GlowingEffect). Quando true, renderiza o efeito
   * internamente e marca o elemento com `data-glow`. Sem efeito, o visual é
   * idêntico ao painel sem brilho.
   */
  glow?: boolean
  /** Props repassadas ao GlowingEffect quando `glow` está ativo. */
  glowProps?: Partial<GlowingEffectProps>
}

function DashboardPanel({
  title,
  description,
  icon,
  action,
  variant = "card",
  bodyClassName,
  glow = false,
  glowProps,
  className,
  children,
  ...props
}: DashboardPanelProps) {
  const framed = variant === "framed"
  return (
    <section
      data-slot="dashboard-panel"
      data-glow={glow ? "" : undefined}
      className={cn(
        framed
          ? "relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
          : "rounded-xl border border-border bg-card p-5 shadow-sm",
        // sem `glow`, nada muda; com `glow` no layout "card" precisamos do
        // contexto de posicionamento/recorte para o efeito.
        glow && !framed && "relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {glow ? (
        <GlowingEffect
          disabled={false}
          glow={false}
          blur={0}
          spread={42}
          proximity={72}
          borderWidth={2}
          {...glowProps}
        />
      ) : null}
      {framed ? (
        <>
          <header className="relative flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {icon ? <span className="text-muted-foreground">{icon}</span> : null}
              {title}
            </div>
            {action}
          </header>
          <div className={cn("relative min-w-0 flex-1", bodyClassName)}>
            {children}
          </div>
        </>
      ) : (
        <>
          <div className="relative mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {action}
          </div>
          {children}
        </>
      )}
    </section>
  )
}

export { DashboardPanel }
