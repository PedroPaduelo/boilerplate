/**
 * Contrato dos eventos do TURNO DO AGENTE (server -> client), sala
 * `chat:{conversationId}`.
 *
 * ## Por que este arquivo existe
 *
 * O produto se chama auditorIA e promete "respostas auditáveis". Até aqui o
 * socket carregava apenas o texto (`chat:delta`) e o nome cru da ferramenta
 * (`chat:tool-step`) — ou seja, a tela mostrava a CONCLUSÃO do agente e
 * escondia a EVIDÊNCIA: qual conexão ele abriu, qual SQL executou, quantas
 * linhas voltaram, quanto tempo levou. Uma resposta sem essas quatro coisas
 * não é auditável; é só uma opinião bem formatada.
 *
 * Os eventos abaixo existem para que cada afirmação do agente chegue à tela
 * acompanhada da prova de como foi obtida — durante o streaming e também
 * depois, porque a mesma estrutura é persistida em `ChatMessage.toolData` e
 * relida ao reabrir a conversa.
 *
 * ## Compatibilidade
 *
 * Todo campo novo é OPCIONAL. Um backend antigo continua válido para um
 * frontend novo (a trilha degrada para o que existia: nome + fase) e um
 * frontend antigo ignora o que não conhece. Isso permite subir os dois lados
 * em ordens diferentes sem janela de quebra.
 */

/**
 * Em que ponto do turno o agente está.
 *
 * Existe porque "O agente está trabalhando…" não informa nada: quem espera
 * 40 segundos não sabe se o agente está pensando, se travou numa query pesada
 * ou se já está escrevendo. Cada fase autoriza uma frase honesta na tela.
 */
export type ChatTurnPhase =
  /** Decidindo o próximo passo (entre ferramentas, sem texto saindo). */
  | 'thinking'
  /** Executando uma ferramenta — `label` diz qual, em português. */
  | 'tool'
  /** Redigindo a resposta final (os deltas estão saindo). */
  | 'writing';

export interface ChatPhaseEvent {
  conversationId: string;
  runId: string;
  phase: ChatTurnPhase;
  /**
   * Frase pronta para a tela ("Consultando teste · Postgres").
   * Vem montada do servidor porque só ele conhece o alvo real da chamada.
   */
  label?: string;
}

/**
 * Amostra tabular do resultado de uma ferramenta.
 *
 * O resultado cru de um `run_query` pode ter milhares de linhas; mandá-lo
 * inteiro pelo socket trava a aba e não ajuda ninguém a auditar. A amostra é
 * o suficiente para o usuário CONFERIR o formato do que voltou, e `totalRows`
 * preserva a verdade sobre o tamanho real.
 */
export interface ChatStepPreview {
  columns: string[];
  rows: Array<Array<string | number | boolean | null>>;
  /** Total real de linhas, quando `rows` foi truncado para a amostra. */
  totalRows?: number;
}

/** Resultado de um passo. `running` = a chamada saiu e ainda não voltou. */
export type ChatStepStatus = 'running' | 'ok' | 'error';

/**
 * Um passo da trilha de auditoria.
 *
 * É emitido duas vezes por ferramenta: em `call` (o agente pediu) e em
 * `result` (voltou). A tela casa os dois pelo `toolCallId` — por isso ele é o
 * único campo que jamais pode faltar.
 */
export interface ChatToolStepEvent {
  conversationId: string;
  runId: string;
  toolCallId: string;
  toolName: string;
  phase: 'call' | 'result';
  args?: unknown;
  output?: unknown;

  // ---------------------------------------------------------------------
  // Auditoria. Todos opcionais: ver "Compatibilidade" no topo do arquivo.
  // ---------------------------------------------------------------------

  /** Rótulo humano do passo ("Executando consulta"). */
  title?: string;
  /** Sobre o quê ("messages", "Vendas por mês"). */
  target?: string;
  /** Resumo do desfecho ("128 linhas · 340 ms"). */
  summary?: string;
  /**
   * O SQL que rodou. Só em `run_query`, e é O campo desta feature: sem ele o
   * usuário não tem como discordar do número que recebeu.
   */
  sql?: string;
  /** Conexão onde o SQL rodou — a mesma pergunta em dois bancos dá respostas diferentes. */
  connectionName?: string;
  /** Linhas retornadas (mesmo quando `preview` foi truncado). */
  rowCount?: number;
  durationMs?: number;
  status?: ChatStepStatus;
  /** Mensagem de falha quando `status === 'error'`. */
  errorMessage?: string;
  /**
   * Marca ferramentas que APAGAM ou despublicam (`delete_*`, `unpublish_*`).
   * A tela destaca esses passos: um agente que apagou um dashboard não pode
   * relatar isso com o mesmo peso visual de uma leitura.
   */
  isDestructive?: boolean;
  /** Amostra do resultado, para conferência. */
  preview?: ChatStepPreview;
}

/**
 * Gráfico pronto para renderizar dentro da resposta.
 *
 * O evento já existia declarado no backend (`CHAT_EVENTS.CHART`) e nunca foi
 * emitido — o estado vazio do chat promete "com o gráfico pronto para salvar"
 * e o gráfico nunca aparecia. `result` vem no shape que o render-engine
 * consome, então a mesma peça do dashboard renderiza aqui.
 */
export interface ChatChartEvent {
  conversationId: string;
  runId: string;
  messageId: string;
  chart: ChatChartPayload;
}

export interface ChatChartPayload {
  /** Id do Chart quando o agente já o materializou via MCP. */
  chartId?: string;
  title: string;
  /** catalogType do bloco (kpi | bar_chart | line_chart | donut | table | …). */
  catalogType: string;
  props?: Record<string, unknown>;
  /** Dados no shape do contrato de bloco — alimenta o BlockRenderer. */
  result: unknown;
  /** Vínculo de dados que materializa o Chart ao salvar no dashboard. */
  dataBinding?: unknown;
}

/** O que o agente fez com um artefato durante o turno. */
export type ChatArtifactAction =
  | 'created'
  | 'updated'
  | 'published'
  | 'unpublished'
  | 'deleted';

/**
 * Artefato tocado pelo agente.
 *
 * Vira um cartão acionável na resposta ("Abrir dashboard"). Sem isto o agente
 * anuncia em texto que criou algo e o usuário precisa caçar o item na
 * listagem — o trabalho fica pronto e some.
 */
export interface ChatArtifactEvent {
  conversationId: string;
  runId: string;
  kind: 'chart' | 'dashboard';
  id: string;
  title: string;
  action: ChatArtifactAction;
}

/** Consumo do turno. Alimenta o rodapé da resposta (tokens, tempo, passos). */
export interface ChatUsageEvent {
  conversationId: string;
  runId: string;
  messageId: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  elapsedMs?: number;
  steps?: number;
}

/**
 * Título da conversa renomeado pelo servidor no fim do primeiro turno.
 *
 * Antes a lista só descobria o novo título num recarregamento: o usuário
 * mandava a primeira pergunta e a conversa continuava se chamando "Nova
 * conversa" na barra lateral até ele sair e voltar.
 */
export interface ChatTitleEvent {
  conversationId: string;
  title: string;
}
