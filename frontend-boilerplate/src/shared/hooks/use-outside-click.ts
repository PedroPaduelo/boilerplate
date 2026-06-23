import * as React from "react"

/**
 * Dispara `callback` quando um `mousedown`/`touchstart` ocorre fora do elemento
 * referenciado por `ref`. Compatível com React 19 (`RefObject<T | null>`).
 */
export function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  callback: (event: MouseEvent | TouchEvent) => void
): void {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el || el.contains(event.target as Node)) {
        return
      }
      callback(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, callback])
}
