/**
 * Regressão do bloco `graph_chart`.
 *
 * O que este arquivo trava:
 * 1. OS QUATRO ESTADOS — carregando, sem dados, erro e com dados. Uma rede
 *    vazia em silêncio é indistinguível de "deu ruim".
 * 2. LEITURA SEM VER — os nós vivem dentro do SVG; quem conta a história para
 *    o leitor de tela é o equivalente textual (quantos nós, ligações, grupos e
 *    camadas) e a legenda, que ficam FORA da região `role="img"`.
 * 3. COR É IDENTIDADE DO GRUPO — cada grupo pega a próxima cor da paleta base,
 *    NA ORDEM, e sempre como token do design system (nunca hex escrito à mão).
 * 4. AS PROPS MUDAM O DESENHO — layout, rótulo, seta e cor única. Prop que o
 *    manifesto anuncia e o desenho ignora é contrato quebrado com o agente.
 * 5. O REALCE DE VIZINHANÇA — passar o cursor num nó apaga quem não é vizinho.
 *
 * Consultas por papel acessível e por `data-slot` — nunca por classe (os nomes
 * do StyleX são hashes e mudam a cada build).
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_HEIGHT } from '@/shared/ui';
import { definition } from './component';
import { fixture, funnelFixture } from './fixture';

const Block = definition.Component;

/** Rede mínima: dois grupos, uma ligação. */
const SMALL = {
  columns: [{ key: 'tipo', label: 'tipo' }],
  rows: [
    { tipo: 'no', id: 'a', rotulo: 'Alfa', grupo: 'Origem', valor: 10 },
    { tipo: 'no', id: 'b', rotulo: 'Beta', grupo: 'Destino', valor: 4 },
    { tipo: 'aresta', origem: 'a', destino: 'b', valor: 4 },
  ],
};

const nodes = (container: HTMLElement) => [
  ...container.querySelectorAll('[data-slot="graph-node"]'),
];
const edges = (container: HTMLElement) => [
  ...container.querySelectorAll('[data-slot="graph-edge"]'),
];
const fills = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-slot="graph-node"] circle')].map((node) =>
    node.getAttribute('fill'),
  );

describe('bloco graph_chart — estados', () => {
  it('mostra esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando a consulta não devolveu nenhum nó', () => {
    renderWithProviders(
      <Block props={{}} data={{ columns: [], rows: [] }} state="success" />,
    );
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });

  it('mostra a causa do erro no lugar do desenho', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={{ columns: [], rows: [] }}
        state="error"
        error="Consulta expirou"
      />,
    );
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

describe('bloco graph_chart — leitura sem ver', () => {
  it('anuncia a rede como imagem de dados', () => {
    renderWithProviders(<Block props={{}} data={funnelFixture} state="success" />);
    expect(screen.getByRole('img', { name: /grafo/i })).toBeInTheDocument();
  });

  it('publica tamanho, grupos e camadas como equivalente textual', () => {
    renderWithProviders(<Block props={{}} data={funnelFixture} state="success" />);
    expect(
      screen.getByText('Grafo com 8 nós, 8 ligações, 4 grupos, 4 camadas'),
    ).toBeInTheDocument();
  });

  it('reserva a altura padrão do catálogo (280px)', () => {
    renderWithProviders(<Block props={{}} data={funnelFixture} state="success" />);
    expect(screen.getByRole('img', { name: /grafo/i })).toHaveStyle({
      height: `${CHART_HEIGHT.default}px`,
    });
  });

  it('cada nó e cada aresta carregam o próprio texto de apoio', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={SMALL} state="success" />,
    );
    expect(container.querySelector('[data-node-id="a"] title')?.textContent).toBe(
      'Alfa · 10 · 1 ligação · Origem',
    );
    expect(container.querySelector('[data-slot="graph-edge"] title')?.textContent).toBe(
      'Alfa → Beta · 4',
    );
  });
});

describe('bloco graph_chart — legenda e cor', () => {
  /**
   * As consultas aqui são no `textContent` da legenda, e não por texto solto:
   * os mesmos números aparecem nos `<title>` das arestas (é um funil — o
   * volume se conserva de uma camada para a outra), então `getByText` acharia
   * dois elementos e falharia por ambiguidade.
   */
  it('lista uma entrada por grupo, com o total do grupo', () => {
    renderWithProviders(<Block props={{}} data={funnelFixture} state="success" />);
    const legend = screen.getByRole('list');
    expect(legend.querySelectorAll('li')).toHaveLength(4);
    expect(legend.textContent).toContain('N2 · Cobrança');
    // 8.060.686 (pago) + 2.774.676 (inscrito).
    expect(legend.textContent).toContain('10.835.362');
  });

  it('pinta os grupos com a paleta base NA ORDEM, sempre por token', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={funnelFixture} state="success" />,
    );
    const legend = screen.getByRole('list');
    // 1ª cor da referência (#00A76F) e 2ª (#FFAB00), como token do DS.
    expect(legend.innerHTML).toContain('var(--ds-color-primary-main)');
    expect(legend.innerHTML).toContain('var(--ds-color-warning-main)');
    expect(legend.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    // No SVG a cor é RESOLVIDA (atributo de apresentação não aceita `var()`).
    expect(fills(container)).toContain('#00A76F');
    expect(fills(container)).toContain('#FFAB00');
  });

  it('`accent` fixa a cor de todos os nós e dispensa a legenda de grupos', () => {
    const { container } = renderWithProviders(
      <Block props={{ accent: 'chart-3' }} data={funnelFixture} state="success" />,
    );
    expect(new Set(fills(container))).toEqual(new Set(['#00B8D9']));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('esconde a legenda quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showLegend: false }} data={funnelFixture} state="success" />,
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('`valueFormat` muda a unidade do total na legenda', () => {
    renderWithProviders(
      <Block
        props={{ valueFormat: 'compactBRL' }}
        data={funnelFixture}
        state="success"
      />,
    );
    // O bloco não adivinha a natureza do dado: contagem é o default, moeda é
    // escolha explícita (`lib/value-format.ts`).
    expect(screen.getByRole('list').textContent).toContain('R$');
  });
});

describe('bloco graph_chart — props que mudam o desenho', () => {
  it('desenha um nó por vértice e uma aresta por ligação', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={funnelFixture} state="success" />,
    );
    expect(nodes(container)).toHaveLength(8);
    expect(edges(container)).toHaveLength(8);
  });

  it('`layout: "layered"` alinha a camada numa coluna; "force" não', () => {
    const { container: layered, unmount } = renderWithProviders(
      <Block props={{ layout: 'layered' }} data={funnelFixture} state="success" />,
    );
    const columnOf = (root: HTMLElement, id: string) =>
      root.querySelector(`[data-node-id="${id}"] circle`)?.getAttribute('cx');
    // Mesma camada (N3), mesma coluna.
    expect(columnOf(layered, 'parcelado')).toBe(columnOf(layered, 'ajuizado'));
    unmount();

    const { container: force } = renderWithProviders(
      <Block props={{ layout: 'force' }} data={funnelFixture} state="success" />,
    );
    expect(columnOf(force, 'parcelado')).not.toBe(columnOf(force, 'ajuizado'));
  });

  it('`showLabels` liga e desliga o rótulo dos nós', () => {
    const { container: withLabels, unmount } = renderWithProviders(
      <Block props={{ showLabels: true }} data={SMALL} state="success" />,
    );
    expect(withLabels.querySelectorAll('[data-slot="graph-node"] text')).toHaveLength(2);
    unmount();

    const { container: bare } = renderWithProviders(
      <Block props={{ showLabels: false }} data={SMALL} state="success" />,
    );
    expect(bare.querySelectorAll('[data-slot="graph-node"] text')).toHaveLength(0);
    // O desenho continua: o rótulo é leitura, não dado.
    expect(nodes(bare)).toHaveLength(2);
  });

  it('`showArrows` liga e desliga a ponta de seta', () => {
    const { container: directed, unmount } = renderWithProviders(
      <Block props={{ showArrows: true }} data={SMALL} state="success" />,
    );
    expect(directed.querySelectorAll('polygon')).toHaveLength(1);
    unmount();

    const { container: plain } = renderWithProviders(
      <Block props={{ showArrows: false }} data={SMALL} state="success" />,
    );
    expect(plain.querySelectorAll('polygon')).toHaveLength(0);
  });

  it('`linkStyle: "curved"` troca a reta por um arco', () => {
    const { container } = renderWithProviders(
      <Block props={{ linkStyle: 'curved' }} data={SMALL} state="success" />,
    );
    expect(
      container.querySelector('[data-slot="graph-edge"] path')?.getAttribute('d'),
    ).toContain('Q');
  });
});

/**
 * VOLUME — a vitrine do bloco é uma rede de ~180 nós, e um grafo grande só é
 * legível se a marca encolher junto: 200 discos de 12px com rótulo em cada um
 * viram uma mancha no lugar do desenho.
 */
describe('bloco graph_chart — rede densa', () => {
  it('desenha a rede inteira da vitrine', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    expect(nodes(container).length).toBeGreaterThan(150);
    expect(edges(container).length).toBeGreaterThan(150);
  });

  it('encolhe a marca conforme a rede cresce', () => {
    const radiusOf = (root: HTMLElement) =>
      [...root.querySelectorAll('[data-slot="graph-node"] circle')].map((node) =>
        Number(node.getAttribute('r')),
      );

    const { container: dense, unmount } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    const denseMax = Math.max(...radiusOf(dense));
    unmount();

    const { container: sparse } = renderWithProviders(
      <Block props={{}} data={funnelFixture} state="success" />,
    );
    const sparseMax = Math.max(...radiusOf(sparse));

    // O maior nó da rede densa é bem menor que o da rede pequena…
    expect(denseMax).toBeLessThan(sparseMax / 2);
    // …e mesmo assim nenhum nó vira um ponto invisível.
    expect(Math.min(...radiusOf(dense))).toBeGreaterThan(1.5);
  });

  /**
   * A tentativa anterior era rotular "os 16 maiores". Medido em pixel, 16
   * rótulos de 12px sobre 223 pontos num card de 359×280 fazem o TEXTO virar a
   * figura. Rede densa não desenha rótulo fixo — o nome aparece no nó sob o
   * cursor, e o tooltip continua em todos.
   */
  it('rede densa não escreve rótulo fixo: o nome vem no hover', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    expect(container.querySelectorAll('[data-slot="graph-node"] text')).toHaveLength(0);
    // Todo nó continua identificável no tooltip.
    expect(container.querySelectorAll('[data-slot="graph-node"] title').length).toBe(
      nodes(container).length,
    );

    fireEvent.mouseOver(container.querySelector('[data-node-id="CIV-hub"]') as Element);
    const labels = [...container.querySelectorAll('[data-slot="graph-node"] text')];
    expect(labels).toHaveLength(1);
    expect(labels[0].textContent).toBe('Construtora Vale');
  });

  it('rede pequena continua com rótulo em todos os nós', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={funnelFixture} state="success" />,
    );
    expect(container.querySelectorAll('[data-slot="graph-node"] text')).toHaveLength(8);
  });

  it('`showLabels: false` continua desligando tudo', () => {
    const { container } = renderWithProviders(
      <Block props={{ showLabels: false }} data={fixture} state="success" />,
    );
    expect(container.querySelectorAll('[data-slot="graph-node"] text')).toHaveLength(0);
  });
});

/**
 * A NUVEM 3D (`dimension: "3d"`) — a projeção com profundidade que se gira com
 * o mouse. O que o teste alcança sem olho: a cena existe e é determinística, a
 * profundidade vira tamanho (perto maior que longe), o palco escuro entra por
 * token, e ARRASTAR muda a projeção — a prop anunciada ao agente faz algo.
 */
describe('bloco graph_chart — nuvem 3D', () => {
  const props = { dimension: '3d', background: 'dark' } as const;

  it('desenha a rede inteira em profundidade, sem NaN', () => {
    const { container } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    expect(container.querySelector('[data-projection="3d"]')).toBeInTheDocument();
    expect(nodes(container).length).toBeGreaterThan(150);
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('perto aparece maior que longe (a profundidade vira tamanho)', () => {
    const { container } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    // O MESMO nó da vitrine em profundidades diferentes: os satélites de um hub
    // têm o mesmo raio de dado, então qualquer diferença de raio na tela é a
    // perspectiva agindo.
    const radii = [
      ...container.querySelectorAll('[data-group="Comércio varejista"] circle'),
    ]
      .map((c) => Number(c.getAttribute('r')))
      .filter((r) => Number.isFinite(r));
    expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii) * 1.15);
  });

  it('o palco escuro entra como token resolvido do tema, nunca `var()` cru', () => {
    const { container } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    const stage = container.querySelector('[data-slot="graph-stage"]');
    expect(stage).toBeInTheDocument();
    expect(stage?.getAttribute('fill')).not.toContain('var(');
  });

  it('sem `background: "dark"` não há palco: a plotagem fica na superfície do card', () => {
    const { container } = renderWithProviders(
      <Block props={{ dimension: '3d' }} data={fixture} state="success" />,
    );
    expect(container.querySelector('[data-slot="graph-stage"]')).not.toBeInTheDocument();
  });

  it('ARRASTAR gira a nuvem — a projeção muda de verdade', () => {
    const { container } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    const svg = container.querySelector('[data-projection="3d"] svg') as SVGSVGElement;
    const before = container
      .querySelector('[data-node-id="CIV-hub"] circle:last-of-type')
      ?.getAttribute('cx');

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 180, clientY: 120 });
    fireEvent.pointerUp(svg, { pointerId: 1 });

    const after = container
      .querySelector('[data-node-id="CIV-hub"] circle:last-of-type')
      ?.getAttribute('cx');
    expect(after).not.toBe(before);
  });

  it('a projeção inicial é determinística: dois renders, o mesmo desenho', () => {
    const { container: first, unmount } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    const snapshot = (root: HTMLElement) =>
      [...root.querySelectorAll('[data-slot="graph-node"] circle')]
        .slice(0, 12)
        .map((c) => `${c.getAttribute('cx')},${c.getAttribute('cy')}`)
        .join('|');
    const a = snapshot(first);
    unmount();

    const { container: second } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    expect(snapshot(second)).toBe(a);
  });

  it('convida ao gesto ("arraste para girar")', () => {
    const { container } = renderWithProviders(
      <Block props={props} data={fixture} state="success" />,
    );
    expect(container.querySelector('[data-slot="graph-hint"]')?.textContent).toBe(
      'arraste para girar',
    );
  });

  it('funil continua PLANO: com layout "layered", `dimension: "3d"` é ignorada', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ dimension: '3d', layout: 'layered' }}
        data={funnelFixture}
        state="success"
      />,
    );
    expect(container.querySelector('[data-projection="3d"]')).not.toBeInTheDocument();
    expect(nodes(container)).toHaveLength(8);
  });
});

describe('bloco graph_chart — realce de vizinhança', () => {
  it('o cursor sobre um nó apaga quem não é vizinho dele', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={funnelFixture} state="success" />,
    );
    const opacityOf = (id: string) =>
      container.querySelector(`[data-node-id="${id}"]`)?.getAttribute('opacity');

    expect(opacityOf('quitado')).toBe('1');

    fireEvent.mouseOver(container.querySelector('[data-node-id="lancado"]') as Element);
    // `pago` é vizinho direto de `lancado`; `quitado` está a três saltos.
    expect(opacityOf('lancado')).toBe('1');
    expect(opacityOf('pago')).toBe('1');
    expect(opacityOf('quitado')).not.toBe('1');

    fireEvent.mouseOut(container.querySelector('[data-node-id="lancado"]') as Element);
    expect(opacityOf('quitado')).toBe('1');
  });
});

describe('bloco graph_chart — leitura de rodapé', () => {
  it('resume tamanho, nó central e maior ligação', () => {
    const insights = definition.deriveTakeaway?.(funnelFixture, {});
    expect(insights).toEqual([
      '8 nós e 8 ligações em 4 camadas',
      'Nó mais conectado: Inscrito em DA (4 ligações)',
      'Maior ligação: Lançado → Pago (8.060.686)',
    ]);
  });

  it('não inventa insight quando não há grafo', () => {
    expect(definition.deriveTakeaway?.({ columns: [], rows: [] }, {})).toBeUndefined();
  });
});
