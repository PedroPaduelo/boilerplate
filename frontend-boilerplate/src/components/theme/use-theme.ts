import { useContext } from "react"
import { ThemeProviderContext } from "@/components/theme/theme-context"

/**
 * Hook que expõe o tema atual do ThemeProvider.
 * Retorna `{ theme, setTheme, resolvedTheme }`.
 * Deve ser usado dentro de `<ThemeProvider>`.
 */
export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
