import * as React from "react"
import { ChevronRight, Lightbulb } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * ChartWidget — casca/"moldura" PADRÃO de todo bloco de visualização do
 * dashboard. Estrutura em 4 zonas; tudo além de header/body é OPCIONAL e o
 * componente é 100% RETROCOMPATÍVEL (sem as props novas, renderiza idêntico à
 * versão anterior):
 *
 *   1. HEADER   — título + badge do tipo (`chartType`, sem capitalize) +
 *                 `actions` à direita.
 *   2. BODY     — o gráfico (children) ou `<Skeleton>` quando `loading`.
 *   3. TAKEAWAY/AÇÕES (novo, opt-in) — faixa de rodapé com o INSIGHT de negócio
 *                 (`takeaway`) à esquerda e o botão "mais detalhes"
 *                 (`onDetails` / `detailsHref`) à direita. Só renderiza se ao
 *                 menos um dos dois for passado.
 *   4. FOOTER TÉCNICO (opcional) — query SQL + duração (igual à versão antiga).
 */
interface ChartWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  chartType?: string
  query?: string
  durationMs?: number
  loading?: boolean
  actions?: React.ReactNode
  children?: React.ReactNode
  /**
   * Frase curta de INSIGHT de negócio exibida no rodapé (ex.: "Maior valor:
   * Mai (R$ 110)"). Opcional — sem ela, a faixa de takeaway não é renderizada.
   */
  takeaway?: React.ReactNode
  /** Rótulo do botão de detalhe. Default: "Mais detalhes". */
  detailsLabel?: string
  /**
   * Handler do botão "mais detalhes". Se passado (ou `detailsHref`), o botão
   * aparece no rodapé. Sem nenhum dos dois, o botão NÃO é renderizado.
   */
  onDetails?: () => void
  /** Se passado, o botão "mais detalhes" vira um link (`<a href>`). */
  detailsHref?: string
}

function ChartWidget({
  title,
  chartType,
  query,
  durationMs,
  loading = false,
  actions,
  children,
  takeaway,
  detailsLabel = "Mais detalhes",
  onDetails,
  detailsHref,
  className,
  ...props
}: ChartWidgetProps) {
  const hasDetails = Boolean(detailsHref) || typeof onDetails === "function"
  const hasInsightRow = takeaway != null || hasDetails

  return (
    <div
      data-slot="chart-widget"
      className={cn(
        "rounded-xl border border-border bg-card text-foreground",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium leading-none">{title}</h3>
          {chartType ? (
            <Badge variant="secondary" className="text-xs">
              {chartType}
            </Badge>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-1">{actions}</div>
        ) : null}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {loading ? <Skeleton className="h-40 w-full" /> : children}
      </div>

      {/* Takeaway + ações (opt-in) */}
      {hasInsightRow ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
          {takeaway != null ? (
            <p
              data-slot="chart-widget-takeaway"
              className="flex min-w-0 items-start gap-1.5 text-xs text-foreground/80"
            >
              <Lightbulb
                className="mt-px size-3.5 shrink-0 text-amber-500 dark:text-amber-400"
                aria-hidden="true"
              />
              <span className="min-w-0">{takeaway}</span>
            </p>
          ) : (
            <span aria-hidden="true" />
          )}

          {hasDetails ? (
            detailsHref ? (
              <a
                data-slot="chart-widget-details"
                href={detailsHref}
                className="inline-flex shrink-0 items-center gap-0.5 rounded-sm text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {detailsLabel}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <button
                data-slot="chart-widget-details"
                type="button"
                onClick={onDetails}
                className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-sm text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {detailsLabel}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            )
          ) : null}
        </div>
      ) : null}

      {/* Footer técnico (opcional): query + duração */}
      {query ? (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <code className="max-w-md truncate font-mono" title={query}>
            {query}
          </code>
          {durationMs != null ? (
            <span className="shrink-0 tabular-nums">· {durationMs}ms</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export { ChartWidget, type ChartWidgetProps }
