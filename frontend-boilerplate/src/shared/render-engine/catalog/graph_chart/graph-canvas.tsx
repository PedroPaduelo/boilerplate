/**
 * COMPONENTE PRÓPRIO — o desenho do grafo em SVG.
 *
 * Por que próprio: o Astryx não tem visualização de dados, e a base de
 * gráficos de `@/shared/ui` é construída sobre o recharts, que não desenha
 * rede (não há grafo entre os tipos dele). O que a base RESOLVE — casca,
 * estados, rótulo acessível, paleta por token — continua vindo dela: este
 * arquivo desenha só a plotagem, e é montado dentro de um `ChartFrame`.
 *
 * ---------------------------------------------------------------------------
 * ESTILO
 * ---------------------------------------------------------------------------
 * `fill`/`stroke` são atributos de APRESENTAÇÃO do SVG e não resolvem `var()`,
 * então toda cor aqui entra como valor RESOLVIDO do tema (`palette.colorAt`,
 * `palette.chrome`) — a mesma regra que o `progress-circle` e o
 * `mobius-loop-icon` seguem. Nenhum hexadecimal é escrito no código.
 *
 * ---------------------------------------------------------------------------
 * ACESSIBILIDADE — por que o nó NÃO é focável
 * ---------------------------------------------------------------------------
 * O `ChartFrame` anuncia a plotagem como `role="img"`, e um papel de imagem
 * PODA os descendentes da árvore de acessibilidade. Um `<g tabIndex={0}>` aqui
 * dentro criaria uma parada de teclado que o leitor de tela não sabe nomear —
 * pior que não ter parada nenhuma. O realce no hover é, portanto, um reforço
 * para quem usa o mouse; quem não usa recebe a mesma informação pelo
 * equivalente textual e pela legenda, que vivem FORA da região `img`.
 */
import { useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useChartPalette } from '@/shared/ui';
import { useElementWidth } from '@/shared/hooks/use-element-width';
import {
  clampLabelX,
  edgeShape,
  estimateTextWidth,
  toScreen,
  type ScreenNode,
  type Viewport,
} from './graph-geometry';
import type { GraphModel } from './graph-data';
import { layoutGraph, type GraphLayoutKind } from './graph-layout';
import type { GraphView } from './graph-view';

/** Largura usada até a primeira medição (SSR, impressão, primeiro quadro). */
const FALLBACK_WIDTH = 640;

/** Opacidade do que NÃO faz parte da vizinhança destacada. */
const DIMMED = 0.15;

/** Opacidade de repouso das arestas — elas são o fundo, os nós são o dado. */
const EDGE_OPACITY = 0.45;

/** Distância entre a borda do nó e o rótulo. */
const LABEL_GAP = 5;

/** Tamanho máximo do rótulo; o resto vive no tooltip. */
const LABEL_MAX_CHARS = 18;

/**
 * Quantos rótulos no máximo — acima disso, só os MAIORES nós recebem nome.
 *
 * Rede grande com nome em tudo não é rede grande com contexto: é uma mancha de
 * texto sobre o desenho (200 rótulos de 12px não cabem em 280px de altura, e o
 * que se perde é justamente o desenho). Toda ferramenta do gênero faz esse
 * corte — o Obsidian esconde o nome enquanto o zoom está longe. Aqui o critério
 * é o TAMANHO do nó, que já é a medida de importância: os hubs se apresentam, o
 * satélite se identifica no tooltip.
 */
const LABEL_LIMIT = 16;

/**
 * Degrau de arredondamento da proporção do card.
 *
 * O layout depende do formato do retângulo, e o retângulo muda a cada pixel de
 * arrasto da janela. Sem arredondar, cada pixel dispararia um posicionamento
 * novo — e o usuário veria a rede se reorganizando enquanto redimensiona.
 */
const ASPECT_STEP = 0.25;

export interface GraphCanvasProps {
  /** Grafo lido do dado — é dele que sai a POSIÇÃO. */
  model: GraphModel;
  /** Cor, tamanho e texto de cada marca. */
  view: GraphView;
  /** Layout escolhido no bloco. */
  layout: GraphLayoutKind;
  /** Altura da área de plotagem, em px (a mesma reservada pelo `ChartFrame`). */
  height: number;
  showLabels: boolean;
  showArrows: boolean;
  /** `linkStyle: 'curved'`. */
  curved: boolean;
}

export function GraphCanvas({
  model,
  view,
  layout,
  height,
  showLabels,
  showArrows,
  curved,
}: GraphCanvasProps) {
  const palette = useChartPalette();
  const prefersReducedMotion = useReducedMotion();
  // Um `div` e não um `VStack`: é preciso uma referência ao nó do DOM para
  // medir a largura disponível (`useElementWidth`), e o desenho é vetorial —
  // não há decisão de layout do design system aqui.
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box) ?? FALLBACK_WIDTH;
  const [active, setActive] = useState<string | null>(null);

  const fontSize = palette.typography.axis.size;
  const maxRadius = view.nodes.reduce((max, node) => Math.max(max, node.radius), 0);

  const padding = useMemo(
    () => ({
      top: maxRadius + 4,
      right: maxRadius + 8,
      bottom: maxRadius + (showLabels ? LABEL_GAP + fontSize + 2 : 4),
      left: maxRadius + 8,
    }),
    [maxRadius, showLabels, fontSize],
  );

  // Proporção da ÁREA DE DESENHO (já sem as margens), arredondada para não
  // recalcular o layout a cada pixel de redimensionamento.
  const aspect = useMemo(() => {
    const inner = {
      width: Math.max(width - padding.left - padding.right, 1),
      height: Math.max(height - padding.top - padding.bottom, 1),
    };
    return Math.round(inner.width / inner.height / ASPECT_STEP) * ASPECT_STEP;
  }, [width, height, padding]);

  const { points, fit, extent } = useMemo(
    () => layoutGraph(model, layout, aspect),
    [model, layout, aspect],
  );

  const screen = useMemo(() => {
    const viewport: Viewport = { width, height, padding, fit, extent };
    const map = new Map<string, ScreenNode>();
    for (const node of view.nodes) {
      const point = points.get(node.id);
      const screenPoint = toScreen(point ?? { x: 0.5, y: 0.5 }, viewport);
      map.set(node.id, { x: screenPoint.x, y: screenPoint.y, r: node.radius });
    }
    return map;
  }, [view.nodes, points, fit, extent, width, height, padding]);

  // Quem ganha rótulo: todos, enquanto couber; depois, só os maiores.
  const labelled = useMemo(() => {
    if (!showLabels) return new Set<string>();
    if (view.nodes.length <= LABEL_LIMIT) {
      return new Set(view.nodes.map((node) => node.id));
    }
    return new Set(
      [...view.nodes]
        .sort((a, b) => b.radius - a.radius)
        .slice(0, LABEL_LIMIT)
        .map((node) => node.id),
    );
  }, [view.nodes, showLabels]);

  if (view.nodes.length === 0) return null;

  const neighbours = active ? view.neighbours.get(active) : undefined;
  const litColor = active
    ? (view.nodes.find((node) => node.id === active)?.color ?? palette.chrome('accent'))
    : undefined;
  const isLit = (id: string) => !active || id === active || Boolean(neighbours?.has(id));

  // Movimento: só a transição do realce, e ela some quando o sistema pede menos
  // movimento. O desenho já nasce na posição final (o layout é calculado, não
  // animado), então nada depende do quadro seguinte para existir.
  const fade = prefersReducedMotion
    ? undefined
    : { transition: `opacity ${palette.motion.duration}ms ease-out` };

  return (
    <div ref={box} data-slot="graph-canvas">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="presentation"
        // O `viewBox` acompanha a medida do contêiner, então a escala é 1:1 e o
        // rótulo sai exatamente nos 12px do tema. Com um quadro fixo esticado
        // por `preserveAspectRatio`, o texto encolheria junto com o desenho.
        preserveAspectRatio="xMidYMid meet"
      >
        <g data-slot="graph-edges">
          {view.edges.map((edge) => {
            const from = screen.get(edge.source);
            const to = screen.get(edge.target);
            if (!from || !to) return null;
            const shape = edgeShape(from, to, { curved, arrow: showArrows });
            const lit =
              active != null && (edge.source === active || edge.target === active);
            const stroke = lit && litColor ? litColor : palette.chrome('axis');
            return (
              <g
                key={edge.id}
                data-slot="graph-edge"
                data-source={edge.source}
                data-target={edge.target}
                opacity={active == null || lit ? 1 : DIMMED}
                style={fade}
              >
                <title>{edge.title}</title>
                <path
                  d={shape.path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={edge.width}
                  strokeOpacity={lit ? 1 : EDGE_OPACITY}
                  strokeLinecap="round"
                />
                {shape.arrow ? (
                  <polygon
                    points={shape.arrow}
                    fill={stroke}
                    fillOpacity={lit ? 1 : EDGE_OPACITY}
                  />
                ) : null}
              </g>
            );
          })}
        </g>

        <g data-slot="graph-nodes">
          {view.nodes.map((node) => {
            const point = screen.get(node.id);
            if (!point) return null;
            const lit = isLit(node.id);
            const label = truncate(node.label);
            return (
              <g
                key={node.id}
                data-slot="graph-node"
                data-node-id={node.id}
                data-group={node.group}
                opacity={lit ? 1 : DIMMED}
                style={fade}
                onMouseEnter={() => setActive(node.id)}
                onMouseLeave={() => setActive(null)}
              >
                <title>{node.title}</title>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={node.radius}
                  fill={node.color}
                  // Halo da cor da superfície: é o que separa dois nós
                  // encostados sem inventar uma borda colorida.
                  stroke={palette.chrome('surface')}
                  strokeWidth={palette.geometry.markerStrokeWidth / 2}
                />
                {labelled.has(node.id) ? (
                  <text
                    x={clampLabelX(point.x, estimateTextWidth(label, fontSize), width)}
                    y={point.y + node.radius + LABEL_GAP}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontSize={fontSize}
                    fontWeight={palette.typography.axis.weight}
                    fill={palette.chrome(
                      active != null && node.id === active ? 'emphasis' : 'label',
                    )}
                  >
                    {label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Corta o rótulo longo — o texto inteiro continua no tooltip do nó. */
function truncate(label: string): string {
  return label.length > LABEL_MAX_CHARS
    ? `${label.slice(0, LABEL_MAX_CHARS - 1)}…`
    : label;
}
