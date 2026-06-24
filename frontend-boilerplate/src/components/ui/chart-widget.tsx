import * as React from "react"
import { ChevronRight, Lightbulb } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDuration } from "@/shared/lib/format"

/**
 * ChartWidget — casca/"moldura" PADRÃO de todo bloco de visualização do
 * dashboard. Estrutura em 4 zonas; tudo além de header/body é OPCIONAL e o
 * componente é 100% RETROCOMPATÍVEL (sem as props novas, renderiza idêntico à
 * versão anterior):
 *
 *   1. HEADER   — título + badge do tipo (`chartType`, sem capitalize) +
 *                 `actions` à direita.
 *   2. BODY     — o gráfico (children) ou `<Skeleton>` quando `loading`.
 *   3. TAKEAWAYS (canônico, Turno 4) — ARRAY DINÂMICO de insights de negócio,
 *                 cada item = 1 linha com lâmpada + texto. Renderiza SÓ os
 *                 itens com `enabled: true`. Suporta retrocompat: se o caller
 *                 passar `takeaway: string` (legado, 1 linha), é tratado
 *                 como 1 item `[{ enabled: true, text: takeaway }]`.
 *   4. AÇÃO "MAIS DETALHES" (opcional) — botão/link à direita. Aparece em
 *                 uma faixa horizontal só dele. Some se nem `onDetails` nem
 *                 `detailsHref` forem passados.
 *   5. FOOTER TÉCNICO (opcional) — query SQL + duração (usando
 *                 `formatDuration` para a duração). Some inteiro se
 *                 `showSql` for passado e `false`, mesmo com `query`
 *                 presente. Default: `showSql = true`. SEMPRE a última
 *                 posição do card.
 *
 * Posição relativa: o footer técnico (SQL + duração) é SEMPRE a ÚLTIMA
 * linha do card, independente de quantos takeaways existam ou se o botão
 * "mais detalhes" está presente. Isso vale também quando não há
 * takeaways/ação (footer pode aparecer sozinho).
 */

/**
 * Item de takeaway (insight de rodapé). `enabled` permite ligar/desligar
 * individualmente sem remover o item do estado (UX do playground).
 * `text` é o conteúdo — string pura, sem JSX (segue o formato simples do
 * `deriveTakeaway` do render-engine).
 */
export interface ChartWidgetTakeaway {
  enabled: boolean
  text: string
}

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
   * Mai (R$ 110)"). **Legado**: equivalente a passar
   * `takeaways={[{ enabled: true, text: '...' }]}`. Mantido por
   * retrocompat — novos callers devem usar `takeaways` (array) para ter
   * 0..N linhas com on/off individual.
   */
  takeaway?: React.ReactNode
  /**
   * Lista de takeaways (insights de negócio) do rodapé. Cada item vira uma
   * linha com `<Lightbulb>` + texto. Itens com `enabled: false` NÃO
   * renderizam. Default interno: `[]` (sem linha de insight).
   *
   * Tem prioridade sobre `takeaway` se ambos forem passados (o array
   * "vence" e o `takeaway` legado é ignorado).
   */
  takeaways?: ChartWidgetTakeaway[]
  /**
   * Liga/desliga a linha técnica do rodapé (query + duração). Default:
   * `true`. Quando `false`, mesmo com `query` setado, a linha inteira
   * (incluindo a duração) some — usado pelo playground do catálogo para
   * simular o relatório final sem "vazar" a query.
   */
  showSql?: boolean
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
  takeaways,
  showSql = true,
  detailsLabel = "Mais detalhes",
  onDetails,
  detailsHref,
  className,
  ...props
}: ChartWidgetProps) {
  const hasDetails = Boolean(detailsHref) || typeof onDetails === "function"

  // ----- resolução do array de takeaways (prioridade + retrocompat) -----
  // 1) Se `takeaways` foi passado: usa o array, filtra por enabled e trim.
  // 2) Senão, se `takeaway` foi passado (legado): converte p/ 1 item.
  // 3) Senão: array vazio (sem linha de insight).
  const resolvedTakeaways: ChartWidgetTakeaway[] =
    Array.isArray(takeaways)
      ? takeaways.filter((t) => t.enabled && t.text.trim().length > 0)
      : takeaway != null
        ? [{ enabled: true, text: String(takeaway) }]
        : []

  const hasTakeaways = resolvedTakeaways.length > 0
  const hasFooter = showSql && Boolean(query)

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

      {/* Body — min-h-0 garante que o ChartWidget não force a altura
          do cell do grid (necessário em bento_grid com autoRows) e o
          skeleton usa h-56 (224px) p/ alinhar com a altura NATURAL dos
          charts (donut 168px + folga, bar/line h-56 224px), evitando
          layout shift quando os dados chegam. */}
      <div className="min-h-0 px-4 py-3">
        {loading ? <Skeleton className="h-56 w-full" /> : children}
      </div>

      {/* Takeaways (1 linha por item, lampada + texto). Itens com
          enabled=false não renderizam. */}
      {hasTakeaways ? (
        <div
          data-slot="chart-widget-takeaways"
          className="space-y-1 border-t border-border px-4 py-2.5"
        >
          {resolvedTakeaways.map((t, i) => (
            <p
              key={`takeaway-${i}-${t.text.slice(0, 16)}`}
              data-slot="chart-widget-takeaway"
              className="flex min-w-0 items-start gap-1.5 text-xs text-foreground/80"
            >
              <Lightbulb
                className="mt-px size-3.5 shrink-0 text-amber-500 dark:text-amber-400"
                aria-hidden="true"
              />
              <span className="min-w-0">{t.text}</span>
            </p>
          ))}
        </div>
      ) : null}

      {/* Botão "mais detalhes" — independente dos takeaways. Aparece em
          uma faixa horizontal só com ele (alinhado à direita). Some se
          nem `onDetails` nem `detailsHref` forem passados. */}
      {hasDetails ? (
        <div
          data-slot="chart-widget-details-row"
          className="flex items-center justify-end gap-3 border-t border-border px-4 py-2"
        >
          {detailsHref ? (
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
          )}
        </div>
      ) : null}

      {/* Footer técnico (opcional): query + duração. SEMPRE a última
          posição do card. Some inteiro se showSql === false. Duração
          formatada via formatDuration() — exibe "142ms" / "1.4s" /
          "2min 15s" / "1h 5min" conforme a magnitude. */}
      {hasFooter ? (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <code className="max-w-md truncate font-mono" title={query}>
            {query}
          </code>
          {durationMs != null ? (
            <span
              className="shrink-0 tabular-nums"
              data-slot="chart-widget-duration"
            >
              · {formatDuration(durationMs)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export {
  ChartWidget,
  type ChartWidgetProps,
}