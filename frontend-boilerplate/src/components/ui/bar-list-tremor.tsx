import * as React from "react"

import { cn } from "@/shared/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
 * ENTREGA 2 — Cor do TEXTO dentro da barra (contraste automático).
 *
 * O rótulo (`item.name`) fica DENTRO da barra colorida. Texto branco some em
 * barra clara (ex.: `#40E0D0`) e texto preto some em barra escura. Resolvemos
 * de forma AUTOMÁTICA: calculamos a luminância relativa (WCAG) da cor da barra
 * e escolhemos texto escuro (fundo claro) ou claro (fundo escuro).
 *
 * Abrangência:
 *  - Cor CSS SÓLIDA (hex / rgb / rgba) → parse → luminância → preto/branco.
 *  - Cor NÃO-sólida (gradient / var(--x) / oklch / hsl) → não dá pra decidir
 *    sem computed style → fallback: mantém o texto do DS (`primary-foreground`)
 *    + `text-shadow` (contorno) que garante legibilidade em QUALQUER fundo.
 *  - Barra com classe Tailwind do DS (`bg-chart-N`) → mantém o
 *    `primary-foreground` (já contrasta com a paleta de azuis do tema).
 *  - OVERRIDE MANUAL: a prop `textColor` (global ou por item) vence o auto —
 *    aceita cor CSS (`#fff`, `rgb(...)`) ou classe utilitária (`text-white`).
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Converte uma cor CSS SÓLIDA (`#rgb`/`#rgba`/`#rrggbb`/`#rrggbbaa`,
 * `rgb()`/`rgba()`) em `[r,g,b]` (0-255). Retorna `null` quando a string NÃO
 * é uma cor sólida parseável (gradient, `var(--x)`, `oklch()`, `hsl()`,
 * keyword) — nesses casos o caller cai no fallback de `text-shadow`.
 */
function parseSolidColor(input: string): [number, number, number] | null {
  const s = input.trim()
  if (s.startsWith("#")) {
    const hex = s.slice(1)
    const expand = (h: string) =>
      h
        .split("")
        .map((c) => c + c)
        .join("")
    let full: string | null = null
    if (/^[0-9a-f]{3}$/i.test(hex)) full = expand(hex)
    else if (/^[0-9a-f]{4}$/i.test(hex)) full = expand(hex.slice(0, 3))
    else if (/^[0-9a-f]{6}$/i.test(hex)) full = hex
    else if (/^[0-9a-f]{8}$/i.test(hex)) full = hex.slice(0, 6)
    if (!full) return null
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  }
  const m = s.match(/^rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i)
  if (m) {
    const rgb: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])]
    return rgb.some((v) => Number.isNaN(v)) ? null : rgb
  }
  return null
}

/** Luminância relativa WCAG (0 = preto, 1 = branco). */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Texto escuro/claro do auto-contraste (tons neutros do tema). */
const AUTO_TEXT_DARK = "#0a0a0a"
const AUTO_TEXT_LIGHT = "#fafafa"

/**
 * Cor de texto AUTOMÁTICA p/ uma cor de fundo CSS sólida. WCAG: luminância
 * > 0.5 → fundo claro → texto escuro; senão → texto claro. Retorna `null`
 * quando `bg` não é sólida (gradient/var/oklch) — caller usa o fallback.
 */
function autoContrastText(bg: string | undefined): string | null {
  if (!bg) return null
  const rgb = parseSolidColor(bg)
  if (!rgb) return null
  return relativeLuminance(rgb) > 0.5 ? AUTO_TEXT_DARK : AUTO_TEXT_LIGHT
}

/** Heurística: a string é uma cor CSS (→ `style.color`) ou uma classe
 * utilitária Tailwind (→ `className`)? Usada no override manual `textColor`. */
function looksLikeColorString(v: string): boolean {
  const s = v.trim()
  return (
    s.startsWith("#") ||
    /^(rgb|rgba|hsl|hsla|oklch|oklab|color)\(/i.test(s) ||
    // keyword CSS simples (ex.: "white") — sem espaços e sem prefixo de classe.
    (/^[a-z]+$/i.test(s) && !s.startsWith("text-"))
  )
}

/** `text-shadow` de contorno — garante legibilidade sobre gradients/cores
 * indecidíveis (fallback do auto-contraste). */
const TEXT_OUTLINE_SHADOW =
  "0 1px 2px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.5)"

/**
 * Resolve cor do texto de UMA linha: override manual vence; senão auto-contraste
 * pela cor sólida da barra; senão fallback (`primary-foreground` + shadow quando
 * a barra tem cor custom não-sólida).
 */
function resolveBarTextColor(
  barBg: string | undefined,
  manualTextColor: string | undefined,
): { className: string; style?: React.CSSProperties } {
  if (manualTextColor) {
    return looksLikeColorString(manualTextColor)
      ? { className: "", style: { color: manualTextColor } }
      : { className: manualTextColor }
  }
  const auto = autoContrastText(barBg)
  if (auto) return { className: "", style: { color: auto } }
  // Barra com cor custom NÃO-sólida (gradient/var) → mantém o texto do DS
  // com contorno p/ não sumir. Barra de classe do DS (sem `barBg`) → só o DS.
  if (barBg) {
    return {
      className: "text-primary-foreground",
      style: { textShadow: TEXT_OUTLINE_SHADOW },
    }
  }
  return { className: "text-primary-foreground" }
}

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
 * Cor da barra (Turno 5 — expansível via prop do bloco `accent`):
 *  - `barClassName` (Tailwind, ex.: "bg-chart-2", "bg-purple-500") → aplicado
 *    na barra via `className`. VENCE o `bg-chart-1` hardcoded. Use para
 *    enums do DS ou classes Tailwind custom (single-palette).
 *  - `barStyle` (CSSProperties) → aplicado na barra via `style={…}`
 *    (atributo de apresentação que vence a classe CSS). Use para cores
 *    CSS custom (hex/rgb/hsl/gradient) que NÃO existem no enum do DS.
 *    Cobre:
 *      - `barStyle: { background: '#40E0D0' }` (cor CSS direta)
 *      - `barStyle: { background: 'linear-gradient(...)' }` (gradient)
 *      - `barStyle: { background: 'var(--chart-2)' }` (CSS var do tema)
 *  - Se AMBOS vierem: `barStyle` VENCE `barClassName` (atributos de
 *    apresentação inline vencem classes CSS).
 *
 * Cor da barra POR ITEM (Turno 6 — `palette: 'multi'`): cada item pode
 * trazer o próprio `barClassName` (Tailwind) e/ou `barStyle` (CSS) — o
 * caller do catálogo (ex.: bloco `bar_list`) passa `paletteClass(i)` em
 * cada item para ciclar a palette de charts (chart-1..5). Precedência
 * (Turno 6) por linha:
 *   1) `item.barStyle` (CSS custom, vence tudo) — se setado, NÃO aplica
 *      nenhuma classe Tailwind (evita `bg-#40E0D0` inválido)
 *   2) `item.barClassName` (classe Tailwind, vence o default)
 *   3) `barClassName` GLOBAL (fallback)
 *   4) `bg-chart-1` (default, hardcoded)
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
  /**
   * (Turno 6) Classe Tailwind da cor da barra DESTE item. VENCE o
   * `barClassName` global. Usado pelo caller do catálogo p/ ciclar
   * `paletteClass(i)` (chart-1..5) em `palette: 'multi'`. Opcional.
   */
  barClassName?: string
  /**
   * (Turno 6) Estilo inline da barra DESTE item (ex.: `{ background: '#ff0000' }`).
   * VENCE `barClassName` (do item e global) — atributos de apresentação
   * inline > classes CSS. Use para cor CSS custom por linha.
   */
  barStyle?: React.CSSProperties
  /**
   * (ENTREGA 2) Override MANUAL da cor do texto DESTA linha. VENCE o
   * auto-contraste e o `textColor` global. Aceita cor CSS (`#fff`,
   * `rgb(...)`, `white`) → `style.color`, ou classe utilitária
   * (`text-white`, `text-black`) → `className`. Opcional — quando ausente,
   * a cor é calculada automaticamente pela luminância da barra.
   */
  textColor?: string
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
  /**
   * Estilo inline GLOBAL aplicado à barra de cada linha (vence o
   * `bg-chart-1` hardcoded e `barClassName`). O caller do catálogo passa
   * o `style.background` resolvido pelo `resolveAccent`
   * (ex.: `barStyle: { background: "#ff0000" }`). Suporta qualquer
   * cor CSS — hex, rgb, hsl, oklch, gradient, `var(--chart-1)`.
   */
  barStyle?: React.CSSProperties
  /**
   * Classe Tailwind GLOBAL aplicada à barra de cada linha (ex.: `bg-chart-2`,
   * `bg-purple-500`). VENCE o `bg-chart-1` hardcoded mas é VENCIDA por
   * `barStyle` (atributo de apresentação inline > classes CSS).
   */
  barClassName?: string
  /**
   * (ENTREGA 2) Override MANUAL GLOBAL da cor do texto de todas as linhas.
   * VENCE o auto-contraste, mas é VENCIDO por `item.textColor`. Aceita cor
   * CSS (→ `style.color`) ou classe utilitária Tailwind (→ `className`).
   * Ausente = cor do texto calculada automaticamente (contraste WCAG).
   */
  textColor?: string
}

function BarListTremor<T = unknown>({
  data = [],
  valueFormatter = (value: number) => value.toString(),
  showAnimation = false,
  onValueChange,
  sortOrder = "descending",
  barStyle,
  barClassName,
  textColor,
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
        {sortedData.map((item, index) => {
          // Precedência de cor POR ITEM (Turno 6):
          //   1) item.barStyle (CSS custom, vence tudo)
          //   2) item.barClassName (classe Tailwind do item)
          //   3) barClassName GLOBAL (fallback)
          //   4) bg-chart-1 (default, hardcoded)
          // O `item.barStyle` (se setado) substitui `barStyle` global —
          // atributos de apresentação inline do item vencem.
          const itemBarStyle = item.barStyle ?? barStyle
          const itemBarClassName =
            item.barClassName ?? barClassName ?? "bg-chart-1"
          // (ENTREGA 2) Cor do texto por contraste: a cor SÓLIDA da barra vem
          // do `background` do estilo inline (cor CSS custom). Para barras de
          // classe Tailwind (bg-chart-N) `barBg` é undefined → mantém o texto
          // do DS. Override manual (item.textColor → textColor global) vence.
          const barBg =
            typeof itemBarStyle?.background === "string"
              ? itemBarStyle.background
              : typeof itemBarStyle?.backgroundColor === "string"
                ? itemBarStyle.backgroundColor
                : undefined
          const text = resolveBarTextColor(barBg, item.textColor ?? textColor)
          return (
            <Component
              key={item.key ?? item.name}
              onClick={() => {
                if (onValueChange) onValueChange(item)
              }}
              className={cn(
                "group w-full rounded-sm",
                "outline-none ring-0 ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                onValueChange
                  ? [
                      "m-0! cursor-pointer",
                      "hover:bg-muted",
                    ]
                  : "",
              )}
            >
              <div
                className={cn(
                  "flex items-center rounded-sm transition-all",
                  rowHeight,
                  // Se `itemBarStyle` foi passado (cor CSS custom), NÃO aplica
                  // a classe Tailwind (que viraria `bg-#40E0D0` etc.).
                  itemBarStyle ? '' : itemBarClassName,
                  onValueChange
                    ? "group-hover:opacity-90"
                    : "",
                  index === sortedData.length - 1 ? "mb-0" : "",
                  showAnimation ? "duration-800" : "",
                )}
                style={{ width: `${widths[index]}%`, ...itemBarStyle }}
              >
                <div className="absolute left-2 flex max-w-full pr-2">
                  {item.href ? (
                    <a
                      href={item.href}
                      className={cn(
                        "truncate whitespace-nowrap rounded-sm text-sm",
                        // (ENTREGA 2) Cor do texto resolvida por contraste
                        // (auto WCAG pela cor da barra) ou override manual.
                        // O valor numérico à direita (fora da barra) continua
                        // `text-foreground` por estar no fundo da página.
                        text.className,
                        "hover:underline hover:underline-offset-2",
                        "outline-none ring-0 ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      )}
                      style={text.style}
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
                        // (ENTREGA 2) Mesma resolução de contraste do <a>.
                        text.className,
                      )}
                      style={text.style}
                    >
                      {item.name}
                    </p>
                  )}
                </div>
              </div>
            </Component>
          )
        })}
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
                "text-foreground",
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
