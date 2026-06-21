import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"

/** Chamada para ação (CTA) do card. */
export interface UpgradeCardCta {
  /** Rótulo do botão. */
  label: string
  /** Handler de clique (quando o CTA é um botão). */
  onClick?: () => void
  /** Destino do link (quando o CTA é um `<a>`). Tem prioridade sobre onClick. */
  href?: string
}

export interface UpgradeCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Título do card (ex.: "Plano Pro"). */
  title: React.ReactNode
  /** Descrição opcional abaixo do título. */
  description?: React.ReactNode
  /** Chamada para ação opcional. */
  cta?: UpgradeCardCta
  /** Ícone opcional exibido antes do título. */
  icon?: React.ComponentType<{ className?: string }>
}

function UpgradeCard({
  title,
  description,
  cta,
  icon: Icon,
  className,
  ...props
}: UpgradeCardProps) {
  return (
    <div
      data-slot="upgrade-card"
      className={cn(
        "rounded-lg border border-border/60 bg-muted/40 p-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
        ) : null}
        <p className="text-xs font-medium">{title}</p>
      </div>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      {cta ? (
        cta.href ? (
          <Button asChild size="sm" className="mt-3 w-full">
            <a href={cta.href}>{cta.label}</a>
          </Button>
        ) : (
          <Button size="sm" className="mt-3 w-full" onClick={cta.onClick}>
            {cta.label}
          </Button>
        )
      ) : null}
    </div>
  )
}

export { UpgradeCard }
