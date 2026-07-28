/**
 * Executa um turno do agente DESACOPLADO da requisição HTTP.
 *
 * A requisição só dispara o turno e responde na hora; o trabalho segue aqui e
 * os pedaços saem por socket, para a sala da conversa. Como o estado vive no
 * Redis (`run-store`), sair da tela não interrompe nada e voltar retoma de onde
 * parou — que era a queixa central do SSE: o texto só existia enquanto a
 * conexão estivesse aberta.
 *
 * ## O que sai por socket, e por quê
 *
 * Além do texto, o turno emite a TRILHA DE AUDITORIA. O produto promete
 * "respostas auditáveis" e até aqui entregava só a conclusão do agente: a tela
 * recebia o texto e o nome cru da ferramenta, sem qual conexão foi aberta, qual
 * SQL rodou, quantas linhas voltaram nem quanto tempo levou. A tradução de
 * "retorno cru" para "evidência" mora em `audit-trail` (pura, testável); aqui
 * mora a orquestração: quando emitir, como medir, o que persistir.
 */
import type { Tool } from 'ai';
import type { ChatChartPayload } from '@dashboards/contracts';

import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { socketManager } from '@/socket/manager/socket-manager';
import { getTool } from '@/modules/mcp/tools';

import { createAnthropicWithExtras, extrasToProviderOptions } from '../provider/anthropic.js';
import { DEFAULT_AGENT_CONFIG } from '../config/schemas.js';
import { runAgent } from '../agent/loop.js';
import { buildMcpToolsForAgent } from '../tools/mcp-adapter.js';
import { loadAllSkills, createActivateSkillTool } from '../skills/index.js';
import { addMessage, loadConversationHistory } from './conversation.js';
import { startRun, patchRun, finishRun, type RunArtifact, type RunToolStep } from './run-store.js';
import {
  artifactTouchedBy,
  chartDataFitsBudget,
  chartMetaFrom,
  chartsAwaitingData,
  connectionIdOf,
  describeToolStep,
  harvestConnectionNames,
  isRenderableChartData,
  previewedChartId,
  stepLabel,
  toolErrorMessage,
  type ChartMeta,
} from './audit-trail.js';

/** Sala de socket por conversa: quem está com o chat aberto entra nela. */
export function chatRoom(conversationId: string): string {
  return `chat:${conversationId}`;
}

export const CHAT_EVENTS = {
  DELTA: 'chat:delta',
  TOOL_STEP: 'chat:tool-step',
  CHART: 'chat:chart',
  PHASE: 'chat:phase',
  ARTIFACT: 'chat:artifact',
  USAGE: 'chat:usage',
  TITLE: 'chat:title',
  DONE: 'chat:done',
  ERROR: 'chat:error',
} as const;

/**
 * Teto do `output` cru no evento de socket.
 *
 * A evidência agora viaja em campos estruturados (`preview`, `rowCount`,
 * `summary`), todos já truncados. O `output` inteiro continua indo junto
 * enquanto for pequeno — é útil para depurar —, mas um `get_connection_schema`
 * de banco grande passa de 100 KB e mandá-lo a cada passo é exatamente o que
 * trava a aba. Acima do teto, ele fica só no que é persistido.
 */
const OUTPUT_INLINE_MAX_CHARS = 8000;

/**
 * Teto do gráfico que o SERVIDOR materializa por conta própria.
 *
 * 128 KB de JSON passa qualquer gráfico legível numa bolha de conversa
 * (≈ 2 800 pontos de uma série `{x,y}` com data ISO) e barra o patológico — os
 * 5 000 pontos que o pg-runner deixa passar dariam ≈ 225 KB por socket, e mais
 * o mesmo tanto dentro da linha da mensagem no Postgres.
 *
 * Vale só para o caminho NOVO (o servidor decidindo materializar). O
 * `preview_chart_data` pedido pelo agente continua exatamente como está: mudar
 * o comportamento de um caminho que já funciona não faz parte deste conserto.
 */
export const CHART_INLINE_MAX_CHARS = 128_000;

/**
 * Prazo TOTAL da materialização, somando todos os gráficos pendentes.
 *
 * O texto já foi transmitido quando isto roda, mas `chat:done` ainda não saiu —
 * e é ele que libera a tela. Sem prazo, um `statement_timeout` de 30 s (o
 * padrão do pg-runner) mais a espera por conexão do pool deixariam a resposta
 * "em andamento" por quase um minuto DEPOIS de pronta. 10 s cobrem com folga a
 * query agregada típica (a do relato levou 16 ms) e não sequestram o turno.
 */
export const CHART_MATERIALIZE_BUDGET_MS = 10_000;

export interface StartTurnParams {
  conversationId: string;
  userId: string;
  actor: ActorContext;
  userMessage: string;
  systemPrompt: string;
  runId: string;
}

/**
 * Dispara o turno e retorna imediatamente. Nunca lança: o erro é reportado
 * pelo socket e persistido — quem chamou já respondeu ao cliente.
 */
export function startTurnInBackground(params: StartTurnParams): void {
  void executarTurno(params).catch((err) => {
    logger.error({ err, conversationId: params.conversationId }, 'agent: turno falhou fora do fluxo');
  });
}

/** Serializa com teto; `undefined` quando não vale a pena mandar pelo fio. */
function outputParaSocket(output: unknown): unknown {
  if (output === undefined) return undefined;
  try {
    const texto = JSON.stringify(output);
    if (texto === undefined) return undefined;
    return texto.length <= OUTPUT_INLINE_MAX_CHARS ? output : undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Materialização do gráfico que o agente não pré-visualizou
// ---------------------------------------------------------------------------

const PRAZO_ESGOTADO = Symbol('prazo esgotado');

/** `Promise.race` com relógio: devolve o símbolo quando o prazo vence primeiro. */
async function comPrazo<T>(
  promessa: Promise<T>,
  ms: number,
): Promise<T | typeof PRAZO_ESGOTADO> {
  let timer: NodeJS.Timeout | undefined;
  const prazo = new Promise<typeof PRAZO_ESGOTADO>((resolve) => {
    timer = setTimeout(() => resolve(PRAZO_ESGOTADO), ms);
  });
  try {
    // A promessa perdedora continua viva, mas o `race` já anexou handlers nela:
    // uma rejeição atrasada é tratada e NÃO vira unhandled rejection.
    return await Promise.race([promessa, prazo]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Executa o MESMO caminho do `preview_chart_data` — a ferramenta inteira, não
 * só o `executeBlockData` que ela chama por dentro.
 *
 * O handler faz, nesta ordem: `assertPermission(actor, 'artifacts:view')`,
 * `requireChartForView` (visibilidade do gráfico), leitura do `draftDataBinding`,
 * `requireConnectionForUse` (visibilidade da CONEXÃO), `getCatalogDataShape` e
 * só então `executeBlockData`. Copiar esse miolo para cá custaria cinco imports
 * novos e uma SEGUNDA cópia das três checagens de permissão — que passariam a
 * poder divergir da original sem ninguém perceber. Chamando o handler com o
 * `actor` do turno, a checagem é literalmente a mesma que o agente teria
 * enfrentado se tivesse chamado a ferramenta sozinho.
 *
 * `mode: 'draft'` porque é o rascunho que `create_chart`/`update_chart` acabaram
 * de gravar; o publicado pode nem existir.
 */
export async function previewDoChart(actor: ActorContext, chartId: string): Promise<unknown> {
  const ferramenta = getTool('preview_chart_data');
  if (!ferramenta) throw new Error('preview_chart_data não está registrada no MCP');
  return ferramenta.handler({ chartId, mode: 'draft' }, { actor });
}

export interface MaterializacaoDeps {
  /** Roda o caminho do `preview_chart_data` para um gráfico (ver `previewDoChart`). */
  previewChartData: (chartId: string) => Promise<unknown>;
  /** Publica o gráfico pronto: socket + estado do turno. */
  emitirGrafico: (chartId: string, resultado: unknown) => Promise<void>;
  /** Por que um gráfico não saiu. Vai para o log — nunca para a tela. */
  aoDesistir?: (chartId: string, motivo: string) => void;
  budgetMs?: number;
  maxChars?: number;
  agora?: () => number;
}

/**
 * Executa os dados dos gráficos que ficaram sem eles e os emite.
 *
 * É um BÔNUS, e o desenho inteiro segue daí: toda saída ruim (sem permissão,
 * gráfico apagado no meio do turno, SQL que falhou, resultado fora do contrato
 * de bloco, dados grandes demais, prazo estourado) termina em "não emite e
 * segue", nunca em exceção. O turno já tem uma resposta pronta; ela não pode
 * virar um erro por causa de um extra.
 *
 * Note que `executeBlockData` NÃO lança em falha de query: devolve
 * `state: 'error'` como resultado normal. Por isso a checagem de sucesso é
 * `isRenderableChartData` (resultado), e não um `catch` (exceção) — o `catch`
 * aqui cobre o que vem ANTES dele: RBAC, visibilidade e chart inexistente.
 *
 * As dependências entram por injeção para que a regra — o que emitir, o que
 * recusar, quando desistir — seja testável sem agente, banco, socket ou Redis.
 */
export async function materializarGraficosPendentes(
  definidos: Iterable<ChartMeta>,
  jaEmitidos: ReadonlySet<string>,
  deps: MaterializacaoDeps,
): Promise<void> {
  const pendentes = chartsAwaitingData(definidos, jaEmitidos);
  if (pendentes.length === 0) return;

  const agora = deps.agora ?? Date.now;
  const maxChars = deps.maxChars ?? CHART_INLINE_MAX_CHARS;
  const desistir = deps.aoDesistir ?? (() => {});
  const fim = agora() + (deps.budgetMs ?? CHART_MATERIALIZE_BUDGET_MS);

  // Em série, de propósito: cada preview segura uma conexão do pool externo
  // (`PG_RUNNER_POOL_MAX`, 8) durante toda a query, e o prazo é do CONJUNTO —
  // disparar tudo em paralelo brigaria com o próximo turno pelo mesmo pool.
  for (const meta of pendentes) {
    const restante = fim - agora();
    if (restante <= 0) {
      desistir(meta.chartId, 'prazo da materialização esgotado');
      continue;
    }

    let resultado: unknown;
    try {
      resultado = await comPrazo(deps.previewChartData(meta.chartId), restante);
    } catch (err) {
      desistir(meta.chartId, err instanceof Error ? err.message : 'falha ao executar os dados');
      continue;
    }

    if (resultado === PRAZO_ESGOTADO) {
      desistir(meta.chartId, 'prazo da materialização esgotado');
      continue;
    }
    if (!isRenderableChartData(resultado)) {
      desistir(meta.chartId, toolErrorMessage(resultado) ?? 'resultado sem dados renderizáveis');
      continue;
    }
    if (!chartDataFitsBudget(resultado, maxChars)) {
      desistir(meta.chartId, `dados acima do teto de ${maxChars} caracteres`);
      continue;
    }

    try {
      await deps.emitirGrafico(meta.chartId, resultado);
    } catch (err) {
      desistir(meta.chartId, err instanceof Error ? err.message : 'falha ao emitir o gráfico');
    }
  }
}

async function executarTurno({
  conversationId,
  userId,
  actor,
  userMessage,
  systemPrompt,
  runId,
}: StartTurnParams): Promise<void> {
  const inicioDoTurno = Date.now();
  const messageId = `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sala = chatRoom(conversationId);
  await startRun(conversationId, runId, messageId);

  /**
   * Emitir NUNCA pode derrubar o turno: o usuário pode ter fechado a aba, e o
   * trabalho continua valendo (o estado está no Redis e vai para o banco).
   */
  const emitirBruto = (evento: string, payload: Record<string, unknown>) => {
    try {
      socketManager.sendToRoom(sala, evento, payload);
    } catch {
      // Ninguém escutando (usuário saiu): o estado continua no Redis.
    }
  };
  const emit = (evento: string, payload: Record<string, unknown>) =>
    emitirBruto(evento, { conversationId, runId, ...payload });

  let texto = '';
  let usage:
    | { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number }
    | undefined;
  let erro: string | null = null;
  let historyLen = 0;
  let totalDePassos = 0;

  /**
   * O estado autoritativo do turno vive AQUI, em memória, porque só existe um
   * produtor: este turno. O Redis é a cópia para quem chega depois.
   *
   * Escrever no Redis a cada delta com leitura-modificação-escrita perde
   * atualizações — os deltas chegam às centenas por segundo e as escritas se
   * atropelam (medido: uma resposta inteira virou 5 caracteres e seq=1).
   * Então acumulamos localmente e despejamos o estado COMPLETO de tempos em
   * tempos, sem depender do que está gravado.
   */
  let seq = 0;
  /** Um passo por `toolCallId` (chave natural). A ordem de inserção é a ordem das chamadas. */
  const passos = new Map<string, RunToolStep>();
  const graficos: ChatChartPayload[] = [];
  const artefatos: RunArtifact[] = [];
  let flushPendente: NodeJS.Timeout | null = null;
  let flushEmVoo: Promise<unknown> = Promise.resolve();

  const flush = () => {
    // Encadeia as escritas: nunca duas ao mesmo tempo para a mesma chave.
    flushEmVoo = flushEmVoo.then(() =>
      patchRun(conversationId, (s) => {
        s.text = texto;
        s.seq = seq;
        s.toolSteps = [...passos.values()];
        s.charts = graficos;
        s.artifacts = artefatos;
      }).catch(() => {}),
    );
    return flushEmVoo;
  };

  /** Agenda um flush no máximo a cada 200ms (o socket já entregou o delta). */
  const agendarFlush = () => {
    if (flushPendente) return;
    flushPendente = setTimeout(() => {
      flushPendente = null;
      void flush();
    }, 200);
  };

  // --- fase do turno -------------------------------------------------------
  /**
   * "O agente está trabalhando…" não informa nada a quem espera 40 segundos.
   * Cada transição autoriza uma frase honesta na tela. Só emitimos MUDANÇAS:
   * um evento por delta de texto seria ruído puro.
   */
  let faseAtual: string | null = null;
  const emitirFase = (phase: 'thinking' | 'tool' | 'writing', label?: string) => {
    const chave = `${phase}:${label ?? ''}`;
    if (chave === faseAtual) return;
    faseAtual = chave;
    emit(CHAT_EVENTS.PHASE, { phase, ...(label ? { label } : {}) });
  };

  // --- nomes de conexão ----------------------------------------------------
  /**
   * A MESMA pergunta em dois bancos dá respostas diferentes, então o nome da
   * conexão faz parte da evidência. Resolvemos uma vez por turno: o retorno de
   * `list_connections` já traz os nomes de graça, e o resto vem do banco.
   */
  const nomesDeConexao = new Map<string, string>();
  const buscasEmVoo = new Map<string, Promise<void>>();
  const nomeDaConexao = (id: string) => nomesDeConexao.get(id);

  const aquecerConexao = async (id: string): Promise<void> => {
    if (nomesDeConexao.has(id)) return;
    let busca = buscasEmVoo.get(id);
    if (!busca) {
      busca = prisma.connection
        .findUnique({ where: { id }, select: { name: true } })
        .then((c) => {
          if (c?.name) nomesDeConexao.set(id, c.name);
        })
        // Falha aqui OMITE o campo, nunca derruba o passo: uma trilha sem o
        // nome da conexão ainda é útil; um turno morto por causa de um
        // `SELECT name` não é.
        .catch(() => {});
      buscasEmVoo.set(id, busca);
    }
    await busca;
  };

  // --- memória do turno sobre artefatos ------------------------------------
  /** id -> título, para `delete_*` (que devolve só `{id, deleted}`) ter nome. */
  const titulosConhecidos = new Map<string, string>();
  /** Metadados de gráfico vistos no turno (título/tipo/props/binding). */
  const metaDeGrafico = new Map<string, ChartMeta>();
  /** Duração REAL medida por chamada (ver `instrumentar`). */
  const duracoes = new Map<string, number>();
  /** Emissões de gráfico em voo — aguardadas antes do flush final. */
  const graficosEmVoo: Array<Promise<void>> = [];

  // --- trilha --------------------------------------------------------------

  const registrarChamada = (toolName: string, toolCallId: string, args: unknown) => {
    const campos = describeToolStep(toolName, args, undefined, undefined, {
      connectionName: nomeDaConexao,
    });
    const passo: RunToolStep = {
      toolCallId,
      toolName,
      phase: 'call',
      status: 'running',
      args,
      ...campos,
    };
    passos.set(toolCallId, passo);

    emitirFase('tool', stepLabel(campos, toolName));
    emit(CHAT_EVENTS.TOOL_STEP, {
      toolCallId,
      toolName,
      phase: 'call',
      args,
      ...campos,
    });
    agendarFlush();
  };

  const registrarResultado = (toolName: string, toolCallId: string, output: unknown) => {
    // Nomes que passaram pela frente saem de graça (sem ida ao banco).
    for (const [id, nome] of harvestConnectionNames(output)) nomesDeConexao.set(id, nome);

    const anterior = passos.get(toolCallId);
    const args = anterior?.args;
    const campos = describeToolStep(toolName, args, output, duracoes.get(toolCallId), {
      connectionName: nomeDaConexao,
    });

    passos.set(toolCallId, {
      ...(anterior ?? { toolCallId, toolName, phase: 'result', status: 'ok' }),
      toolCallId,
      toolName,
      args,
      output,
      ...campos,
      phase: 'result',
      status: campos.status ?? 'ok',
    });

    emit(CHAT_EVENTS.TOOL_STEP, {
      toolCallId,
      toolName,
      phase: 'result',
      output: outputParaSocket(output),
      ...campos,
    });

    registrarArtefato(toolName, args, output);
    registrarGrafico(toolName, args, output);
    agendarFlush();
  };

  function registrarArtefato(toolName: string, args: unknown, output: unknown): void {
    const tocado = artifactTouchedBy(toolName, args, output, (id) => titulosConhecidos.get(id));
    if (!tocado) return;
    titulosConhecidos.set(tocado.id, tocado.title);
    artefatos.push(tocado);
    emit(CHAT_EVENTS.ARTIFACT, { ...tocado });
  }

  /**
   * `chat:chart` — o evento já existia declarado e NUNCA foi emitido: o estado
   * vazio do chat promete "com o gráfico pronto para salvar" e o gráfico nunca
   * aparecia.
   *
   * Ele nasce do encontro de duas ferramentas, porque nenhuma sozinha basta
   * (verificado nos handlers do MCP): `create_chart`/`update_chart` devolvem a
   * DEFINIÇÃO (título, tipo, props, binding) e nenhum dado;
   * `preview_chart_data` devolve os DADOS já no shape do contrato de bloco
   * (`BlockDataResult`) e nenhum metadado além do id.
   *
   * O encontro pode não acontecer: o preview é opcional para o agente. Quando
   * só a definição chega, quem executa os dados é o próprio servidor, no fim do
   * turno — ver `materializarGraficosPendentes`.
   */
  function registrarGrafico(toolName: string, args: unknown, output: unknown): void {
    const meta = chartMetaFrom(toolName, output);
    if (meta) {
      metaDeGrafico.set(meta.chartId, meta);
      titulosConhecidos.set(meta.chartId, meta.title);
      return;
    }
    if (toolName !== 'preview_chart_data' || !isRenderableChartData(output)) return;
    const chartId = previewedChartId(toolName, args, output);
    if (!chartId) return;
    graficosEmVoo.push(emitirGrafico(chartId, output));
  }

  async function emitirGrafico(chartId: string, resultado: unknown): Promise<void> {
    try {
      let meta = metaDeGrafico.get(chartId);
      if (!meta) {
        // O gráfico pode ter sido criado num turno anterior: buscamos a
        // definição para conseguir renderizá-lo aqui.
        const chart = await prisma.chart.findUnique({
          where: { id: chartId },
          select: { id: true, title: true, catalogType: true, draftProps: true, draftDataBinding: true },
        });
        if (!chart) return;
        meta = {
          chartId: chart.id,
          title: chart.title,
          catalogType: chart.catalogType,
          ...(chart.draftProps ? { props: chart.draftProps as Record<string, unknown> } : {}),
          ...(chart.draftDataBinding ? { dataBinding: chart.draftDataBinding } : {}),
        };
        metaDeGrafico.set(chartId, meta);
      }

      const chart: ChatChartPayload = {
        chartId: meta.chartId,
        title: meta.title,
        catalogType: meta.catalogType,
        result: resultado,
        ...(meta.props ? { props: meta.props } : {}),
        ...(meta.dataBinding ? { dataBinding: meta.dataBinding } : {}),
      };
      graficos.push(chart);
      emit(CHAT_EVENTS.CHART, { messageId, chart });
      agendarFlush();
    } catch (err) {
      // Um gráfico que não pôde ser montado não pode custar a resposta inteira.
      logger.warn({ err, conversationId, chartId }, 'agent: falha ao montar gráfico da resposta');
    }
  }

  /**
   * Envolve cada tool para medir a duração REAL por `toolCallId` e anunciar a
   * chamada NO MOMENTO em que ela começa.
   *
   * Por que aqui e não no `onStep`: `onStepFinish` só dispara depois que TODAS
   * as ferramentas do passo terminaram. Emitir a partir dele significaria
   * mostrar "Executando consulta" quando a consulta já acabou — e medir
   * duração zero, porque chamada e resultado chegariam no mesmo instante.
   *
   * O `execute` original é sempre chamado, e a instrumentação inteira é
   * defensiva: nada aqui pode alterar o resultado de uma ferramenta.
   */
  function instrumentar(tools: Record<string, Tool>): Record<string, Tool> {
    const saida: Record<string, Tool> = {};
    for (const [nome, ferramenta] of Object.entries(tools)) {
      const original = (ferramenta as { execute?: (a: unknown, c: unknown) => unknown }).execute;
      if (typeof original !== 'function') {
        saida[nome] = ferramenta;
        continue;
      }
      saida[nome] = {
        ...ferramenta,
        execute: async (args: unknown, ctx: unknown) => {
          const toolCallId = String((ctx as { toolCallId?: string })?.toolCallId ?? '');
          try {
            const connectionId = connectionIdOf(nome, args);
            if (connectionId) await aquecerConexao(connectionId);
            if (toolCallId) registrarChamada(nome, toolCallId, args);
          } catch (err) {
            logger.warn({ err, conversationId, tool: nome }, 'agent: falha ao anunciar chamada');
          }
          // O cronômetro começa DEPOIS do anúncio: a duração relatada é a da
          // ferramenta, não a do nosso preparo.
          const iniciado = Date.now();
          try {
            return await original(args, ctx);
          } finally {
            if (toolCallId) duracoes.set(toolCallId, Date.now() - iniciado);
          }
        },
      } as Tool;
    }
    return saida;
  }

  try {
    emitirFase('thinking');

    const history = await loadConversationHistory(conversationId);
    historyLen = history.length;

    const provider = createAnthropicWithExtras({
      apiKey: env.ANTHROPIC_API_KEY!,
      baseURL: env.AI_BASE_URL || 'https://api.anthropic.com',
      cacheTools: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
      toolsTtl: DEFAULT_AGENT_CONFIG.cacheOptions.toolsTtl,
    });

    const skills = await loadAllSkills();
    const allTools = instrumentar({
      ...buildMcpToolsForAgent(actor),
      activate_skill: createActivateSkillTool(skills),
    });

    const result = await runAgent({
      model: provider(env.AI_MODEL),
      tools: allTools as never,
      systemPrompt,
      convo: history as never,
      cacheBreakpoint: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
      cacheOptions: DEFAULT_AGENT_CONFIG.cacheOptions,
      temperature: DEFAULT_AGENT_CONFIG.temperature,
      maxOutputTokens: env.AI_MAX_TOKENS,
      maxSteps: DEFAULT_AGENT_CONFIG.maxSteps,
      providerOptions: extrasToProviderOptions(DEFAULT_AGENT_CONFIG.anthropicExtras),
      sink: {
        onTextDelta: (delta) => {
          texto += delta;
          seq += 1;
          emitirFase('writing');
          // Emite na hora (quem está com a tela aberta vê digitando) e grava
          // com folga: o número do pedaço é o que permite retomar sem buraco.
          emit(CHAT_EVENTS.DELTA, { messageId, delta, seq });
          agendarFlush();
        },
        onStep: (step) => {
          const chamadas = step.toolCalls ?? [];
          const resultados = step.toolResults ?? [];

          // Uma chamada cuja entrada o SDK rejeitou nunca passa pelo `execute`,
          // então o wrapper não a anunciou: registramos aqui para o passo não
          // sumir da trilha.
          for (const tc of chamadas) {
            if (!passos.has(tc.toolCallId)) registrarChamada(tc.toolName, tc.toolCallId, tc.args);
          }

          // Casamento por `toolCallId`, NUNCA por índice.
          //
          // `step.toolResults` é `content.filter(type === 'tool-result')`: um
          // erro de ferramenta vira parte `tool-error` e NÃO entra nessa lista.
          // Com duas chamadas em que a primeira falha, `toolResults[0]` é o
          // resultado da SEGUNDA — o par por índice atribuiria o retorno de um
          // `run_query` a outra ferramenta, e a trilha passaria a mentir.
          // (Reproduzido com o `streamText` real antes de escrever isto.)
          const respondidas = new Set<string>();
          for (const tr of resultados) {
            respondidas.add(tr.toolCallId);
            registrarResultado(tr.toolName, tr.toolCallId, tr.output);
          }

          // Chamada sem resultado no mesmo passo = erro de ferramenta. Vira um
          // passo com falha, em vez de ficar "executando" para sempre.
          for (const tc of chamadas) {
            if (respondidas.has(tc.toolCallId)) continue;
            registrarResultado(tc.toolName, tc.toolCallId, {
              error: 'a ferramenta não retornou resultado (entrada rejeitada)',
              code: 'tool_error',
            });
          }

          if (step.usage) usage = step.usage;
          if (chamadas.length > 0) emitirFase('thinking');
        },
        onFinal: () => {},
        onError: () => {},
      },
    });

    texto = result.fullText || texto;
    totalDePassos = result.steps;
    if (result.usage) usage = result.usage;
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number; responseBody?: unknown };
    logger.error(
      { message: e?.message, statusCode: e?.statusCode, responseBody: e?.responseBody },
      'agent: erro do provider',
    );
    erro = e?.message ?? 'Agent execution failed';
  }

  // Gráficos podem estar sendo montados (busca da definição no banco): quem
  // reabrir a tela precisa encontrá-los no estado.
  if (graficosEmVoo.length > 0) await Promise.allSettled(graficosEmVoo);

  /**
   * Rede de segurança do gráfico embutido.
   *
   * Medido: o agente respondeu com `run_query` + `list_catalog` +
   * `create_chart` e a tela mostrou a trilha, o texto e o cartão "Abrir
   * gráfico" — sem gráfico. Faltou o `preview_chart_data`, que é opcional para
   * ele. O que o usuário vê não pode depender da rota que o modelo escolheu,
   * então o servidor executa os dados que faltaram.
   *
   * AQUI, e não logo depois do `create_chart`, por três razões:
   *   1. o texto inteiro já saiu por `chat:delta` — o usuário está lendo a
   *      resposta enquanto esta query roda, em vez de esperar por ela;
   *   2. no meio do turno a query competiria pelo pool externo com os
   *      `run_query` seguintes do próprio agente, tornando o turno mais lento
   *      para pagar por um extra;
   *   3. um `create_chart` seguido de `update_chart` (o agente corrigindo a si
   *      mesmo) materializaria duas vezes; no fim do turno existe uma definição
   *      final por gráfico, e ela é a que o usuário vai ver.
   *
   * Ainda é ANTES do flush final, do `addMessage` e do `chat:done`: o gráfico
   * entra no estado retomável, na mensagem persistida e chega à tela enquanto a
   * resposta ainda está aberta — nada disso valeria se fosse depois.
   *
   * Turno que falhou não ganha bônus: a mensagem vai ser "Erro: …" e anexar um
   * gráfico a ela confundiria mais do que ajudaria.
   */
  if (!erro) {
    const jaEmitidos = new Set(
      graficos.map((g) => g.chartId).filter((id): id is string => Boolean(id)),
    );
    await materializarGraficosPendentes(metaDeGrafico.values(), jaEmitidos, {
      previewChartData: (chartId) => previewDoChart(actor, chartId),
      emitirGrafico,
      aoDesistir: (chartId, motivo) =>
        logger.info(
          { conversationId, chartId, motivo },
          'agent: gráfico da resposta não foi materializado',
        ),
    });
  }

  // Despeja o estado final ANTES de marcar como concluído: quem chegar depois
  // precisa encontrar o texto inteiro, não o que sobrou do último flush.
  if (flushPendente) clearTimeout(flushPendente);
  await flush();

  const elapsedMs = Date.now() - inicioDoTurno;
  const consumo = {
    ...(usage?.inputTokens !== undefined ? { inputTokens: usage.inputTokens } : {}),
    ...(usage?.outputTokens !== undefined ? { outputTokens: usage.outputTokens } : {}),
    ...(usage?.cachedInputTokens !== undefined
      ? { cachedInputTokens: usage.cachedInputTokens }
      : {}),
    elapsedMs,
    steps: totalDePassos || passos.size,
  };

  // Persistência fora do try do agente: falha de banco é problema nosso, não
  // vira "a IA falhou" na tela.
  try {
    const limpo = texto.trim();
    /**
     * A trilha é gravada JÁ TRADUZIDA, no mesmo formato que o socket entrega
     * — é isto que a faz sobreviver ao recarregar. Antes daqui saía um array
     * de pares crus que a tela não sabia ler, então um F5 apagava a auditoria
     * inteira e sobrava o texto (a conclusão sem a evidência).
     *
     * Os passos vão fundidos (um por `toolCallId`), com `args`/`output` junto:
     * os campos traduzidos servem à tela e o par cru continua alimentando a
     * reinjeção do histórico no próximo turno. O `preview` já vem cortado nos
     * tetos do `audit-trail` — nada de 500 linhas indo para o banco.
     */
    /**
     * `charts` entra junto porque o Redis do turno expira em 30 min e o socket
     * só alcança quem estava com a tela aberta: sem isto, o gráfico que este
     * conserto acabou de fazer aparecer some no primeiro F5 — que é a metade
     * do problema que a feature veio resolver.
     *
     * Filtrado pelo mesmo teto da materialização: o que não caberia no socket
     * também não deve engordar a linha da mensagem. Um gráfico grande demais
     * continua reconstruível (a definição está na tabela `Chart` e o `output`
     * do preview está em `steps`).
     *
     * A trilha ganha uma chave nova e nada quebra: `loadConversationHistory` lê
     * só `steps` e o leitor da tela (`readPersistedTrail`) ignora chaves
     * desconhecidas. Ressalva honesta: hoje esse leitor também ignora `charts`
     * — restaurar o gráfico ao recarregar exige uma mudança no front, que está
     * fora deste escopo. Gravar é o pré-requisito dela; sem o dado gravado não
     * há o que restaurar.
     */
    const graficosPersistiveis = graficos.filter((c) =>
      chartDataFitsBudget(c, CHART_INLINE_MAX_CHARS),
    );

    const trilha = {
      steps: [...passos.values()].filter((p) => p.output !== undefined),
      artifacts: artefatos,
      ...(graficosPersistiveis.length > 0 ? { charts: graficosPersistiveis } : {}),
      usage: consumo,
    };

    await addMessage(conversationId, {
      role: 'assistant',
      content: limpo || (erro ? `Erro: ${erro}` : '(sem resposta)'),
      toolData: trilha,
      tokensIn: usage?.inputTokens,
      tokensOut: usage?.outputTokens,
    });

    if (historyLen <= 1) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv?.title === 'Nova conversa') {
        const novoTitulo = userMessage.slice(0, 60);
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: novoTitulo },
        });
        // Sem este aviso a barra lateral só descobria o novo título num F5: o
        // usuário mandava a primeira pergunta e a conversa continuava se
        // chamando "Nova conversa" ao lado da resposta que já estava pronta.
        emitirBruto(CHAT_EVENTS.TITLE, { conversationId, title: novoTitulo });
        try {
          socketManager.sendToUser(userId, CHAT_EVENTS.TITLE, {
            conversationId,
            title: novoTitulo,
          });
        } catch {
          // Aba só com a listagem aberta pode não estar conectada.
        }
      }
    }
  } catch (persistErr) {
    logger.error({ err: persistErr, conversationId }, 'agent: falha ao persistir resposta');
  }

  await finishRun(conversationId, erro ? 'error' : 'done', erro ?? undefined);

  // Consumo antes do desfecho: o rodapé (tokens, tempo, passos) já está pronto
  // quando a mensagem fecha.
  emit(CHAT_EVENTS.USAGE, { messageId, ...consumo });

  if (erro) {
    emit(CHAT_EVENTS.ERROR, { messageId, message: erro });
  } else {
    emit(CHAT_EVENTS.DONE, { messageId, text: texto });
  }
  // Avisa também fora da sala: pode haver outra aba do usuário só na listagem.
  socketManager.sendToUser(userId, 'chat:turn-complete', {
    conversationId,
    failed: erro !== null,
  });
}
