import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/shared/lib/utils"

/**
 * Switch — toggle binário on/off no padrão shadcn/ui (Radix Primitive).
 * UI COMPACTA (~32px × 18px), usada no `PropFieldEditor` do playground do
 * catálogo no lugar de checkboxes nativos estilizados (que ficavam com
 * altura desproporcional e label em cima do controle, ocupando muito
 * espaço vertical). Aceita o mesmo `onCheckedChange` do Radix, mais
 * `checked` controlado.
 *
 * Acessibilidade: usa Radix Switch Primitive (já cuida de role="switch",
 * aria-checked, foco por teclado, label por htmlFor/id).
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full",
        "border border-transparent shadow-sm transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-3.5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-[15px] data-[state=unchecked]:translate-x-[2px]",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
