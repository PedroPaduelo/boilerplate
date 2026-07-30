/**
 * A BASE de contribuintes retidos — gerada uma única vez, de forma
 * DETERMINÍSTICA (PRNG com semente fixa).
 *
 * Por que determinística: os números da tela precisam FECHAR entre si. O total
 * do card, a soma das fatias da rosca, a coluna da competência e a lista de
 * CNPJs saem todos daqui — se a base sorteasse a cada render, o valor do card
 * mudaria ao trocar de aba e a tela desmontaria a própria credibilidade.
 *
 * As correlações são as do mundo real: diferença com cauda longa (poucos casos
 * concentram a maior parte do valor), risco derivado de materialidade +
 * reincidência + número de competências, e desfecho compatível com o estágio da
 * cobrança.
 */
import type { ContribuinteRetido, CriterioId, Desfecho, Risco } from '../types';
import { cnpjDaRaiz } from './cnpj';
import { CRITERIOS, JANELA_PA } from './dominio';

/** Gerador pseudoaleatório pequeno e estável (mulberry32). */
function criarRandom(semente: number): () => number {
  let estado = semente;
  return () => {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quantos CNPJs a base inteira contém. */
const TOTAL_CONTRIBUINTES = 540;

/** Semente fixa: muda-se aqui para gerar outro "município". */
const SEMENTE = 20260731;

/* -------------------------------------------------------------------------- *
 * Vocabulário de nomes — razões sociais plausíveis
 * -------------------------------------------------------------------------- */

const PREFIXOS = [
  'COMERCIAL',
  'CONSTRUTORA',
  'CLÍNICA',
  'TRANSPORTES',
  'ENGENHARIA',
  'SERVIÇOS',
  'TECNOLOGIA',
  'CONSULTORIA',
  'INSTITUTO',
  'LOGÍSTICA',
  'ASSESSORIA',
  'LABORATÓRIO',
  'AGROPECUÁRIA',
  'MANUTENÇÃO',
  'INCORPORADORA',
];

const NUCLEOS = [
  'SANTA RITA',
  'ATLÂNTICO',
  'MONTE VERDE',
  'PRIMAVERA',
  'HORIZONTE',
  'SÃO JUDAS',
  'BOA VISTA',
  'PLANALTO',
  'CRISTAL',
  'NOVA ERA',
  'DOM PEDRO',
  'ARAÇÁ',
  'SERRA AZUL',
  'PORTO SEGURO',
  'IPIRANGA',
  'VALE DO SOL',
  'CAMPO BELO',
  'SÃO MATEUS',
  'ITAPUÃ',
  'GUARARAPES',
];

const SUFIXOS = ['LTDA', 'LTDA ME', 'LTDA EPP', 'EIRELI', 'S/A'];

const SETORES = [
  'Desenvolvimento de software',
  'Construção civil',
  'Serviços médicos e odontológicos',
  'Educação e treinamento',
  'Transporte e armazenagem',
  'Publicidade e marketing',
  'Contabilidade e auditoria',
  'Engenharia e arquitetura',
  'Limpeza e conservação',
  'Locação de mão de obra',
  'Manutenção de equipamentos',
  'Serviços jurídicos',
];

const BAIRROS = [
  'Centro',
  'Jardim América',
  'Distrito Industrial',
  'Boa Vista',
  'Santa Mônica',
  'Alvorada',
  'Vila Nova',
  'Parque das Águas',
  'São Bento',
  'Cidade Alta',
  'Morada do Sol',
  'Ribeirania',
];

/* -------------------------------------------------------------------------- *
 * Perfil de cada critério
 * -------------------------------------------------------------------------- */

interface PerfilCriterio {
  /** Participação do critério na base (peso relativo). */
  peso: number;
  /** Diferença apurada típica, em reais. */
  diferencaBase: number;
  /** Alíquota efetiva de ISS aplicada sobre a diferença. */
  aliquota: number;
}

const PERFIL: Record<CriterioId, PerfilCriterio> = {
  'diferenca-base-calculo': { peso: 22, diferencaBase: 28_000, aliquota: 0.04 },
  'omissao-pagamento': { peso: 18, diferencaBase: 16_000, aliquota: 0.05 },
  'declaracao-zerada': { peso: 14, diferencaBase: 21_000, aliquota: 0.045 },
  'diferenca-anexo': { peso: 12, diferencaBase: 12_000, aliquota: 0.03 },
  deducao: { peso: 11, diferencaBase: 14_500, aliquota: 0.035 },
  'diferenca-fator-r': { peso: 9, diferencaBase: 19_000, aliquota: 0.03 },
  'nao-incidente': { peso: 8, diferencaBase: 24_000, aliquota: 0.04 },
  sublimite: { peso: 6, diferencaBase: 62_000, aliquota: 0.05 },
};

/** Roleta de critérios ponderada pelos pesos acima. */
const ROLETA_CRITERIOS: CriterioId[] = CRITERIOS.flatMap((criterio) =>
  Array.from({ length: PERFIL[criterio.id].peso }, () => criterio.id),
);

/** Distribuição dos desfechos — o retrato do funil num dia qualquer. */
const ROLETA_DESFECHOS: Desfecho[] = [
  ...Array.from({ length: 30 }, (): Desfecho => 'aguardando'),
  ...Array.from({ length: 26 }, (): Desfecho => 'notificado'),
  ...Array.from({ length: 13 }, (): Desfecho => 'retificou'),
  ...Array.from({ length: 19 }, (): Desfecho => 'regularizado'),
  ...Array.from({ length: 12 }, (): Desfecho => 'sem_resposta'),
];

/* -------------------------------------------------------------------------- *
 * Geração
 * -------------------------------------------------------------------------- */

function escolher<T>(lista: readonly T[], rand: () => number): T {
  return lista[Math.floor(rand() * lista.length)];
}

/** Risco a partir do conjunto de sinais — não só do valor. */
function calcularRisco(
  diferenca: number,
  competencias: number,
  reincidente: boolean,
  percentualDivergencia: number,
): Risco {
  const materialidade = Math.min(diferenca / 80_000, 1);
  const recorrencia = Math.min(competencias / 6, 1);
  const score =
    materialidade * 0.45 +
    recorrencia * 0.2 +
    (reincidente ? 0.2 : 0) +
    Math.min(percentualDivergencia, 1) * 0.15;
  if (score >= 0.62) return 'critico';
  if (score >= 0.44) return 'alto';
  if (score >= 0.26) return 'medio';
  return 'baixo';
}

function gerarBase(): ContribuinteRetido[] {
  const rand = criarRandom(SEMENTE);
  const agora = Date.now();
  const contribuintes: ContribuinteRetido[] = [];

  for (let i = 0; i < TOTAL_CONTRIBUINTES; i += 1) {
    const criterio = escolher(ROLETA_CRITERIOS, rand);
    const perfil = PERFIL[criterio];

    // Cauda longa: o quadrado do sorteio concentra a massa em valores baixos e
    // deixa poucos casos muito altos — a curva real de uma malha.
    const fator = 0.18 + Math.pow(rand(), 2) * 3.4;
    const diferenca = Math.round((perfil.diferencaBase * fator) / 10) * 10;

    // Competências contíguas dentro da janela analisada.
    const quantidadePA = 1 + Math.floor(rand() * 6);
    const inicio = Math.floor(rand() * Math.max(JANELA_PA.length - quantidadePA, 1));
    const competencias = JANELA_PA.slice(inicio, inicio + quantidadePA);

    const percentualDivergencia = 0.08 + rand() * 0.85;
    const valorDeclarado = Math.round(diferenca / percentualDivergencia / 10) * 10;
    const reincidente = rand() < 0.24;
    const risco = calcularRisco(
      diferenca,
      competencias.length,
      reincidente,
      percentualDivergencia,
    );

    const desfecho = escolher(ROLETA_DESFECHOS, rand);
    const diasAtras = 5 + Math.floor(rand() * 120);
    const cienciaEm =
      desfecho === 'aguardando'
        ? null
        : new Date(agora - diasAtras * 86_400_000).toISOString();

    contribuintes.push({
      id: `ret-${String(i + 1).padStart(4, '0')}`,
      cnpj: cnpjDaRaiz(10_000_000 + Math.floor(rand() * 79_999_999)),
      razaoSocial: `${escolher(PREFIXOS, rand)} ${escolher(NUCLEOS, rand)} ${escolher(SUFIXOS, rand)}`,
      criterio,
      setor: escolher(SETORES, rand),
      bairro: escolher(BAIRROS, rand),
      competencias,
      valorDeclarado,
      valorApurado: valorDeclarado + diferenca,
      diferenca,
      issDevido: Math.round(diferenca * perfil.aliquota * 100) / 100,
      risco,
      reincidente,
      desfecho,
      cienciaEm,
    });
  }

  // Maior diferença primeiro: é a ordenação padrão de prioziação do lote.
  return contribuintes.sort((a, b) => b.diferenca - a.diferenca);
}

/** A base inteira — calculada uma vez por sessão. */
export const BASE_CONTRIBUINTES: ContribuinteRetido[] = gerarBase();

/**
 * Quantos registros a última carga varreu: declarações (contribuintes ×
 * competências) mais as notas confrontadas. É o número que aparece no rodapé
 * técnico e no contador da execução.
 */
export const REGISTROS_ANALISADOS = BASE_CONTRIBUINTES.reduce(
  (total, c) => total + c.competencias.length * 47,
  0,
);
