/**
 * A MATEMÁTICA do grafo — leitura dos dados, camadas, posicionamento e traçado
 * das arestas. Tudo função pura, testada sem montar tela.
 *
 * O que este arquivo trava:
 *  1. AS TOLERÂNCIAS DA LEITURA — nó implícito (o caso que permite desenhar um
 *     fluxo com uma consulta só), papel deduzido sem a coluna `tipo` e
 *     sinônimos em inglês. São o que separa "o grafo apareceu" de "o card veio
 *     vazio e ninguém sabe por quê".
 *  2. O DESENHO É DETERMINÍSTICO — mesmo dado, mesmas coordenadas. É o que
 *     permite que o painel não mude de forma a cada recarga e que o PDF saia
 *     igual à tela.
 *  3. CAMADA — declarada manda; deduzida sai do caminho mais longo; ciclo não
 *     trava o laço.
 *  4. O AGLOMERADO — folha em coroa ao redor do hub e grupo junto na tela. É a
 *     leitura que o layout existe para dar, e a única prova possível dela é
 *     medir distância entre nós.
 *  5. A ARESTA NASCE NA BORDA DO NÓ, não no centro — passar por baixo do
 *     círculo é o que faz um grafo parecer uma teia furada.
 */
import { describe, expect, it } from 'vitest';
import type { TableData } from '@dashboards/contracts';
import { degreesOf, groupsOf, readGraph } from './graph-data';
import { computeLayers, layoutGraph } from './graph-layout';
import { edgeShape, toScreen } from './graph-geometry';
import { fixture, funnelFixture } from './fixture';

/** Monta um `TableData` só com as linhas — as colunas não são lidas. */
function table(rows: Record<string, unknown>[]): TableData {
  return { columns: [{ key: 'tipo', label: 'tipo' }], rows };
}

/** Distância entre dois pontos do quadrado unitário. */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('readGraph — leitura das linhas', () => {
  it('lê nós e arestas declarados pela coluna `tipo`', () => {
    const model = readGraph(funnelFixture);
    expect(model.nodes).toHaveLength(8);
    expect(model.edges).toHaveLength(8);
    expect(model.nodes[0]).toMatchObject({
      id: 'lancado',
      label: 'Lançado',
      group: 'N1 · Lançamento',
      layer: 0,
    });
  });

  it('cria o nó citado apenas na aresta (fluxo com uma consulta só)', () => {
    const model = readGraph(table([{ tipo: 'aresta', origem: 'a', destino: 'b' }]));
    expect(model.nodes.map((node) => node.id)).toEqual(['a', 'b']);
    // Sem declaração, o rótulo é o próprio id — nunca vazio.
    expect(model.nodes[0].label).toBe('a');
  });

  it('deduz o papel da linha quando não há coluna `tipo`', () => {
    const model = readGraph(
      table([
        { id: 'a', rotulo: 'A' },
        { origem: 'a', destino: 'b', valor: 3 },
      ]),
    );
    expect(model.nodes.map((node) => node.label)).toEqual(['A', 'b']);
    expect(model.edges[0]).toMatchObject({ source: 'a', target: 'b', value: 3 });
  });

  it('aceita os nomes em inglês das colunas', () => {
    const model = readGraph(
      table([
        { type: 'no', id: 'a', label: 'Alfa', group: 'G1', value: 10, layer: 2 },
        { source: 'a', target: 'b', value: 5 },
      ]),
    );
    expect(model.nodes[0]).toMatchObject({
      label: 'Alfa',
      group: 'G1',
      value: 10,
      layer: 2,
    });
    expect(model.edges[0]).toMatchObject({ source: 'a', target: 'b' });
  });

  it('descarta laço sobre o próprio nó e meia-aresta', () => {
    const model = readGraph(
      table([
        { tipo: 'aresta', origem: 'a', destino: 'a' },
        { tipo: 'aresta', origem: 'b' },
        { tipo: 'aresta', origem: 'b', destino: 'c' },
      ]),
    );
    expect(model.edges).toHaveLength(1);
    expect(model.edges[0]).toMatchObject({ source: 'b', target: 'c' });
  });

  it('conta as ligações de cada nó e lista os grupos na ordem de aparição', () => {
    const model = readGraph(funnelFixture);
    expect(degreesOf(model).get('inscrito')).toBe(4);
    expect(groupsOf(model)).toEqual([
      'N1 · Lançamento',
      'N2 · Cobrança',
      'N3 · Desfecho',
      'N4 · Situação',
    ]);
  });
});

describe('computeLayers — camadas', () => {
  it('respeita a camada declarada', () => {
    const layers = computeLayers(readGraph(funnelFixture));
    expect(layers.get('lancado')).toBe(0);
    expect(layers.get('inscrito')).toBe(1);
    expect(layers.get('estoque')).toBe(3);
  });

  it('deduz a camada pelo caminho mais longo quando ela não vem no dado', () => {
    const model = readGraph(
      table([
        { tipo: 'aresta', origem: 'a', destino: 'b' },
        { tipo: 'aresta', origem: 'b', destino: 'c' },
        { tipo: 'aresta', origem: 'a', destino: 'c' },
      ]),
    );
    const layers = computeLayers(model);
    // `c` recebe o caminho LONGO (a→b→c), não o atalho (a→c).
    expect([layers.get('a'), layers.get('b'), layers.get('c')]).toEqual([0, 1, 2]);
  });

  it('não trava quando o grafo tem ciclo', () => {
    const model = readGraph(
      table([
        { tipo: 'aresta', origem: 'a', destino: 'b' },
        { tipo: 'aresta', origem: 'b', destino: 'a' },
      ]),
    );
    const layers = computeLayers(model);
    expect([...layers.values()].every(Number.isFinite)).toBe(true);
  });
});

describe('layoutGraph — posicionamento', () => {
  const model = readGraph(funnelFixture);

  it('é determinístico: o mesmo dado desenha sempre igual', () => {
    const first = layoutGraph(readGraph(fixture), 'force');
    const second = layoutGraph(readGraph(fixture), 'force');
    for (const [id, point] of first.points) {
      expect(second.points.get(id)).toEqual(point);
    }
  });

  it('mantém todos os nós dentro do quadro, nos três layouts', () => {
    for (const kind of ['force', 'layered', 'radial'] as const) {
      for (const point of layoutGraph(model, kind).points.values()) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('layered põe uma COLUNA por camada, da esquerda para a direita', () => {
    const { points, layerCount } = layoutGraph(model, 'layered');
    expect(layerCount).toBe(4);
    expect(points.get('lancado')?.x).toBe(0);
    expect(points.get('estoque')?.x).toBe(1);
    // Mesma camada, mesma coluna.
    expect(points.get('pago')?.x).toBe(points.get('inscrito')?.x);
    expect(points.get('pago')?.y).not.toBe(points.get('inscrito')?.y);
  });

  /**
   * REGRESSÃO: no card largo do playground (1397×280) a rede saía esticada
   * numa faixa — 1349px de largura para 110px de altura —, porque o desenho
   * era projetado esticando cada eixo por um fator diferente. Numa simulação
   * de forças a DISTÂNCIA é a informação; esticá-la é apagar a leitura.
   */
  it('só a GRADE (layered) pode ser esticada; força e radial escalam igual', () => {
    expect(layoutGraph(model, 'layered').fit).toBe('stretch');
    expect(layoutGraph(model, 'force').fit).toBe('uniform');
    expect(layoutGraph(model, 'radial').fit).toBe('uniform');
  });

  it('a força publica a proporção real do desenho (maior lado = 1)', () => {
    const { extent } = layoutGraph(model, 'force');
    expect(Math.max(extent.x, extent.y)).toBeCloseTo(1, 5);
    expect(Math.min(extent.x, extent.y)).toBeGreaterThan(0);
  });

  it('num retângulo largo, a projeção uniforme preserva a proporção do desenho', () => {
    const { points, extent } = layoutGraph(model, 'force');
    const viewport = {
      width: 1397,
      height: 280,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      fit: 'uniform' as const,
      extent,
    };
    const screen = [...points.values()].map((point) => toScreen(point, viewport));
    const spanX =
      Math.max(...screen.map((p) => p.x)) - Math.min(...screen.map((p) => p.x));
    const spanY =
      Math.max(...screen.map((p) => p.y)) - Math.min(...screen.map((p) => p.y));
    // A proporção na tela é a MESMA do layout (tolerância de arredondamento).
    expect(spanX / spanY).toBeCloseTo(extent.x / extent.y, 1);
    // E o desenho continua dentro do quadro.
    expect(Math.max(...screen.map((p) => p.x))).toBeLessThanOrEqual(1397);
    expect(Math.max(...screen.map((p) => p.y))).toBeLessThanOrEqual(280);
  });

  /**
   * REGRESSÃO: com a simulação sempre em quadrado, uma rede num card 5:1
   * aparecia como um quadradinho no meio, com 70% do card vazio dos lados. A
   * proporção do card entra na simulação (não é um esticão depois de pronta),
   * então a rede nasce no formato do espaço que tem.
   */
  it('a rede se organiza no FORMATO do card', () => {
    const network = readGraph(fixture);
    const square = layoutGraph(network, 'force', 1);
    const wide = layoutGraph(network, 'force', 4);

    const ratio = (layout: { extent: { x: number; y: number } }) =>
      layout.extent.x / layout.extent.y;

    expect(ratio(square)).toBeLessThan(1.6);
    expect(ratio(wide)).toBeGreaterThan(2.4);
  });

  it('proporção absurda não vira uma tira: o valor é grampeado', () => {
    const network = readGraph(fixture);
    const extreme = layoutGraph(network, 'force', 40);
    const capped = layoutGraph(network, 'force', 5);
    expect(extreme.extent).toEqual(capped.extent);
  });

  it('grafo vazio não produz NaN nem posição órfã', () => {
    const empty = layoutGraph({ nodes: [], edges: [] }, 'force');
    expect(empty.points.size).toBe(0);
    expect(empty.layerCount).toBe(0);
  });

  it('nó único fica no centro, sem divisão por zero', () => {
    const single = layoutGraph({ nodes: [{ id: 'a', label: 'A' }], edges: [] }, 'force');
    expect(single.points.get('a')).toMatchObject({ x: 0.5, y: 0.5 });
    expect(single.extent).toEqual({ x: 1, y: 1 });
  });

  it('todo layout PLANO devolve z = 0 — a profundidade é exclusiva do volume', () => {
    for (const kind of ['force', 'layered', 'radial'] as const) {
      const { points, space } = layoutGraph(model, kind);
      expect(space).toBe('plane');
      for (const point of points.values()) expect(point.z).toBe(0);
    }
  });
});

/**
 * O VOLUME (`dimension: "3d"`) — a nuvem que o canvas gira. As afirmações são
 * geométricas: centrada na origem, raio 1, profundidade usada de verdade, e as
 * cascas de satélites são ESFERAS (não discos vistos de lado).
 */
describe('layoutGraph — volume (3D)', () => {
  const model = readGraph(fixture);
  const layout = layoutGraph(model, 'force', 1, true);

  it('anuncia o espaço como volume, com raio 1', () => {
    expect(layout.space).toBe('volume');
    expect(layout.radius).toBe(1);
  });

  it('a nuvem é centrada na origem e cabe no raio', () => {
    let far = 0;
    for (const point of layout.points.values()) {
      far = Math.max(far, Math.hypot(point.x, point.y, point.z));
    }
    expect(far).toBeGreaterThan(0.9);
    expect(far).toBeLessThanOrEqual(1.000001);
  });

  it('usa a profundidade de verdade (z não é decorativo)', () => {
    const zs = [...layout.points.values()].map((point) => point.z);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(0.5);
  });

  it('os satélites de um hub formam uma CASCA esférica em volta dele', () => {
    const degrees = degreesOf(model);
    const hub = layout.points.get('VAR-hub');
    const leaves = model.edges
      .filter((edge) => edge.source === 'VAR-hub' && degrees.get(edge.target) === 1)
      .map((edge) => layout.points.get(edge.target));

    expect(leaves.length).toBeGreaterThan(10);
    const radii = leaves.map((leaf) =>
      Math.hypot(leaf!.x - hub!.x, leaf!.y - hub!.y, leaf!.z - hub!.z),
    );
    const mean = radii.reduce((sum, r) => sum + r, 0) / radii.length;
    for (const radius of radii) {
      expect(radius).toBeGreaterThan(mean * 0.7);
      expect(radius).toBeLessThan(mean * 1.3);
    }
    // Esfera, não disco: os satélites variam nos TRÊS eixos.
    const zSpread =
      Math.max(...leaves.map((l) => l!.z)) - Math.min(...leaves.map((l) => l!.z));
    expect(zSpread).toBeGreaterThan(mean);
  });

  it('é determinístico como tudo aqui', () => {
    const again = layoutGraph(readGraph(fixture), 'force', 1, true);
    for (const [id, point] of layout.points) {
      expect(again.points.get(id)).toEqual(point);
    }
  });
});

/**
 * O AGLOMERADO — o que o usuário chamou de "tipo Obsidian". Aqui a afirmação é
 * geométrica: satélite perto do seu hub, aglomerado longe do outro aglomerado.
 * Sem isto o layout continuaria "funcionando" e desenhando um novelo.
 */
describe('layoutGraph — aglomerados (força)', () => {
  const model = readGraph(fixture);
  const { points } = layoutGraph(model, 'force');

  it('a vitrine tem volume de verdade (não é um exemplo de cinco bolinhas)', () => {
    expect(model.nodes.length).toBeGreaterThan(150);
    expect(model.edges.length).toBeGreaterThan(150);
    expect(groupsOf(model).length).toBeGreaterThanOrEqual(8);
  });

  /**
   * A coroa varia DE PROPÓSITO: com todas as folhas no mesmo raio exato, cada
   * aglomerado sai como uma engrenagem, e dezessete engrenagens iguais leem
   * como clip-art. O que o teste trava é a FAIXA — varia o bastante para
   * parecer orgânico, pouco o bastante para continuar sendo uma coroa.
   */
  it('as folhas de um hub ficam numa coroa, com variação contida', () => {
    const degrees = degreesOf(model);
    const hub = points.get('CIV-hub');
    const leaves = model.edges
      .filter((edge) => edge.source === 'CIV-hub' && degrees.get(edge.target) === 1)
      .map((edge) => points.get(edge.target));

    expect(leaves.length).toBeGreaterThan(10);
    const radii = leaves.map((leaf) => distance(hub!, leaf!));
    const mean = radii.reduce((sum, r) => sum + r, 0) / radii.length;
    for (const radius of radii) {
      expect(radius).toBeGreaterThan(mean * 0.7);
      expect(radius).toBeLessThan(mean * 1.3);
    }
    // E não é um círculo perfeito: há variação de verdade.
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(mean * 0.1);
  });

  it('cada satélite fica MUITO mais perto do seu hub do que de outro hub', () => {
    const own = distance(points.get('CIV-hub')!, points.get('CIV-n1')!);
    const other = distance(points.get('VAR-hub')!, points.get('CIV-n1')!);
    expect(other).toBeGreaterThan(own * 3);
  });

  it('nós do mesmo grupo ficam mais juntos do que nós de grupos diferentes', () => {
    const centroids = new Map<string, { x: number; y: number; n: number }>();
    for (const node of model.nodes) {
      const point = points.get(node.id);
      if (!point || !node.group) continue;
      const acc = centroids.get(node.group) ?? { x: 0, y: 0, n: 0 };
      centroids.set(node.group, { x: acc.x + point.x, y: acc.y + point.y, n: acc.n + 1 });
    }
    const centers = [...centroids.entries()].map(([group, acc]) => ({
      group,
      x: acc.x / acc.n,
      y: acc.y / acc.n,
    }));

    // Dispersão média DENTRO do grupo, contra a distância média ENTRE grupos.
    let inside = 0;
    let insideCount = 0;
    for (const node of model.nodes) {
      const point = points.get(node.id);
      const center = centers.find((c) => c.group === node.group);
      if (!point || !center) continue;
      inside += distance(point, center);
      insideCount += 1;
    }

    let between = 0;
    let betweenCount = 0;
    for (let i = 0; i < centers.length; i += 1) {
      for (let j = i + 1; j < centers.length; j += 1) {
        between += distance(centers[i], centers[j]);
        betweenCount += 1;
      }
    }

    expect(between / betweenCount).toBeGreaterThan((inside / insideCount) * 2);
  });
});

describe('edgeShape — traçado da aresta', () => {
  const from = { x: 0, y: 0, r: 10 };
  const to = { x: 100, y: 0, r: 10 };

  it('nasce e morre na BORDA dos nós, nunca no centro', () => {
    const { path } = edgeShape(from, to, { curved: false, arrow: false });
    expect(path).toBe('M13,0 L87,0');
  });

  it('com seta, o traço para antes da ponta e o triângulo aponta para o nó', () => {
    const { path, arrow } = edgeShape(from, to, { curved: false, arrow: true });
    // 87 (borda) − 7 (comprimento da seta) = 80.
    expect(path).toBe('M13,0 L80,0');
    expect(arrow?.split(' ')[0]).toBe('87,0');
  });

  it('curvo desenha uma quadrática (e some quando o traço é reto)', () => {
    expect(edgeShape(from, to, { curved: true, arrow: false }).path).toContain('Q');
    expect(edgeShape(from, to, { curved: false, arrow: false }).path).not.toContain('Q');
  });

  it('nós sobrepostos não geram NaN', () => {
    const { path } = edgeShape(
      from,
      { x: 0, y: 0, r: 10 },
      { curved: false, arrow: true },
    );
    expect(path).not.toContain('NaN');
  });
});
