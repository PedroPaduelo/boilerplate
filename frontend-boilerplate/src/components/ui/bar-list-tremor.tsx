import * as React from "react"

import { cn } from "@/shared/lib/utils"

/**
 * BarListTremor — lista horizontal de barras ordenadas (estilo "Top 10").
 *
 * Cada item vira uma linha com uma barra cuja largura é proporcional ao
 * maior valor da série. Ideal para rankings em dashboards ("top N por
 * receita", "top N por ocorrências", etc.).
 *
 * Adaptação Tremor Raw → Vitrine UI:
 * - Removido `"use client"` (não usamos Next.js na Vitrine).
 * - `cx`/`focusRing` Tremor → `cn` da Vitrine (`@/lib/utils`).
 * - Mantido `tremor-id="tremor-raw"` no JSX raiz para que o validador
 *   Playwright consiga distinguir BarListTremor dos charts próprios
 *   (BarChart, LineChart etc.).
 * - Genérico `<T>` preservado: o consumidor passa o tipo das categorias
 *   extras (ex.: `{ channel: string; region: string }`) e BarListTremor
 *   apenas garante que `value`, `name`, `href?`, `key?` estejam presentes.
 *
 * @see https://www.tremor.so/docs/visualizations/bar-list
 * @see https://github.com/tremorlabs/tremor/blob/main/src/components/BarList/BarList.tsx
 */

/** Item aceito por BarListTremor: tipo arbitrário `T` + campos obrigatórios. */
export type BarListTremorItem<T> = T & {
  /** Identificador opcional; usado como `key` quando presente (ex.: id do DB). */
  key?: string
  /** Link opcional para o item (renderiza o `name` como `<a>` quando setado). */
  href?: string
  /** Valor numérico que define a largura da barra (proporcional ao maior). */
  value: number
  /** Rótulo exibido dentro da barra. */
  name: string
}

export interface BarListTremorProps<T = unknown>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Série de itens a renderizar. */
  data: BarListTremorItem<T>[]
  /** Formata o valor numérico exibido à direita de cada linha. Default: `String(value)`. */
  valueFormatter?: (value: number) => string
  /** Quando `true`, aplica `duration-800` na barra para animar a largura inicial. */
  showAnimation?: boolean
  /** Callback de clique em uma linha. Quando setado, cada linha vira `<button>`. */
  onValueChange?: (payload: BarListTremorItem<T>) => void
  /** Ordem de exibição dos itens. Default: `"descending"`. */
  sortOrder?: "ascending" | "descending" | "none"
}

function BarListTremor<T = unknown>({
  data = [],
  valueFormatter = (value: number) => value.toString(),
  showAnimation = false,
  onValueChange,
  sortOrder = "descending",
  className,
  ...props
}: BarListTremorProps<T>) {
  const Component: "button" | "div" = onValueChange ? "button" : "div"

  const sortedData = React.useMemo(() => {
    if (sortOrder === "none") return data
    return [...data].sort((a, b) =>
      sortOrder === "ascending" ? a.value - b.value : b.value - a.value,
    )
  }, [data, sortOrder])

  const widths = React.useMemo(() => {
    const maxValue = Math.max(...sortedData.map((item) => item.value), 0)
    return sortedData.map((item) =>
      item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 2),
    )
  }, [sortedData])

  const rowHeight = "h-8"

  return (
    <div
      data-slot="bar-list-tremor"
      className={cn("flex justify-between gap-x-6", className)}
      aria-sort={sortOrder}
      tremor-id="tremor-raw"
      {...props}
    >
      <div className="relative w-full space-y-1.5">
        {sortedData.map((item, index) => (
          <Component
            key={item.key ?? item.name}
            onClick={() => {
              if (onValueChange) onValueChange(item)
            }}
            className={cn(
              "group w-full rounded-sm",
              "outline-none ring-0 ring-offset-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-700 dark:focus-visible:ring-offset-gray-950",
              onValueChange
                ? [
                    "m-0! cursor-pointer",
                    "hover:bg-gray-50 dark:hover:bg-gray-900",
                  ]
                : "",
            )}
          >
            <div
              className={cn(
                "flex items-center rounded-sm transition-all",
                rowHeight,
                "bg-blue-200 dark:bg-blue-900",
                onValueChange
                  ? "group-hover:bg-blue-300 dark:group-hover:bg-blue-800"
                  : "",
                index === sortedData.length - 1 ? "mb-0" : "",
                showAnimation ? "duration-800" : "",
              )}
              style={{ width: `${widths[index]}%` }}
            >
              <div className="absolute left-2 flex max-w-full pr-2">
                {item.href ? (
                  <a
                    href={item.href}
                    className={cn(
                      "truncate whitespace-nowrap rounded-sm text-sm",
                      "text-gray-900 dark:text-gray-50",
                      "hover:underline hover:underline-offset-2",
                      "outline-none ring-0 ring-offset-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-700 dark:focus-visible:ring-offset-gray-950",
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {item.name}
                  </a>
                ) : (
                  <p
                    className={cn(
                      "truncate whitespace-nowrap text-sm",
                      "text-gray-900 dark:text-gray-50",
                    )}
                  >
                    {item.name}
                  </p>
                )}
              </div>
            </div>
          </Component>
        ))}
      </div>
      <div>
        {sortedData.map((item, index) => (
          <div
            key={item.key ?? item.name}
            className={cn(
              "flex items-center justify-end",
              rowHeight,
              index === sortedData.length - 1 ? "mb-0" : "mb-1.5",
            )}
          >
            <p
              className={cn(
                "truncate whitespace-nowrap text-sm leading-none",
                "text-gray-900 dark:text-gray-50",
              )}
            >
              {valueFormatter(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export { BarListTremor }