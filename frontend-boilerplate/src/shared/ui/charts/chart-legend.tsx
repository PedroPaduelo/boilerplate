/**
 * LEGENDAS — as DUAS da referência, e só elas.
 *
 * 1. `ChartLegend` — a legenda NATIVA (`05-tooltip-legenda-css.md` §2): usada
 *    pelos gráficos cartesianos. Marcador circular de 12px, texto 13px/500,
 *    `line-height` 18px, 8px entre itens. Posição padrão da referência é topo
 *    à direita; os cartesianos deste app a desenham abaixo da plotagem, que é
 *    onde o `ChartFrame` reserva espaço.
 *
 * 2. `ChartLegends` — a legenda PRÓPRIA (§3): usada por pizza, rosca e
 *    medidores radiais, onde a legenda do motor roubaria área do desenho. Cada
 *    item é uma COLUNA — rótulo (11,375px/500) em cima, valor (14,875px/600)
 *    embaixo — e a cor vem do `color` do item, com o ponto em `currentColor`.
 *
 * Apresentação pura: nenhuma das duas filtra séries. Filtro é estado de tela e
 * mora em quem usa o gráfico.
 */

/** Uma entrada da legenda. */
export interface ChartLegendItem {
  /** Nome da série/categoria. */
  label: string;
  /** Cor já resolvida pelo `useChartPalette` (`var(--token)` ou valor). */
  color: string;
  /** Valor da categoria, já formatado — só na legenda própria. */
  value?: string;
}

export interface ChartLegendProps {
  /** Entradas exibidas, na ordem das séries. */
  items: ChartLegendItem[];
  /** Alinhamento horizontal do bloco. */
  align?: 'start' | 'center' | 'end';
  /**
   * Formato da marca de cor. Mantido por compatibilidade com os gráficos que
   * já pediam `bar`; a referência usa círculo em todos.
   */
  shape?: 'dot' | 'bar';
}

/** Alinhamento → `justify-content`. */
const JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
} as const;

/** Legenda nativa: série → cor, na tipografia da referência. */
export function ChartLegend({
  items,
  align = 'center',
  shape = 'dot',
}: ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <ul
      className="chart-legend"
      data-slot="chart-legend"
      // runtime: alinhamento é prop do gráfico, não do tema
      style={{ justifyContent: JUSTIFY[align] }}
    >
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="chart-legend__item"
          // runtime: a cor identifica a série e vem do `useChartPalette`
          style={{ color: item.color }}
        >
          <span
            aria-hidden="true"
            className="chart-legend__dot"
            style={
              shape === 'bar' ? { width: 12, height: 8, borderRadius: 2 } : undefined
            }
          />
          <span className="chart-legend__label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export interface ChartLegendsProps {
  /** Entradas exibidas, na ordem das fatias. */
  items: ChartLegendItem[];
  /** Centraliza o bloco (padrão dos circulares). */
  isCentered?: boolean;
}

/**
 * Legenda PRÓPRIA, desenhada FORA do gráfico. Obrigatória em pizza, rosca e
 * medidores — a referência é explícita: "legenda dentro do gráfico circular
 * come espaço do desenho".
 */
export function ChartLegends({ items, isCentered = true }: ChartLegendsProps) {
  if (items.length === 0) return null;

  return (
    <ul
      className={isCentered ? 'chart-legends chart-legends--center' : 'chart-legends'}
      data-slot="chart-legends"
    >
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="chart-legends__item"
          // runtime: a cor identifica a fatia e vem do `useChartPalette`
          style={{ color: item.color }}
        >
          <span className="chart-legends__row">
            <span aria-hidden="true" className="chart-legends__dot" />
            {item.label}
          </span>
          {item.value ? <span className="chart-legends__value">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
