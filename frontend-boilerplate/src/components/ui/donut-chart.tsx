/**
 * DonutChart — donut/anel genérico em SVG, montado a partir de arcos, com
 * suporte a HOVER controlado pelo pai (destaque do arco ativo).
 *
 * Desenha uma trilha de fundo (`stroke-muted`) e, por cima, um arco por
 * segmento cujo comprimento é proporcional ao seu `value` sobre o total. A
 * cor de cada arco vem da classe Tailwind em `segment.className` (ex.:
 * "stroke-primary"). As dimensões (`size`/`thickness`) controlam o diâmetro
 * e a espessura do anel; o vão central fica livre para um rótulo absoluto.
 *
 * Hover: o pai controla `activeIndex` e recebe `onSegmentHover`. O arco ativo
 * engrossa (destaque) e os demais esmaecem — o pai usa o índice para mostrar
 * o detalhe no centro / destacar a legenda.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Um segmento do donut: rótulo, valor e classe Tailwind de cor do arco. */
export interface DonutSegment {
  label: string
  value: number
  /** Classe Tailwind da cor do arco (ex.: "stroke-primary", "stroke-emerald-500"). */
  className: string
}

export interface DonutChartProps
  extends Omit<React.SVGProps<SVGSVGElement>, "children"> {
  /** Segmentos do anel. O comprimento de cada arco é proporcional ao total. */
  segments: DonutSegment[]
  /** Diâmetro do SVG em px. Default: 168. */
  size?: number
  /** Espessura do anel em px. Default: 24. */
  thickness?: number
  /** Índice do segmento em destaque (hover controlado pelo pai). */
  activeIndex?: number | null
  /** Callback de hover por segmento (índice ou null ao sair). */
  onSegmentHover?: (index: number | null) => void
}

function DonutChart({
  segments,
  size = 168,
  thickness = 24,
  activeIndex = null,
  onSegmentHover,
  className,
  style,
  ...props
}: DonutChartProps) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const arcs = segments.map((seg, i) => {
    const dash = (seg.value / total) * circumference
    const offset = segments
      .slice(0, i)
      .reduce((acc, s) => acc + (s.value / total) * circumference, 0)
    return { seg, dash, offset, key: `${seg.label}-${i}`, index: i }
  })
  return (
    <svg
      data-slot="donut-chart"
      viewBox={`0 0 ${size} ${size}`}
      className={cn(className)}
      style={{ width: size, height: size, ...style }}
      role="img"
      aria-label="Distribuição"
      onMouseLeave={() => onSegmentHover?.(null)}
      {...props}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="stroke-muted"
        strokeWidth={thickness}
      />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {arcs.map(({ seg, dash, offset, key, index }) => {
          const isActive = activeIndex === index
          const dim = activeIndex != null && !isActive
          return (
            <circle
              key={key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={cn(
                seg.className,
                "cursor-pointer transition-[stroke-width,opacity] duration-200",
                dim && "opacity-40",
              )}
              strokeWidth={isActive ? thickness + 5 : thickness}
              strokeDasharray={`${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}`}
              strokeDashoffset={(-offset).toFixed(2)}
              strokeLinecap="butt"
              onMouseEnter={() => onSegmentHover?.(index)}
            >
              <title>{`${seg.label}: ${seg.value.toLocaleString("pt-BR")}`}</title>
            </circle>
          )
        })}
      </g>
    </svg>
  )
}

export { DonutChart }
