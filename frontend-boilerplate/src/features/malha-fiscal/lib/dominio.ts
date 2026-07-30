/**
 * As constantes do domínio fiscal: critérios, faixas, equipes, rótulos e as
 * etapas do processamento do lote.
 *
 * Tudo que é NOME DE NEGÓCIO mora aqui — a UI não escreve string de domínio
 * solta, e trocar "Segregação indevida de receita" por outro rótulo é uma
 * edição em um lugar só.
 */
import type {
  Criterio,
  CriterioId,
  Desfecho,
  EquipeFiscal,
  EtapaGeracao,
  Faixa,
  Risco,
  StatusMalha,
} from '../types';

/* -------------------------------------------------------------------------- *
 * Critérios — a regra de irregularidade (cada um aponta para uma view SQL)
 * -------------------------------------------------------------------------- */

export const CRITERIOS: Criterio[] = [
  {
    id: 'diferenca-base-calculo',
    nome: 'Diferença de base de cálculo',
    descricao: 'Receita declarada no PGDAS menor que a apurada em NFS-e.',
    view: 'vw_optantes_diferenca_base_calculo',
  },
  {
    id: 'omissao-pagamento',
    nome: 'Omissão de pagamento',
    descricao: 'Declarou a receita, mas não recolheu a guia do período.',
    view: 'vw_optantes_omissao_recolhimento',
  },
  {
    id: 'declaracao-zerada',
    nome: 'Declaração zerada',
    descricao: 'Declarou receita zero no período com NFS-e emitida.',
    view: 'vw_optantes_declaracao_zerada',
  },
  {
    id: 'diferenca-anexo',
    nome: 'Divergência de anexo',
    descricao: 'Tributa por anexo de alíquota menor que a devida.',
    view: 'vw_optantes_diferenca_anexo',
  },
  {
    id: 'deducao',
    nome: 'Deduções inconsistentes',
    descricao: 'Deduções da base acima do permitido para a atividade.',
    view: 'vw_optantes_deducao_indevida',
  },
  {
    id: 'diferenca-fator-r',
    nome: 'Divergência de fator R',
    descricao: 'Folha declarada incompatível, puxando para o Anexo III.',
    view: 'vw_optantes_diferenca_fator_r',
  },
  {
    id: 'nao-incidente',
    nome: 'Segregação indevida de receita',
    descricao: 'Receita tributável classificada como não incidente no município.',
    view: 'vw_optantes_receita_nao_incidente',
  },
  {
    id: 'sublimite',
    nome: 'Sublimite ultrapassado',
    descricao: 'Excedeu o sublimite estadual e deveria recolher ISS fora do Simples.',
    view: 'vw_optantes_sublimite',
  },
];

const CRITERIO_POR_ID = new Map(CRITERIOS.map((c) => [c.id, c]));

export function criterioPorId(id: CriterioId): Criterio {
  // A lista acima cobre a união inteira de `CriterioId`; o fallback existe só
  // para não estourar caso um id venha de fora (payload legado, por exemplo).
  return CRITERIO_POR_ID.get(id) ?? CRITERIOS[0];
}

export function nomeCriterio(id: CriterioId): string {
  return criterioPorId(id).nome;
}

/* -------------------------------------------------------------------------- *
 * Faixas de materialidade
 * -------------------------------------------------------------------------- */

export const FAIXAS: Faixa[] = [
  { id: 'ate-5k', rotulo: 'Até R$ 5 mil', min: 0, max: 5_000 },
  { id: '5k-20k', rotulo: 'R$ 5 mil a R$ 20 mil', min: 5_000, max: 20_000 },
  { id: '20k-50k', rotulo: 'R$ 20 mil a R$ 50 mil', min: 20_000, max: 50_000 },
  { id: 'acima-50k', rotulo: 'Acima de R$ 50 mil', min: 50_000, max: Number.POSITIVE_INFINITY },
];

export function faixaDoValor(valor: number): Faixa {
  return FAIXAS.find((f) => valor >= f.min && valor < f.max) ?? FAIXAS[FAIXAS.length - 1];
}

export function rotuloFaixa(id: string): string {
  return FAIXAS.find((f) => f.id === id)?.rotulo ?? id;
}

/* -------------------------------------------------------------------------- *
 * Equipes fiscais
 * -------------------------------------------------------------------------- */

export const EQUIPES: EquipeFiscal[] = [
  { id: 'ef-1', nome: 'EF-1 · Simples Nacional', auditores: 6 },
  { id: 'ef-2', nome: 'EF-2 · Serviços e Tecnologia', auditores: 5 },
  { id: 'ef-3', nome: 'EF-3 · Construção Civil', auditores: 4 },
  { id: 'ef-4', nome: 'EF-4 · Grandes Contribuintes', auditores: 7 },
  { id: 'ef-5', nome: 'EF-5 · Autorregularização', auditores: 5 },
];

export function nomeEquipe(id: string): string {
  return EQUIPES.find((e) => e.id === id)?.nome ?? id;
}

/* -------------------------------------------------------------------------- *
 * Rótulos de estado — risco, desfecho e situação da campanha
 * -------------------------------------------------------------------------- */

export const RISCOS: Risco[] = ['critico', 'alto', 'medio', 'baixo'];

export const ROTULO_RISCO: Record<Risco, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
};

export const ROTULO_DESFECHO: Record<Desfecho, string> = {
  aguardando: 'Aguardando notificação',
  notificado: 'Notificado',
  retificou: 'Retificou sem pagar',
  regularizado: 'Autorregularizado',
  sem_resposta: 'Sem resposta',
};

export const ROTULO_STATUS_MALHA: Record<StatusMalha, string> = {
  gerando: 'Gerando',
  em_dia: 'Em dia',
  notificada: 'Notificada',
  atrasada: 'Atrasada',
  finalizada: 'Finalizada',
};

/** Ordem do funil de autorregularização (da entrada para o desfecho). */
export const ORDEM_FUNIL: Desfecho[] = [
  'aguardando',
  'notificado',
  'retificou',
  'regularizado',
  'sem_resposta',
];

/* -------------------------------------------------------------------------- *
 * Etapas do processamento do lote
 * -------------------------------------------------------------------------- */

/**
 * O que acontece quando o lote é gerado. As durações somam ~7,5s de propósito:
 * é o tempo que a operação leva de verdade (a view roda sobre a base inteira de
 * optantes) e é o intervalo em que a pessoa precisa VER o que está sendo feito
 * — daí cada etapa carregar seu detalhe técnico.
 */
export const ETAPAS_GERACAO: EtapaGeracao[] = [
  {
    id: 'validar',
    titulo: 'Validando parâmetros do lote',
    detalhe: 'Critério, período de apuração, equipe e prazos',
    duracaoMs: 700,
  },
  {
    id: 'criterio',
    titulo: 'Aplicando critério sobre a base de optantes',
    detalhe: 'Executando a view do critério com o sub-filtro do tipo',
    duracaoMs: 1_900,
  },
  {
    id: 'cruzamento',
    titulo: 'Cruzando NFS-e × PGDAS',
    detalhe: 'Confrontando o declarado com o movimentado por competência',
    duracaoMs: 2_100,
  },
  {
    id: 'apuracao',
    titulo: 'Apurando diferença e ISS devido',
    detalhe: 'Somando períodos confirmados e aplicando a alíquota efetiva',
    duracaoMs: 1_300,
  },
  {
    id: 'priorizacao',
    titulo: 'Priorizando por materialidade e risco',
    detalhe: 'Ordenando o lote e aplicando o teto de contribuintes',
    duracaoMs: 900,
  },
  {
    id: 'lote',
    titulo: 'Reservando lote e vinculando equipe',
    detalhe: 'Gravando os retidos e abrindo o fluxo de atividades',
    duracaoMs: 800,
  },
];

/* -------------------------------------------------------------------------- *
 * Competências (períodos de apuração)
 * -------------------------------------------------------------------------- */

/** `2026-03` → `03/2026`. */
export function formatPA(pa: string): string {
  const [ano, mes] = pa.split('-');
  return `${mes}/${ano}`;
}

/**
 * As `quantidade` últimas competências FECHADAS, da mais antiga para a mais
 * recente. Deriva da data corrente para a tela nunca parecer congelada num ano
 * que já passou.
 */
export function competenciasRecentes(quantidade: number, referencia = new Date()): string[] {
  const paos: string[] = [];
  const base = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  for (let i = quantidade; i >= 1; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    paos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return paos;
}

/** A janela padrão analisada pela tela: os 12 últimos períodos fechados. */
export const JANELA_PA = competenciasRecentes(12);
