import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um item da fatura. O valor da linha é `qty * unit`. */
export interface InvoiceTableItem {
  /** Descrição do item (também usada como key). */
  label: string
  /** Quantidade. */
  qty: number
  /** Valor unitário. */
  unit: number
}

export interface InvoiceTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Itens da fatura. */
  items: InvoiceTableItem[]
  /** Quando presente, renderiza uma linha de total no rodapé (<tfoot>). */
  total?: number
  /** Formatador de valor. Default: "$" + `Number.toLocaleString("en-US")`. */
  formatValue?: (value: number) => string
  /** Rótulos das colunas e do total (PT-BR por padrão). */
  labels?: {
    item?: string
    qty?: string
    value?: string
    total?: string
  }
}

function defaultFormatValue(value: number) {
  return `$${value.toLocaleString("en-US")}`
}

function InvoiceTable({
  items,
  total,
  formatValue = defaultFormatValue,
  labels,
  className,
  ...props
}: InvoiceTableProps) {
  const itemLabel = labels?.item ?? "Item"
  const qtyLabel = labels?.qty ?? "Qtd."
  const valueLabel = labels?.value ?? "Valor"
  const totalLabel = labels?.total ?? "Total"

  return (
    <div
      data-slot="invoice-table"
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        className
      )}
      {...props}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">{itemLabel}</th>
            <th className="px-3 py-2 text-center font-medium">{qtyLabel}</th>
            <th className="px-3 py-2 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.label}
              className="border-b border-border last:border-0"
            >
              <td className="px-3 py-2 text-foreground">{item.label}</td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                {item.qty}
              </td>
              <td className="px-3 py-2 text-right text-foreground">
                {formatValue(item.qty * item.unit)}
              </td>
            </tr>
          ))}
        </tbody>
        {total !== undefined ? (
          <tfoot>
            <tr className="border-t border-border">
              <td
                className="px-3 py-2 font-medium text-foreground"
                colSpan={2}
              >
                {totalLabel}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-foreground">
                {formatValue(total)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}

export { InvoiceTable }
