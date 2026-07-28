/**
 * A MATEMÁTICA do grafo — leitura dos dados, camadas, posicionamento e
 * traçado das arestas. Tudo função pura, testada sem montar tela.
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
 *  4. A ARESTA NASCE NA BORDA DO NÓ, não no centro — passar por baixo do
 *     círculo é o que faz um grafo parecer uma teia furada.
 */
import { describe, expect, it } from 'vitest';
import type { TableData } from '@dashboards/contracts';
import { degreesOf, groupsOf, readGraph } from './graph-data';
import { computeLayers, layoutGraph } from './graph-layout';
import { edgeShape, toScreen } from './graph-geometry';
import { fixture } from './fixture';

/** Monta um `TableData` só com as linhas — as colunas não são lidas. */
function table(rows: Record<string, unknown>[]): TableData {
  return { columns: [{ key: 'tipo', label: 'tipo' }], rows };
}

describe('readGraph — leitura das linhas', () => {
  it('lê nós e arestas declarados pela coluna `tipo`', () => {
    const model = readGraph(fixture);
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
    const model = readGraph(fixture);
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
    const layers = computeLayers(readGraph(fixture));
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
  const model = readGraph(fixture);

  it('é determinístico: o mesmo dado desenha sempre igual', () => {
    const first = layoutGraph(model, 'force');
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
