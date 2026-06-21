import * as React from "react"
import { Toaster as SonnerToaster } from "sonner"
import { cn } from "@/shared/lib/utils"

export type ToasterProps = React.ComponentPropsWithoutRef<typeof SonnerToaster>

function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      data-slot="sonner"
      className={cn("toaster group")}
      {...props}
    />
  )
}

export { Toaster }
