/**
 * Fixture do bloco `graph_chart` — casa com o dataContract (shape 'table').
 *
 * É a VITRINE do bloco: a rede que a galeria do catálogo mostra. Por isso ela é
 * GRANDE (≈180 nós em 8 aglomerados) e não um exemplo mínimo — um grafo com
 * cinco bolinhas não deixa ninguém julgar se o componente serve, que é a única
 * pergunta que a galeria existe para responder. O exemplo mínimo continua no
 * `manifest.dataContract.example`, que é contrato e vai inteiro para o agente
 * de IA (uma rede de 180 nós ali inflaria o payload do MCP sem ensinar nada).
 *
 * O CASO: vínculos entre contribuintes — o grupo econômico que a auditoria
 * procura. Cada aglomerado é um setor, o hub é a empresa central, os satélites
 * são as coligadas, e as poucas arestas entre aglomerados são os vínculos
 * cruzados (o que costuma ser o achado). Fecham a cena seis contribuintes sem
 * vínculo nenhum, que existem em qualquer base real.
 *
 * POR QUE GERADA, e não 360 linhas literais: o dado é repetitivo por natureza
 * (satélite 1..N de cada hub), e escrito à mão viraria um arquivo de 40 KB que
 * ninguém revisa. A geração é DETERMINÍSTICA — nenhuma chamada a `Math.random`,
 * todos os valores saem de aritmética sobre o índice —, então a vitrine desenha
 * exatamente igual em toda visita, no PDF e no teste.
 */
import type { TableData } from '@dashboards/contracts';

interface ClusterSpec {
  /** Grupo do nó → é ele que recebe a cor da paleta. */
  grupo: string;
  /** Prefixo dos ids do aglomerado. */
  code: string;
  /** Empresa central. */
  hub: string;
  /** Débito do hub, em reais. */
  hubValue: number;
  /** Satélites pendurados direto no hub. */
  leaves: number;
  /** Empresas intermediárias, cada uma com os seus satélites. */
  subs: { label: string; leaves: number }[];
}

/**
 * Oito setores — o teto da paleta categórica do design system (9 cores) menos
 * uma, para que nenhum aglomerado repita a cor do vizinho.
 */
const CLUSTERS: ClusterSpec[] = [
  {
    grupo: 'Construção civil',
    code: 'CIV',
    hub: 'Construtora Vale',
    hubValue: 8_420_000,
    leaves: 21,
    subs: [
      { label: 'Vale Engenharia', leaves: 11 },
      { label: 'Vale Incorporações', leaves: 6 },
    ],
  },
  {
    grupo: 'Comércio varejista',
    code: 'VAR',
    hub: 'Rede Bom Preço',
    hubValue: 6_180_000,
    leaves: 26,
    subs: [{ label: 'Bom Preço Atacado', leaves: 9 }],
  },
  {
    grupo: 'Serviços',
    code: 'SER',
    hub: 'Ápice Serviços',
    hubValue: 4_760_000,
    leaves: 14,
    subs: [{ label: 'Ápice Facilities', leaves: 8 }],
  },
  {
    grupo: 'Indústria',
    code: 'IND',
    hub: 'Metalúrgica Norte',
    hubValue: 7_310_000,
    leaves: 18,
    subs: [
      { label: 'Norte Fundição', leaves: 7 },
      { label: 'Norte Logística', leaves: 5 },
    ],
  },
  {
    grupo: 'Transporte',
    code: 'TRA',
    hub: 'Transportes Litoral',
    hubValue: 3_950_000,
    leaves: 16,
    subs: [{ label: 'Litoral Frotas', leaves: 6 }],
  },
  {
    grupo: 'Saúde',
    code: 'SAU',
    hub: 'Clínica Central',
    hubValue: 2_840_000,
    leaves: 12,
    subs: [{ label: 'Central Diagnósticos', leaves: 5 }],
  },
  {
    grupo: 'Agronegócio',
    code: 'AGR',
    hub: 'Agro Serra',
    hubValue: 5_270_000,
    leaves: 19,
    subs: [{ label: 'Serra Insumos', leaves: 7 }],
  },
  {
    grupo: 'Tecnologia',
    code: 'TEC',
    hub: 'Dados & Sistemas',
    hubValue: 1_930_000,
    leaves: 10,
    subs: [],
  },
];

/** Vínculos cruzados entre aglomerados — o achado que a auditoria persegue. */
const BRIDGES: [string, string, number][] = [
  ['CIV-hub', 'IND-sub0', 1_240_000],
  ['VAR-hub', 'TRA-hub', 880_000],
  ['IND-hub', 'AGR-sub0', 640_000],
  ['SER-hub', 'TEC-hub', 410_000],
  ['AGR-hub', 'VAR-sub0', 520_000],
  ['SAU-hub', 'SER-sub0', 305_000],
];

/** Contribuintes sem vínculo — existem em qualquer base real. */
const ISOLATED = 6;

/**
 * Débito de um satélite: varia com o índice, sem sorteio. O resto de 7 e o de
 * 11 dão uma dispersão que não repete padrão visível a cada linha.
 */
function satelliteValue(index: number): number {
  return 40_000 + ((index * 37) % 7) * 26_000 + ((index * 13) % 11) * 9_000;
}

type Row = Record<string, unknown>;

function buildRows(): Row[] {
  const nodes: Row[] = [];
  const edges: Row[] = [];
  let satellite = 0;

  const leaf = (code: string, grupo: string, parent: string, count: number) => {
    for (let i = 0; i < count; i += 1) {
      satellite += 1;
      const id = `${code}-n${satellite}`;
      const valor = satelliteValue(satellite);
      nodes.push({
        tipo: 'no',
        id,
        rotulo: `${code} ${String(1000 + satellite)}`,
        grupo,
        valor,
      });
      edges.push({ tipo: 'aresta', origem: parent, destino: id, valor });
    }
  };

  for (const cluster of CLUSTERS) {
    const hubId = `${cluster.code}-hub`;
    nodes.push({
      tipo: 'no',
      id: hubId,
      rotulo: cluster.hub,
      grupo: cluster.grupo,
      valor: cluster.hubValue,
    });
    leaf(cluster.code, cluster.grupo, hubId, cluster.leaves);

    cluster.subs.forEach((sub, i) => {
      const subId = `${cluster.code}-sub${i}`;
      const valor = Math.round(cluster.hubValue * (0.28 + i * 0.11));
      nodes.push({
        tipo: 'no',
        id: subId,
        rotulo: sub.label,
        grupo: cluster.grupo,
        valor,
      });
      edges.push({ tipo: 'aresta', origem: hubId, destino: subId, valor });
      leaf(cluster.code, cluster.grupo, subId, sub.leaves);
    });
  }

  for (let i = 0; i < ISOLATED; i += 1) {
    nodes.push({
      tipo: 'no',
      id: `AVU-${i + 1}`,
      rotulo: `Avulso ${1000 + i}`,
      grupo: 'Sem vínculo',
      valor: 60_000 + i * 18_000,
    });
  }

  for (const [origem, destino, valor] of BRIDGES) {
    edges.push({ tipo: 'aresta', origem, destino, valor });
  }

  return [...nodes, ...edges];
}

export const fixture: TableData = {
  columns: [
    { key: 'tipo', label: 'tipo', type: 'string' },
    { key: 'id', label: 'id', type: 'string' },
    { key: 'rotulo', label: 'rotulo', type: 'string' },
    { key: 'grupo', label: 'grupo', type: 'string' },
    { key: 'origem', label: 'origem', type: 'string' },
    { key: 'destino', label: 'destino', type: 'string' },
    { key: 'valor', label: 'valor', type: 'number' },
  ],
  rows: buildRows(),
};

/**
 * FUNIL DE CAMADAS — o outro cenário do bloco, com `camada` declarada: é o dado
 * de `layout: "layered"`, em que cada camada vira uma coluna.
 *
 * Mora aqui (e não só no catálogo de variações do playground) porque é o
 * segundo exemplo canônico do bloco: o playground e os testes leem esta mesma
 * constante, em vez de manterem três cópias que divergem na primeira correção.
 */
export const funnelFixture: TableData = {
  columns: [
    { key: 'tipo', label: 'tipo', type: 'string' },
    { key: 'id', label: 'id', type: 'string' },
    { key: 'rotulo', label: 'rotulo', type: 'string' },
    { key: 'grupo', label: 'grupo', type: 'string' },
    { key: 'camada', label: 'camada', type: 'number' },
    { key: 'origem', label: 'origem', type: 'string' },
    { key: 'destino', label: 'destino', type: 'string' },
    { key: 'valor', label: 'valor', type: 'number' },
  ],
  rows: [
    {
      tipo: 'no',
      id: 'lancado',
      rotulo: 'Lançado',
      grupo: 'N1 · Lançamento',
      camada: 0,
      valor: 10835362,
    },
    {
      tipo: 'no',
      id: 'pago',
      rotulo: 'Pago',
      grupo: 'N2 · Cobrança',
      camada: 1,
      valor: 8060686,
    },
    {
      tipo: 'no',
      id: 'inscrito',
      rotulo: 'Inscrito em DA',
      grupo: 'N2 · Cobrança',
      camada: 1,
      valor: 2774676,
    },
    {
      tipo: 'no',
      id: 'parcelado',
      rotulo: 'Parcelado',
      grupo: 'N3 · Desfecho',
      camada: 2,
      valor: 900000,
    },
    {
      tipo: 'no',
      id: 'ajuizado',
      rotulo: 'Ajuizado',
      grupo: 'N3 · Desfecho',
      camada: 2,
      valor: 1200000,
    },
    {
      tipo: 'no',
      id: 'prescrito',
      rotulo: 'Prescrito',
      grupo: 'N3 · Desfecho',
      camada: 2,
      valor: 674676,
    },
    {
      tipo: 'no',
      id: 'quitado',
      rotulo: 'Quitado',
      grupo: 'N4 · Situação',
      camada: 3,
      valor: 600000,
    },
    {
      tipo: 'no',
      id: 'estoque',
      rotulo: 'Em estoque',
      grupo: 'N4 · Situação',
      camada: 3,
      valor: 1500000,
    },
    { tipo: 'aresta', origem: 'lancado', destino: 'pago', valor: 8060686 },
    { tipo: 'aresta', origem: 'lancado', destino: 'inscrito', valor: 2774676 },
    { tipo: 'aresta', origem: 'inscrito', destino: 'parcelado', valor: 900000 },
    { tipo: 'aresta', origem: 'inscrito', destino: 'ajuizado', valor: 1200000 },
    { tipo: 'aresta', origem: 'inscrito', destino: 'prescrito', valor: 674676 },
    { tipo: 'aresta', origem: 'parcelado', destino: 'quitado', valor: 600000 },
    { tipo: 'aresta', origem: 'parcelado', destino: 'estoque', valor: 300000 },
    { tipo: 'aresta', origem: 'ajuizado', destino: 'estoque', valor: 1200000 },
  ],
};
