import * as React from "react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/shared/lib/utils"

/**
 * Tooltip Card (Aceternity UI) — tooltip flutuante que aparece no hover e
 * SEGUE o cursor. O `content` pode ser texto simples ou um card React rico
 * (avatar + nome + bio). Renomeado de `Tooltip` para `TooltipCard` para evitar
 * colisão com o `Tooltip` (shadcn/Radix) já existente no barrel.
 */
function TooltipCard({
  content,
  children,
  containerClassName,
}: {
  content: string | React.ReactNode
  children: React.ReactNode
  containerClassName?: string
}) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [mouse, setMouse] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [height, setHeight] = React.useState(0)
  const [position, setPosition] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const contentRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  React.useEffect(() => {
    if (isVisible && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [isVisible, content])

  const calculatePosition = React.useCallback(
    (mouseX: number, mouseY: number) => {
      if (!contentRef.current || !containerRef.current)
        return { x: mouseX + 12, y: mouseY + 12 }

      const tooltip = contentRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Dimensões do tooltip
      const tooltipWidth = 240 // min-w-[15rem] = 240px
      const tooltipHeight = tooltip.scrollHeight

      // Posição absoluta relativa ao viewport
      const absoluteX = containerRect.left + mouseX
      const absoluteY = containerRect.top + mouseY

      let finalX = mouseX + 12
      let finalY = mouseY + 12

      // Estoura a borda direita?
      if (absoluteX + 12 + tooltipWidth > viewportWidth) {
        finalX = mouseX - tooltipWidth - 12
      }

      // Estoura a borda esquerda?
      if (absoluteX + finalX < 0) {
        finalX = -containerRect.left + 12
      }

      // Estoura a borda inferior?
      if (absoluteY + 12 + tooltipHeight > viewportHeight) {
        finalY = mouseY - tooltipHeight - 12
      }

      // Estoura a borda superior?
      if (absoluteY + finalY < 0) {
        finalY = -containerRect.top + 12
      }

      return { x: finalX, y: finalY }
    },
    [],
  )

  const updateMousePosition = React.useCallback(
    (mouseX: number, mouseY: number) => {
      setMouse({ x: mouseX, y: mouseY })
      setPosition(calculatePosition(mouseX, mouseY))
    },
    [calculatePosition],
  )

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsVisible(true)
    const rect = e.currentTarget.getBoundingClientRect()
    updateMousePosition(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    setMouse({ x: 0, y: 0 })
    setPosition({ x: 0, y: 0 })
    setIsVisible(false)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isVisible) return
    const rect = e.currentTarget.getBoundingClientRect()
    updateMousePosition(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    updateMousePosition(touch.clientX - rect.left, touch.clientY - rect.top)
    setIsVisible(true)
  }

  const handleTouchEnd = () => {
    // Atraso para permitir interação por toque
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      setMouse({ x: 0, y: 0 })
      setPosition({ x: 0, y: 0 })
    }, 2000)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Alterna visibilidade no clique para dispositivos móveis
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault()
      if (isVisible) {
        setIsVisible(false)
        setMouse({ x: 0, y: 0 })
        setPosition({ x: 0, y: 0 })
      } else {
        const rect = e.currentTarget.getBoundingClientRect()
        updateMousePosition(e.clientX - rect.left, e.clientY - rect.top)
        setIsVisible(true)
      }
    }
  }

  // Atualiza a posição quando o tooltip fica visível ou o conteúdo muda
  React.useEffect(() => {
    if (isVisible && contentRef.current) {
      setPosition(calculatePosition(mouse.x, mouse.y))
    }
  }, [isVisible, height, mouse.x, mouse.y, calculatePosition])

  // Limpa o timer pendente no unmount (sem leak)
  React.useEffect(
    () => () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    },
    [],
  )

  return (
    <div
      ref={containerRef}
      data-slot="tooltip-card"
      className={cn("relative inline-block", containerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key={String(isVisible)}
            initial={{ height: 0, opacity: 1 }}
            animate={{ height, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="pointer-events-none absolute z-50 min-w-[15rem] overflow-hidden rounded-md border border-transparent bg-popover text-popover-foreground shadow-sm ring-1 shadow-black/5 ring-border dark:shadow-white/10"
            style={{
              top: position.y,
              left: position.x,
            }}
          >
            <div
              ref={contentRef}
              className="p-2 text-sm text-muted-foreground md:p-4"
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { TooltipCard }
