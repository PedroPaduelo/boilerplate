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
  /**
   * (Cor da CAIXA — independente do texto) Classe Tailwind extra aplicada na
   * CAIXA (fundo). Quando fornecida, sobrescreve o `bg-*` do variant. Resolvida
   * no bloco via `resolveAccent()`. Vazio = usa a cor do variant.
   */
  boxClassName?: string
  /**
   * (Cor da CAIXA — independente do texto) Estilo inline aplicado na CAIXA.
   * Tipicamente `{ background: '#40E0D0' }` (cor CSS crua). Vence o variant.
   */
  boxStyle?: React.CSSProperties
  /**
   * (Cor do TEXTO — independente da caixa) Classe Tailwind `text-*` aplicada no
   * conteúdo (título + corpo + ícone via currentColor). Sobrescreve a cor de
   * texto herdada do variant. Vazio = herda a cor do variant.
   */
  textClassName?: string
  /**
   * (Cor do TEXTO — independente da caixa) Estilo inline `{ color: '#fff' }`
   * aplicado no conteúdo. Vence a cor de texto herdada do variant.
   */
  textStyle?: React.CSSProperties
}

export function CalloutTremor({
  title,
  icon: Icon,
  className,
  variant,
  boxClassName,
  boxStyle,
  textClassName,
  textStyle,
  style,
  children,
  ...props
}: CalloutTremorProps) {
  return (
    <div
      className={cn(calloutTremorVariants({ variant }), boxClassName, className)}
      style={boxStyle || style ? { ...style, ...boxStyle } : undefined}
      data-slot="callout-tremor"
      tremor-id="tremor-raw"
      {...props}
    >
      {/*
        Wrapper de TEXTO: tendo `textClassName`/`textStyle` próprios, define a
        cor diretamente neste elemento (cor própria vence a herdada do variant
        na CAIXA). Sem eles, herda a cor de texto do variant. O ícone usa
        `currentColor`, então acompanha automaticamente a cor efetiva do texto.
      */}
      <div className={textClassName} style={textStyle}>
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
    </div>
  )
}
