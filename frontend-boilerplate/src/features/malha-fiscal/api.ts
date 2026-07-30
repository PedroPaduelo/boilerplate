/**
 * Acesso a dados da Malha Fiscal.
 *
 * Esta é a ÚNICA camada que conhece a origem dos dados — as telas e os hooks
 * falam com estas funções, nunca com a base. Trocar por `apiClient.get(...)`
 * quando os endpoints do município estiverem disponíveis é uma edição neste
 * arquivo: as assinaturas já são as do contrato (`/malha-fiscal/painel`,
 * `/malha-fiscal/retidos`, `/malha-fiscal/malhas`).
 *
 * A latência é real — e proposital: a leitura do painel varre a base de
 * optantes e a geração do lote roda a view do critério. O TanStack Query em
 * cima disso entrega esqueleto, revalidação e cache sem gambiarra na tela.
 */
import type {
  ContribuinteRetido,
  EscopoMalha,
  MalhaGerada,
  PainelMalha,
  ParametrosMalha,
  ProgressoGeracao,
} from './types';
import {
  agregarFunil,
  agregarPorCompetencia,
  agregarPorCriterio,
  agregarPorFaixa,
  buscarContribuintes,
  filtrarPorEscopo,
  ordenarLote,
  resumir,
} from './lib/agregacoes';
import { BASE_CONTRIBUINTES, REGISTROS_ANALISADOS } from './lib/base-contribuintes';
import { MALHAS_INICIAIS } from './lib/base-malhas';
import { ETAPAS_GERACAO, JANELA_PA } from './lib/dominio';

/** Espera `ms` — usada para a latência de rede e para o ritmo das etapas. */
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Latência típica de uma consulta agregada sobre a base de optantes. */
function latencia(base: number, variacao: number): Promise<void> {
  return esperar(base + Math.random() * variacao);
}

/**
 * Campanhas da sessão. Um lote gerado agora precisa continuar na lista quando a
 * pessoa fecha o diálogo, troca de aba e volta — por isso o estado vive no
 * módulo, e não dentro de um componente.
 */
let malhas: MalhaGerada[] = [...MALHAS_INICIAIS];

/** Próximo número de lote do ano corrente. */
function proximoCodigo(): string {
  const ano = new Date().getFullYear();
  const doAno = malhas.filter((m) => m.codigo.includes(String(ano))).length;
  return `MF-${ano}-${String(doAno + 32).padStart(4, '0')}`;
}

/* -------------------------------------------------------------------------- *
 * Leitura
 * -------------------------------------------------------------------------- */

/** Painel analítico do recorte selecionado (KPIs + as quatro séries). */
export async function buscarPainel(escopo: EscopoMalha): Promise<PainelMalha> {
  await latencia(420, 320);

  const lista = filtrarPorEscopo(BASE_CONTRIBUINTES, escopo);

  return {
    resumo: resumir(lista),
    // A rosca e as barras de faixa ignoram a própria dimensão do escopo: uma
    // rosca com uma única fatia (a que a pessoa acabou de clicar) some com o
    // contexto e impede o próximo clique.
    porCriterio: agregarPorCriterio(
      filtrarPorEscopo(BASE_CONTRIBUINTES, { ...escopo, criterio: undefined }),
    ),
    porCompetencia: agregarPorCompetencia(
      filtrarPorEscopo(BASE_CONTRIBUINTES, { ...escopo, competencia: undefined }),
      JANELA_PA,
    ),
    porFaixa: agregarPorFaixa(
      filtrarPorEscopo(BASE_CONTRIBUINTES, { ...escopo, faixa: undefined }),
    ),
    funil: agregarFunil(lista),
    atualizadoEm: new Date(Date.now() - 42 * 60_000).toISOString(),
    registrosAnalisados: REGISTROS_ANALISADOS,
  };
}

export interface RetidosResposta {
  itens: ContribuinteRetido[];
  /** Total do recorte ANTES do corte de página. */
  total: number;
  /** Diferença apurada somada do recorte inteiro. */
  diferencaTotal: number;
}

/** Os contribuintes do recorte, já ordenados por materialidade. */
export async function buscarRetidos(
  escopo: EscopoMalha,
  termo = '',
  limite = 60,
): Promise<RetidosResposta> {
  await latencia(360, 280);

  const doEscopo = filtrarPorEscopo(BASE_CONTRIBUINTES, escopo);
  const encontrados = buscarContribuintes(doEscopo, termo);

  return {
    itens: encontrados.slice(0, limite),
    total: encontrados.length,
    diferencaTotal: encontrados.reduce((total, c) => total + c.diferenca, 0),
  };
}

/** As campanhas cadastradas, da mais recente para a mais antiga. */
export async function listarMalhas(): Promise<MalhaGerada[]> {
  await latencia(300, 220);
  return [...malhas].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

/* -------------------------------------------------------------------------- *
 * Escrita
 * -------------------------------------------------------------------------- */

/**
 * Gera o lote: roda as etapas do processamento, reporta o progresso e devolve a
 * campanha criada.
 *
 * O `onProgress` existe porque a operação é longa o bastante para exigir
 * prestação de contas — quem manda fiscalizar 200 CNPJs precisa ver o que está
 * sendo feito, não um giro indefinido.
 */
export async function gerarMalha(
  parametros: ParametrosMalha,
  onProgress?: (progresso: ProgressoGeracao) => void,
): Promise<MalhaGerada> {
  const selecionados = ordenarLote(
    filtrarPorEscopo(BASE_CONTRIBUINTES, parametros.escopo),
    parametros.ordenacao,
  ).slice(0, parametros.quantidadeOptantes);

  const totalDuracao = ETAPAS_GERACAO.reduce((total, etapa) => total + etapa.duracaoMs, 0);
  let decorrido = 0;

  for (let i = 0; i < ETAPAS_GERACAO.length; i += 1) {
    const etapa = ETAPAS_GERACAO[i];
    onProgress?.({
      etapaIndex: i,
      etapa,
      progresso: decorrido / totalDuracao,
      registros: Math.round((decorrido / totalDuracao) * REGISTROS_ANALISADOS),
    });
    await esperar(etapa.duracaoMs);
    decorrido += etapa.duracaoMs;
  }

  onProgress?.({
    etapaIndex: ETAPAS_GERACAO.length,
    etapa: ETAPAS_GERACAO[ETAPAS_GERACAO.length - 1],
    progresso: 1,
    registros: REGISTROS_ANALISADOS,
  });

  const agora = new Date();
  const valorPrevisto = selecionados.reduce((total, c) => total + c.issDevido, 0);

  const nova: MalhaGerada = {
    id: `malha-${agora.getTime()}`,
    codigo: proximoCodigo(),
    nome: parametros.nome,
    criterio: parametros.criterio,
    paInicial: parametros.paInicial,
    paFinal: parametros.paFinal,
    equipeId: parametros.equipeId,
    status: 'em_dia',
    totalContribuintes: selecionados.length,
    valorPrevisto,
    valorApurado: 0,
    autorregularizados: 0,
    notificados: 0,
    criadaEm: agora.toISOString(),
    inicio: agora.toISOString(),
    termino: new Date(agora.getTime() + parametros.prazoCiencia * 86_400_000).toISOString(),
  };

  malhas = [nova, ...malhas];
  return nova;
}
