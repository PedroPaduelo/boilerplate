/**
 * Modelo de UI do chat — o vocabulário que a tela usa.
 *
 * Fica separado do transporte de propósito. `transport/types.ts` descreve o que
 * o SERVIDOR manda; este arquivo descreve o que a TELA precisa mostrar. São
 * coisas diferentes: o servidor fala em `tool_step` com `phase: 'call' |
 * 'result'` (dois eventos para uma mesma ação), e a tela precisa de UM passo
 * com um estado. A tradução acontece no reducer, e é ela que impede o formato
 * do socket de vazar para dentro dos componentes.
 *
 * Também é o ponto de encontro entre quem monta o estado e quem o desenha:
 * ambos programam contra os tipos daqui.
 */
import type {
  ChatArtifactAction,
  ChatChartPayload,
  ChatStepPreview,
  ChatStepStatus,
  ChatTurnPhase,
} from '@dashboards/contracts';

export type { ChatChartPayload, ChatStepPreview, ChatStepStatus, ChatTurnPhase };

/**
 * Um passo da trilha de auditoria, já pronto para a tela.
 *
 * Diferente do evento do socket, aqui `call` e `result` da mesma ferramenta já
 * foram fundidos: `status` conta em que pé está e os campos de evidência (SQL,
 * linhas, duração) chegam preenchidos quando o passo termina.
 */
export interface AuditStep {
  /** Chave natural — casa o `call` com o `result` da mesma ferramenta. */
  toolCallId: string;
  /** Nome técnico da tool, preservado para depuração e para rótulo de fallback. */
  toolName: string;
  /** Rótulo humano ("Executando consulta"). */
  title: string;
  /** Sobre o quê ("messages", "Vendas por mês"). */
  target?: string;
  /** Resumo do desfecho ("128 linhas · 340 ms"). */
  summary?: string;
  status: ChatStepStatus;
  durationMs?: number;
  errorMessage?: string;
  /** SQL executado — presente apenas em consultas. É a evidência. */
  sql?: string;
  connectionName?: string;
  rowCount?: number;
  preview?: ChatStepPreview;
  /**
   * Apagou ou despublicou algo. A tela destaca: o usuário precisa notar uma
   * exclusão feita em seu nome mesmo quando ele só bateu o olho na resposta.
   */
  isDestructive?: boolean;
}

/** Artefato que o agente criou/alterou no turno — vira cartão acionável. */
export interface ChatArtifact {
  kind: 'chart' | 'dashboard';
  id: string;
  title: string;
  action: ChatArtifactAction;
}

/** Consumo do turno, para o rodapé da resposta. */
export interface ChatTurnUsage {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  elapsedMs?: number;
  steps?: number;
}

/**
 * Tudo que acompanha UMA resposta do agente além do texto.
 *
 * Vive junto da mensagem (e não solto no estado da conversa) porque precisa
 * sobreviver ao fim do turno: ao reabrir a conversa, a trilha da terceira
 * resposta tem de continuar sendo a trilha DA TERCEIRA resposta. Antes os
 * passos moravam num campo único da conversa e só existiam durante o
 * streaming — recarregar a página apagava a auditoria inteira.
 */
export interface ChatMessageTrail {
  steps: AuditStep[];
  artifacts: ChatArtifact[];
  usage?: ChatTurnUsage;
}

export const EMPTY_TRAIL: ChatMessageTrail = { steps: [], artifacts: [] };
