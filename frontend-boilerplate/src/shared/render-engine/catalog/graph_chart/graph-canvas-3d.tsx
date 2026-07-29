/**
 * COMPONENTE PRÓPRIO — a nuvem 3D navegável (`dimension: "3d"`).
 *
 * ARRASTAR GIRA. O layout (caro) roda uma vez; girar é trocar dois ângulos e
 * reprojetar (`graph-projection.ts`) — uma dúzia de multiplicações por nó.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O GIRO ESCREVE NO DOM DIRETO, SEM PASSAR PELO REACT
 * ---------------------------------------------------------------------------
 * A primeira versão fazia `setRotation` por quadro e deixava o React
 * re-renderizar. Medido no navegador com a vitrine (≈380 nós + 370 teias +
 * halos ≈ 1.500 elementos SVG): **94ms por quadro** — o "girar" saía a 10fps,
 * um soluço. Reconciliar 1.500 elementos é caro; trocar meia dúzia de
 * atributos em cada um, não.
 *
 * Então o arrasto atualiza os atributos imperativamente (uma vez por quadro,
 * via `requestAnimationFrame`) e o estado React só é commitado no SOLTAR — aí
 * o React reassume, reordena por profundidade (algoritmo do pintor) e tudo
 * volta a ser derivado de estado. É o mesmo padrão de qualquer drag de alta
 * frequência; o DOM nunca fica em desacordo além do gesto em andamento.
 *
 * As pistas de profundidade saem todas da projeção: perto é maior, mais opaco
 * e desenhado por cima. No palco escuro cada nó ganha um halo luminoso — o
 * visual de mapa estelar da referência.
 *
 * A11Y: o giro é um privilégio do ponteiro, como o pan de um mapa — não
 * carrega informação que não esteja no equivalente textual e nos tooltips (a
 * rotação inicial é determinística; painel salvo e PDF mostram sempre o mesmo
 * enquadramento). Sem parada de teclado aqui dentro: o `ChartFrame` anuncia a
 * região como `img`, e elemento focável dentro de `img` é podado da árvore de
 * acessibilidade.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useChartPalette } from '@/shared/ui';
import { useElementWidth } from '@/shared/hooks/use-element-width';
import type { GraphModel } from './graph-data';
import { layoutGraph } from './graph-layout';
import { INITIAL_ROTATION, project, rotateBy, type Rotation } from './graph-projection';
import { stageColors } from './graph-stage';
import { LABEL_DENSITY_LIMIT } from './graph-canvas';
import type { GraphView, GraphViewNode } from './graph-view';

/** Largura usada até a primeira medição (SSR, impressão, primeiro quadro). */
const FALLBACK_WIDTH = 640;

/**
 * Fração do MAIOR lado ocupada pelo miolo da nuvem.
 *
 * Pelo maior, e não pelo menor: inscrever a esfera na altura de um card baixo
 * deixava uma bola pequena com palco sobrando dos dois lados. O enquadramento
 * da referência é o contrário — a nuvem preenche a largura e SANGRA acima e
 * abaixo, e o corte é o que dá a sensação de estar DENTRO de algo grande.
 */
const FILL_RATIO = 0.92;

/**
 * A escala do desenho vem do raio EFETIVO (percentil 70 das distâncias à
 * origem), não do ponto mais distante. Escalar pelo máximo fazia a nuvem
 * inteira caber com folga — medido: uma bolinha ocupando um terço do palco,
 * flutuando no escuro. Com o percentil, o corpo da nuvem preenche o card e os
 * pontos extremos sangram a borda, como na referência.
 */
const FILL_PERCENTILE = 0.7;

/**
 * Reforço do raio do nó na projeção 3D. A escala de densidade do 2D produz
 * pontos de 2px numa rede de 400 nós — no palco escuro isso é poeira, não
 * estrela. A referência usa pontos gordos (3 a 8px); o reforço recoloca a
 * marca nessa faixa sem mexer na régua do 2D.
 */
const NODE_BOOST = 1.5;

/** Raio mínimo desenhado, em px — abaixo disso o ponto não existe ao olho. */
const NODE_MIN_RADIUS = 1.3;

/**
 * Halo luminoso no palco escuro — SÓ nos centros (grau ≥ 2).
 *
 * A primeira versão dava brilho a todos os 380 pontos, e cada halo é uma
 * camada de mistura que o navegador repinta a cada quadro do giro — medido,
 * era o grosso dos ~28ms de paint. O brilho de um satélite de 2px é invisível
 * mesmo; o dos hubs é o que dá o clima de mapa estelar. Ficam ~25 halos.
 */
const GLOW = { ratio: 2.4, opacity: 0.18 } as const;

/** Opacidade de repouso das teias — na referência elas são um fundo tênue. */
const EDGE_OPACITY = 0.34;

/** Satélite levemente pálido; centros cheios (no escuro, pouco — senão some). */
const LEAF_FILL = 0.85;

/** Opacidade de quem NÃO é vizinho do nó sob o cursor. */
const DIMMED = 0.12;

export interface GraphCanvas3DProps {
  model: GraphModel;
  view: GraphView;
  /** Altura da área de plotagem, em px. */
  height: number;
  showLabels: boolean;
  /** Palco escuro (mapa estelar) em vez da superfície do card. */
  darkStage: boolean;
}

export function GraphCanvas3D({
  model,
  view,
  height,
  showLabels,
  darkStage,
}: GraphCanvas3DProps) {
  const palette = useChartPalette();
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box) ?? FALLBACK_WIDTH;

  const [rotation, setRotation] = useState<Rotation>(INITIAL_ROTATION);
  const [active, setActive] = useState<string | null>(null);
  const nodesLayer = useRef<SVGGElement>(null);
  const edgesLayer = useRef<SVGGElement>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    base: Rotation;
    pending: Rotation;
  } | null>(null);
  const frame = useRef(0);
  /**
   * Estrutura do DOM montada UMA vez por gesto (no apertar) e descartada no
   * soltar. Sem ela, cada quadro fazia ~760 `querySelector` para reencontrar
   * círculos e rótulos — medido: 56ms por quadro SÓ de busca, com a escrita de
   * atributos custando quase nada. O DOM não muda durante o gesto (o React só
   * reassume no soltar), então buscar uma vez é suficiente e honesto.
   */
  const gesture = useRef<{
    nodes: {
      node: GraphViewNode;
      glow: SVGCircleElement | null;
      dot: SVGCircleElement;
      label: SVGTextElement | null;
    }[];
  } | null>(null);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const { points, radius } = useMemo(() => {
    const layout = layoutGraph(model, 'force', 1, true);
    const norms = [...layout.points.values()]
      .map((point) => Math.hypot(point.x, point.y, point.z))
      .sort((a, b) => a - b);
    const effective =
      norms.length > 0
        ? norms[Math.min(norms.length - 1, Math.floor(norms.length * FILL_PERCENTILE))]
        : 1;
    return { points: layout.points, radius: Math.max(effective, 1e-6) };
  }, [model]);

  const nodeById = useMemo(
    () => new Map(view.nodes.map((node) => [node.id, node])),
    [view.nodes],
  );

  const stage = stageColors(palette, darkStage);
  const scale = ((Math.max(width, height) / 2) * FILL_RATIO) / radius;
  const centerX = width / 2;
  const centerY = height / 2;

  const drawRadius = (node: GraphViewNode, perspective: number) =>
    Math.max(node.radius * NODE_BOOST * perspective, NODE_MIN_RADIUS);

  // Projeção da rotação COMMITADA — o arrasto em andamento escreve no DOM.
  const scene = useMemo(() => {
    const projected = new Map<
      string,
      { x: number; y: number; depth: number; scale: number; fade: number }
    >();
    for (const [id, point] of points) {
      const p = project(point, rotation, radius);
      projected.set(id, {
        x: Math.round((centerX + p.x * scale) * 100) / 100,
        y: Math.round((centerY + p.y * scale) * 100) / 100,
        depth: p.depth,
        scale: p.scale,
        fade: p.fade,
      });
    }
    // Algoritmo do pintor: o fundo desenha primeiro, a frente por cima.
    const order = [...view.nodes].sort(
      (a, b) => (projected.get(a.id)?.depth ?? 0) - (projected.get(b.id)?.depth ?? 0),
    );
    return { projected, order };
  }, [points, rotation, radius, view.nodes, scale, centerX, centerY]);

  if (view.nodes.length === 0) return null;

  const isDense = view.nodes.length > LABEL_DENSITY_LIMIT;
  const neighbours = active ? view.neighbours.get(active) : undefined;
  const isLit = (id: string) => !active || id === active || Boolean(neighbours?.has(id));

  /** Busca a estrutura do DOM uma vez — chamado no início do gesto. */
  const captureGesture = () => {
    const nodeEls = nodesLayer.current?.querySelectorAll<SVGGElement>('[data-node-id]');
    if (!nodeEls) return;
    const nodes: NonNullable<typeof gesture.current>['nodes'] = [];
    nodeEls.forEach((el) => {
      const id = el.getAttribute('data-node-id');
      const node = id ? nodeById.get(id) : undefined;
      if (!node) return;
      const circles = el.querySelectorAll('circle');
      const dot = circles[circles.length - 1];
      if (!dot) return;
      nodes.push({
        node,
        glow: circles.length > 1 ? circles[0] : null,
        dot,
        label: el.querySelector('text'),
      });
    });
    gesture.current = { nodes };
  };

  /**
   * Reprojeta e escreve os atributos DIRETO no DOM — o caminho do arrasto.
   * Não reordena camadas (o pintor só corrige no soltar): com pontos pequenos
   * a ordem errada por meio segundo é invisível, e reordenar custaria o quadro.
   */
  const applyRotation = (next: Rotation) => {
    const captured = gesture.current;
    if (!captured) return;
    const projected = new Map<
      string,
      { x: number; y: number; scale: number; fade: number }
    >();
    for (const [id, point] of points) {
      const p = project(point, next, radius);
      projected.set(id, {
        x: centerX + p.x * scale,
        y: centerY + p.y * scale,
        scale: p.scale,
        fade: p.fade,
      });
    }

    for (const { node, glow, dot, label } of captured.nodes) {
      const p = projected.get(node.id);
      if (!p) continue;
      const r = drawRadius(node, p.scale);
      if (glow) {
        glow.setAttribute('cx', String(p.x));
        glow.setAttribute('cy', String(p.y));
        glow.setAttribute('r', String(r * GLOW.ratio));
        glow.setAttribute('opacity', String(GLOW.opacity * p.fade));
      }
      dot.setAttribute('cx', String(p.x));
      dot.setAttribute('cy', String(p.y));
      dot.setAttribute('r', String(r));
      dot.setAttribute(
        'fill-opacity',
        String((node.degree <= 1 ? LEAF_FILL : 1) * p.fade),
      );
      if (label) {
        label.setAttribute('x', String(p.x));
        label.setAttribute('y', String(p.y + r + 5));
        label.setAttribute('opacity', String(p.fade));
      }
    }

    // As teias não são atualizadas aqui: ficam ESCONDIDAS durante o gesto
    // (nível de detalhe — ver `onPointerDown`) e voltam já corretas no soltar,
    // quando o React re-renderiza com a rotação commitada.
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    // Capturar o ponteiro mantém o giro vivo quando o cursor sai do card. É
    // best-effort DE PROPÓSITO: com um ponteiro que o navegador não reconhece
    // (evento sintético de teste), `setPointerCapture` LANÇA — e a exceção
    // engolia o início do arrasto inteiro.
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* sem captura o giro ainda funciona; só solta ao sair do card */
    }
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      base: rotation,
      pending: rotation,
    };
    captureGesture();
    // Antialiasing econômico durante o gesto: em SVG denso o suavizado fino é
    // uma fatia real do quadro, e ninguém lê serrilhado com a cena em movimento.
    event.currentTarget.style.shapeRendering = 'optimizeSpeed';
    event.currentTarget.style.cursor = 'grabbing';
    /**
     * NÍVEL DE DETALHE DO GESTO: as teias somem enquanto a nuvem gira e voltam
     * no soltar. Pintar ~370 traços translúcidos por quadro era metade do
     * custo do giro; o que o gesto precisa mostrar é a FORMA da nuvem, e a
     * forma são os pontos. É o mesmo recurso de qualquer editor 3D, que
     * degrada a cena durante a órbita e devolve o acabamento na pausa.
     */
    if (edgesLayer.current) edgesLayer.current.style.display = 'none';
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    current.pending = rotateBy(
      current.base,
      event.clientX - current.x,
      event.clientY - current.y,
    );
    // Um quadro por vez, direto no DOM — ver o bloco de comentário do topo.
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (drag.current) applyRotation(drag.current.pending);
      });
    }
  };

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    gesture.current = null;
    event.currentTarget.style.shapeRendering = '';
    event.currentTarget.style.cursor = 'grab';
    if (edgesLayer.current) edgesLayer.current.style.display = '';
    // O React reassume: reordena por profundidade e volta a mandar no DOM.
    setRotation(current.pending);
  };

  return (
    <div ref={box} data-slot="graph-canvas" data-projection="3d">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="presentation"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // runtime: affordance do giro; touch-action libera o arrasto no toque
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        {stage.fill ? (
          <rect
            data-slot="graph-stage"
            width={width}
            height={height}
            rx={palette.geometry.containerRadius}
            fill={stage.fill}
          />
        ) : null}

        <g data-slot="graph-edges" ref={edgesLayer}>
          {view.edges.map((edge) => {
            const from = scene.projected.get(edge.source);
            const to = scene.projected.get(edge.target);
            if (!from || !to) return null;
            const lit =
              active != null && (edge.source === active || edge.target === active);
            const litColor = view.nodes.find((node) => node.id === active)?.color;
            const fade = Math.min(from.fade, to.fade);
            return (
              <line
                key={edge.id}
                data-slot="graph-edge"
                data-source={edge.source}
                data-target={edge.target}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={lit && litColor ? litColor : stage.edge}
                strokeWidth={edge.width * ((from.scale + to.scale) / 2)}
                strokeOpacity={
                  active == null ? EDGE_OPACITY * fade : lit ? fade : DIMMED * fade
                }
                strokeLinecap="round"
              >
                <title>{edge.title}</title>
              </line>
            );
          })}
        </g>

        <g data-slot="graph-nodes" ref={nodesLayer}>
          {scene.order.map((node) => {
            const p = scene.projected.get(node.id);
            if (!p) return null;
            const r = drawRadius(node, p.scale);
            const lit = isLit(node.id);
            const opacity = (lit ? 1 : DIMMED) * p.fade;
            return (
              <g
                key={node.id}
                data-slot="graph-node"
                data-node-id={node.id}
                data-group={node.group}
                onMouseEnter={() => setActive(node.id)}
                onMouseLeave={() => setActive(null)}
              >
                <title>{node.title}</title>
                {darkStage && node.degree > 1 ? (
                  // O brilho: um disco maior e tênue por trás do centro.
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r * GLOW.ratio}
                    fill={node.color}
                    opacity={GLOW.opacity * opacity}
                  />
                ) : null}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={node.color}
                  fillOpacity={
                    (node.degree <= 1 && node.id !== active ? LEAF_FILL : 1) * opacity
                  }
                  stroke={darkStage ? undefined : stage.halo}
                  strokeWidth={darkStage ? undefined : Math.min(1.5, r * 0.35)}
                />
                {showLabels && (!isDense || node.id === active) ? (
                  <text
                    x={p.x}
                    y={p.y + r + 5}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontSize={palette.typography.axis.size}
                    fontWeight={palette.typography.axis.weight}
                    fill={node.id === active ? stage.labelActive : stage.label}
                    opacity={p.fade}
                  >
                    {node.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>

        {/* Convite ao gesto — descoberta é metade de uma interação existir. */}
        <text
          data-slot="graph-hint"
          x={width - 10}
          y={height - 8}
          textAnchor="end"
          fontSize={11}
          fill={stage.label}
          opacity={0.75}
        >
          arraste para girar
        </text>
      </svg>
    </div>
  );
}
