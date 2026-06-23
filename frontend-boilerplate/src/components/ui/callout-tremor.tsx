import * as React from "react"
import { isValidElement } from "react"

import { cn } from "@/shared/lib/utils"

import {
  calloutTremorVariants,
  type CalloutTremorVariant,
} from "./callout-tremor-variants"

export interface CalloutTremorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Título em destaque (linha 1, com ícone à esquerda). */
  title: string
  /** Conteúdo secundário (linha 2, abaixo do título). */
  children?: React.ReactNode
  /**
   * Ícone exibido à esquerda do título. Aceita:
   * - um Component (ElementType) — ex.: `Info` do lucide-react
   * - um ReactNode — ex.: `<MyCustomIcon />` ou `<svg>`
   */
  icon?: React.ElementType | React.ReactNode
  /** Cor semântica do banner. Default: `"default"`. */
  variant?: CalloutTremorVariant
}

export function CalloutTremor({
  title,
  icon: Icon,
  className,
  variant,
  children,
  ...props
}: CalloutTremorProps) {
  return (
    <div
      className={cn(calloutTremorVariants({ variant }), className)}
      data-slot="callout-tremor"
      tremor-id="tremor-raw"
      {...props}
    >
      <div className="flex items-start">
        {Icon ? (
          isValidElement(Icon) ? (
            Icon
          ) : (
            (() => {
              const IconComponent = Icon as React.ComponentType<{
                className?: string
                "aria-hidden"?: boolean
              }>
              return (
                <IconComponent
                  className="mr-1.5 size-5 shrink-0"
                  aria-hidden={true}
                />
              )
            })()
          )
        ) : null}
        <span className="font-semibold">{title}</span>
      </div>
      {children ? (
        <div className="mt-2 overflow-y-auto">{children}</div>
      ) : null}
    </div>
  )
}
