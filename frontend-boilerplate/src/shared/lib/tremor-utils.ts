import { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { clsx } from "clsx"

/**
 * `cx` do Tremor → mesma semântica do `cn` da Vitrine (clsx + twMerge).
 * Re-exportado como `cx` para casar 1:1 com a API dos componentes Tremor.
 */
export const cx = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// ────────────────────────────────────────────────────────────────────────────
// Focus / error helpers
// ────────────────────────────────────────────────────────────────────────────

/** Anel de foco padrão para elementos não-input (botões, cards, links). */
export const focusRing = [
  "outline-none",
  "ring-0",
  "ring-offset-0",
  "focus-visible:ring-2",
  "focus-visible:ring-blue-500",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-white",
  "dark:focus-visible:ring-blue-700",
  "dark:focus-visible:ring-offset-gray-950",
].join(" ")

/** Anel de foco específico para inputs (cor mais clara para contraste com bg). */
export const focusInput = [
  "focus:ring-2",
  "focus:outline-none",
  "focus:ring-blue-500",
  "focus:ring-offset-2",
  "focus:ring-offset-white",
  "dark:focus:ring-blue-700",
  "dark:focus:ring-offset-gray-950",
].join(" ")

/** Estados visuais de erro para inputs. */
export const hasErrorInput = [
  "ring-2",
  "ring-red-200",
  "border-red-500",
  "focus:ring-red-200",
  "dark:ring-red-700/40",
  "dark:border-red-700",
].join(" ")

// ────────────────────────────────────────────────────────────────────────────
// Chart colors
// ────────────────────────────────────────────────────────────────────────────

/**
 * Paleta canônica de cores Tremor para séries de gráficos.
 * Cada entrada mapeia um nome semântico para a classe Tailwind `fill-<x>-500`
 * (cor base de "fill") + `stroke-<x>-500` (stroke equivalente).
 *
 * Strings literares (NÃO template literals) — Tailwind v4 não detecta interpolação.
 */
export const AvailableChartColors = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "gray",
  "red",
  "yellow",
  "indigo",
  "cyan",
  "pink",
  "lime",
  "fuchsia",
  "rose",
  "sky",
  "slate",
  "zinc",
  "neutral",
  "stone",
] as const

export type AvailableChartColorsKeys = (typeof AvailableChartColors)[number]

/**
 * Mapa: nome da cor → classe `fill-<x>-500`.
 * Strings literares (NÃO interpolar). Ex.: `getColorClassName("blue", "fill")` → `"fill-blue-500"`.
 */
const COLOR_CLASS_NAMES: Record<AvailableChartColorsKeys, { fill: string; stroke: string }> = {
  blue: { fill: "fill-blue-500", stroke: "stroke-blue-500" },
  emerald: { fill: "fill-emerald-500", stroke: "stroke-emerald-500" },
  violet: { fill: "fill-violet-500", stroke: "stroke-violet-500" },
  amber: { fill: "fill-amber-500", stroke: "stroke-amber-500" },
  gray: { fill: "fill-gray-500", stroke: "stroke-gray-500" },
  red: { fill: "fill-red-500", stroke: "stroke-red-500" },
  yellow: { fill: "fill-yellow-500", stroke: "stroke-yellow-500" },
  indigo: { fill: "fill-indigo-500", stroke: "stroke-indigo-500" },
  cyan: { fill: "fill-cyan-500", stroke: "stroke-cyan-500" },
  pink: { fill: "fill-pink-500", stroke: "stroke-pink-500" },
  lime: { fill: "fill-lime-500", stroke: "stroke-lime-500" },
  fuchsia: { fill: "fill-fuchsia-500", stroke: "stroke-fuchsia-500" },
  rose: { fill: "fill-rose-500", stroke: "stroke-rose-500" },
  sky: { fill: "fill-sky-500", stroke: "stroke-sky-500" },
  slate: { fill: "fill-slate-500", stroke: "stroke-slate-500" },
  zinc: { fill: "fill-zinc-500", stroke: "stroke-zinc-500" },
  neutral: { fill: "fill-neutral-500", stroke: "stroke-neutral-500" },
  stone: { fill: "fill-stone-500", stroke: "stroke-stone-500" },
}

/**
 * Retorna a classe Tailwind (`fill-<x>-500` ou `stroke-<x>-500`) correspondente
 * à cor Tremor informada. Faz fallback para `"gray"` se a cor for inválida.
 */
export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: "fill" | "stroke",
): string => {
  const entry = COLOR_CLASS_NAMES[color] ?? COLOR_CLASS_NAMES.gray
  return type === "fill" ? entry.fill : entry.stroke
}

/**
 * Atribui uma cor do pool `AvailableChartColors` para cada categoria,
 * ciclicamente quando o número de categorias excede o tamanho do pool.
 *
 * Útil para charts onde o usuário passa `categories: string[]` (ex.: cores
 * por mês) e queremos mapear para N cores estáveis.
 */
export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[] = [...AvailableChartColors],
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, idx) => {
    categoryColors.set(category, colors[idx % colors.length])
  })
  return categoryColors
}

// ────────────────────────────────────────────────────────────────────────────
// Axis helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o domínio [min, max] do eixo Y a partir de um array de valores.
 * Adiciona 20% de padding no topo (escala visual agradável) e garante que
 * o mínimo não fique negativo quando todos os valores são positivos.
 *
 * Retorna `[0, "auto"]` para arrays vazios (recharts default).
 */
export const getYAxisDomain = (
  values: number[] | undefined,
): [number | "auto", number | "auto"] => {
  if (!values || values.length === 0) return [0, "auto"]

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    // Linha plana: garante altura mínima visível
    return [Math.max(0, min - 1), max + 1]
  }

  const padding = (max - min) * 0.2
  const yMin = min < 0 ? min - padding : 0
  const yMax = max + padding

  return [yMin, yMax]
}

// ────────────────────────────────────────────────────────────────────────────
// Misc
// ────────────────────────────────────────────────────────────────────────────

/** Animação padrão Tremor para transições suaves em hover. */
export const transitionAll = "transition-all duration-300 ease-in-out"

/**
 * Tipo discriminado de "sem dado" para séries vazias em gráficos.
 * Os componentes Tremor usam este sentinel para renderizar placeholder
 * em vez de quebrar o recharts.
 */
export const NoData = Symbol("tremor-no-data")