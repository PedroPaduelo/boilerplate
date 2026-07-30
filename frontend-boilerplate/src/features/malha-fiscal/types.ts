/**
 * Vocabulário da MALHA FISCAL — o lote de fiscalização em massa do ISS.
 *
 * O termo vem da rede de pesca: o fisco lança um CRITÉRIO de irregularidade
 * sobre a base de optantes do Simples Nacional e RETÉM quem se enquadra. Em vez
 * de auditar contribuinte a contribuinte, audita-se um critério e alcança-se
 * centenas de CNPJs de uma vez.
 *
 * Os nomes ficam em português porque o domínio é português e as tabelas de
 * origem também são (`malha_fiscal`, `malha_fiscal_filtros`): quem for ligar
 * esta tela no backend real casa campo a campo sem tradutor no meio.
 */

/** Os oito critérios de irregularidade suportados. */
export type CriterioId =
  | 'declaracao-zerada'
  | 'deducao'
  | 'diferenca-anexo'
  | 'diferenca-base-calculo'
  | 'diferenca-fator-r'
  | 'nao-incidente'
  | 'omissao-pagamento'
  | 'sublimite';

/** A regra de negócio: nome de exibição + a view que a materializa no banco. */
export interface Criterio {
  id: CriterioId;
  nome: string;
  /** O que a regra procura, em uma frase. */
  descricao: string;
  /** View SQL de origem — o critério é DADO, não código. */
  view: string;
}

/** Grau de prioridade do caso (materialidade + reincidência + divergência). */
export type Risco = 'critico' | 'alto' | 'medio' | 'baixo';

/** Faixa de materialidade da diferença apurada. */
export type FaixaId = 'ate-5k' | '5k-20k' | '20k-50k' | 'acima-50k';

export interface Faixa {
  id: FaixaId;
  rotulo: string;
  /** Limite inferior, inclusivo. */
  min: number;
  /** Limite superior, exclusivo. `Infinity` na última faixa. */
  max: number;
}

/**
 * Onde o caso parou no ciclo da cobrança. É a métrica central do negócio:
 * autorregularizar é barato, ação fiscal é cara.
 */
export type Desfecho =
  /** Retido pela malha, ainda sem notificação enviada. */
  | 'aguardando'
  /** Notificado, prazo de ciência em curso. */
  | 'notificado'
  /** Apresentou declaração retificadora, mas não quitou. */
  | 'retificou'
  /** Retificou e pagou — sucesso total. */
  | 'regularizado'
  /** Prazo vencido sem retificadora — candidato a ordem de serviço. */
  | 'sem_resposta';

/** Um CNPJ retido pela malha, com os valores apurados no período. */
export interface ContribuinteRetido {
  id: string;
  /** Só dígitos — a formatação é da camada de apresentação. */
  cnpj: string;
  razaoSocial: string;
  criterio: CriterioId;
  /** Atividade econômica principal. */
  setor: string;
  bairro: string;
  /** Períodos de apuração no formato `AAAA-MM`. */
  competencias: string[];
  /** Receita declarada no PGDAS no período. */
  valorDeclarado: number;
  /** Receita apurada pelo município (NFS-e + cruzamentos). */
  valorApurado: number;
  /** `valorApurado - valorDeclarado` — o indício de irregularidade. */
  diferenca: number;
  /** ISS estimado sobre a diferença. */
  issDevido: number;
  risco: Risco;
  /** Já caiu em malha anterior. */
  reincidente: boolean;
  desfecho: Desfecho;
  /** Data de ciência da notificação (ISO) ou `null` se ainda não notificado. */
  cienciaEm: string | null;
}

/** Equipe fiscal responsável pela execução do lote. */
export interface EquipeFiscal {
  id: string;
  nome: string;
  /** Quantos auditores compõem a equipe. */
  auditores: number;
}

/** Situação da campanha. */
export type StatusMalha = 'gerando' | 'em_dia' | 'notificada' | 'atrasada' | 'finalizada';

/** A campanha em si — critério + período + equipe + prazos + resultado. */
export interface MalhaGerada {
  id: string;
  /** Identificação do lote, ex.: `MF-2026-0042`. */
  codigo: string;
  nome: string;
  criterio: CriterioId;
  /** Período de apuração inicial (`AAAA-MM`). */
  paInicial: string;
  paFinal: string;
  equipeId: string;
  status: StatusMalha;
  totalContribuintes: number;
  /** Quanto se estima recuperar. */
  valorPrevisto: number;
  /** Quanto já foi recuperado de fato. */
  valorApurado: number;
  /** Quantos se autorregularizaram (retificaram e pagaram). */
  autorregularizados: number;
  notificados: number;
  criadaEm: string;
  inicio: string;
  termino: string;
}

/**
 * O recorte selecionado NOS GRÁFICOS. Cada clique numa série acrescenta uma
 * dimensão; o conjunto vira o filtro da lista de retidos e o escopo da malha.
 */
export interface EscopoMalha {
  criterio?: CriterioId;
  /** Competência única (`AAAA-MM`). */
  competencia?: string;
  faixa?: FaixaId;
  risco?: Risco;
}

/** Um item de série agregada (uma fatia da rosca, uma coluna, uma barra). */
export interface ItemSerie {
  /** Chave técnica (id do critério, `AAAA-MM`, id da faixa…). */
  chave: string;
  rotulo: string;
  contribuintes: number;
  /** Diferença apurada somada. */
  valor: number;
}

/** Números do topo da tela. */
export interface ResumoMalha {
  contribuintes: number;
  /** Soma das diferenças apuradas. */
  diferencaTotal: number;
  /** Soma do ISS estimado. */
  issTotal: number;
  /** Diferença média por contribuinte. */
  ticketMedio: number;
  /** Fração (0–1) de quem retificou e pagou entre os notificados. */
  taxaAutorregularizacao: number;
  /** Quantos são reincidentes. */
  reincidentes: number;
}

/** Payload completo do painel analítico. */
export interface PainelMalha {
  resumo: ResumoMalha;
  porCriterio: ItemSerie[];
  porCompetencia: ItemSerie[];
  porFaixa: ItemSerie[];
  funil: ItemSerie[];
  /** Quando a base de cruzamento foi processada pela última vez (ISO). */
  atualizadoEm: string;
  /** Quantos registros a última carga varreu (aparece no rodapé técnico). */
  registrosAnalisados: number;
}

/** Parâmetros do lote a ser gerado. */
export interface ParametrosMalha {
  nome: string;
  criterio: CriterioId;
  paInicial: string;
  paFinal: string;
  /** Teto de contribuintes retidos no lote. */
  quantidadeOptantes: number;
  equipeId: string;
  ordenacao: 'maior-diferenca' | 'maior-risco' | 'mais-competencias' | 'cnpj';
  /** Prazo, em dias, para o contribuinte se autorregularizar. */
  prazoCiencia: number;
  escopo: EscopoMalha;
}

/** Uma etapa do processamento do lote. */
export interface EtapaGeracao {
  id: string;
  titulo: string;
  /** Linha de detalhe técnico exibida sob o título. */
  detalhe: string;
  duracaoMs: number;
}

/** Progresso emitido durante a geração. */
export interface ProgressoGeracao {
  etapaIndex: number;
  etapa: EtapaGeracao;
  /** Fração concluída (0–1). */
  progresso: number;
  /** Registros varridos até aqui — o contador que sobe na tela. */
  registros: number;
}
