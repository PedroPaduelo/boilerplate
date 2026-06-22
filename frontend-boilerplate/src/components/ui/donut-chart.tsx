/**
 * DonutChart — donut/anel genérico em SVG, montado a partir de arcos.
 *
 * Desenha uma trilha de fundo (`stroke-muted`) e, por cima, um arco por
 * segmento cujo comprimento é proporcional ao seu `value` sobre o total. A
 * cor de cada arco vem da classe Tailwind em `segment.className` (ex.:
 * "stroke-primary"). As dimensões (`size`/`thickness`) controlam o diâmetro
 * e a espessura do anel; o vão central fica livre para um rótulo absoluto.
 *
 * Extraído da composição `saas-dashboard-pro`. Sem dependências novas, sem
 * estado. O elemento raiz é o próprio <svg> com `data-slot="donut-chart"`,
 * aceitando className/props padrão de um SVG.
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
}

function DonutChart({
  segments,
  size = 168,
  thickness = 24,
  className,
  style,
  ...props
}: DonutChartProps) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  // Pré-computa dash + offset de cada arco de forma PURA (sem mutar variável
  // durante o render — react-hooks/immutability). O offset acumulado é a soma
  // dos arcos anteriores.
  const arcs = segments.map((seg, i) => {
    const dash = (seg.value / total) * circumference
    const offset = segments
      .slice(0, i)
      .reduce((acc, s) => acc + (s.value / total) * circumference, 0)
    return { seg, dash, offset }
  })
  return (
    <svg
      data-slot="donut-chart"
      viewBox={`0 0 ${size} ${size}`}
      className={cn(className)}
      style={{ width: size, height: size, ...style }}
      role="img"
      aria-label="Distribuição"
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
        {arcs.map(({ seg, dash, offset }) => (
          <circle
            key={seg.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={seg.className}
            strokeWidth={thickness}
            strokeDasharray={`${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}`}
            strokeDashoffset={(-offset).toFixed(2)}
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  )
}

export { DonutChart }
