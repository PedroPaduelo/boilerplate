/**
 * As campanhas JÁ EXISTENTES — o histórico que a tela mostra abaixo do painel.
 *
 * Cada uma é derivada da mesma base de contribuintes: o total do lote e o valor
 * previsto são a contagem e a soma reais do critério, não números escritos à
 * mão. Assim, quando alguém abre a malha e confere a lista, os números batem.
 */
import type { CriterioId, MalhaGerada, StatusMalha } from '../types';
import { BASE_CONTRIBUINTES } from './base-contribuintes';
import { JANELA_PA, nomeCriterio } from './dominio';

/** Quanto do previsto já foi recuperado, por situação da campanha. */
const REALIZACAO: Record<StatusMalha, number> = {
  gerando: 0,
  em_dia: 0.14,
  notificada: 0.38,
  atrasada: 0.19,
  finalizada: 0.83,
};

interface SementeMalha {
  codigo: string;
  criterio: CriterioId;
  equipeId: string;
  status: StatusMalha;
  /** Há quantos dias a campanha começou. */
  iniciadaHa: number;
  /** Duração planejada, em dias. */
  duracao: number;
  /** Teto de contribuintes do lote. */
  limite: number;
}

const SEMENTES: SementeMalha[] = [
  {
    codigo: 'MF-2026-0031',
    criterio: 'diferenca-base-calculo',
    equipeId: 'ef-4',
    status: 'notificada',
    iniciadaHa: 62,
    duracao: 120,
    limite: 90,
  },
  {
    codigo: 'MF-2026-0029',
    criterio: 'omissao-pagamento',
    equipeId: 'ef-1',
    status: 'em_dia',
    iniciadaHa: 34,
    duracao: 90,
    limite: 70,
  },
  {
    codigo: 'MF-2026-0024',
    criterio: 'declaracao-zerada',
    equipeId: 'ef-5',
    status: 'atrasada',
    iniciadaHa: 148,
    duracao: 120,
    limite: 55,
  },
  {
    codigo: 'MF-2026-0018',
    criterio: 'sublimite',
    equipeId: 'ef-4',
    status: 'finalizada',
    iniciadaHa: 236,
    duracao: 150,
    limite: 28,
  },
  {
    codigo: 'MF-2026-0012',
    criterio: 'diferenca-anexo',
    equipeId: 'ef-2',
    status: 'finalizada',
    iniciadaHa: 290,
    duracao: 120,
    limite: 46,
  },
];

const DIA_MS = 86_400_000;

function construir(semente: SementeMalha): MalhaGerada {
  const doCriterio = BASE_CONTRIBUINTES.filter((c) => c.criterio === semente.criterio).slice(
    0,
    semente.limite,
  );
  const valorPrevisto = doCriterio.reduce((total, c) => total + c.issDevido, 0);
  const notificados = doCriterio.filter((c) => c.desfecho !== 'aguardando').length;
  const autorregularizados = doCriterio.filter((c) => c.desfecho === 'regularizado').length;

  const inicio = new Date(Date.now() - semente.iniciadaHa * DIA_MS);
  const termino = new Date(inicio.getTime() + semente.duracao * DIA_MS);

  return {
    id: semente.codigo.toLowerCase(),
    codigo: semente.codigo,
    nome: `${nomeCriterio(semente.criterio)} — ${JANELA_PA[0].slice(0, 4)}`,
    criterio: semente.criterio,
    paInicial: JANELA_PA[0],
    paFinal: JANELA_PA[JANELA_PA.length - 1],
    equipeId: semente.equipeId,
    status: semente.status,
    totalContribuintes: doCriterio.length,
    valorPrevisto,
    valorApurado: Math.round(valorPrevisto * REALIZACAO[semente.status]),
    autorregularizados,
    notificados,
    criadaEm: new Date(inicio.getTime() - 2 * DIA_MS).toISOString(),
    inicio: inicio.toISOString(),
    termino: termino.toISOString(),
  };
}

export const MALHAS_INICIAIS: MalhaGerada[] = SEMENTES.map(construir);
