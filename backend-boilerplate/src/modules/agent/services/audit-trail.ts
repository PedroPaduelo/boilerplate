/**
 * Tradutor da TRILHA DE AUDITORIA: de retorno cru de ferramenta para evidência
 * legível.
 *
 * ## Por que este arquivo existe
 *
 * O produto promete "respostas auditáveis", mas o turno do agente só entregava
 * à tela o texto final e o nome cru da ferramenta (`run_query`). Isso mostra a
 * CONCLUSÃO e esconde a EVIDÊNCIA: qual conexão foi aberta, qual SQL rodou,
 * quantas linhas voltaram, quanto tempo levou. Sem essas quatro coisas o
 * usuário não tem como DISCORDAR do número que recebeu — e uma resposta com a
 * qual não dá para discordar não é auditoria, é opinião bem formatada.
 *
 * Aqui mora a tradução, e só ela. As funções são PURAS de propósito: é o que
 * permite testar cada regra (rótulo, extração de SQL, teto do preview) sem
 * subir agente, banco, socket ou Redis. Quem orquestra (emitir, medir tempo,
 * persistir) é o `run-agent-background`.
 *
 * ## O formato do `output` — verificado, não suposto
 *
 * O `output` que chega em `onStep` é o retorno CRU do handler MCP: o adapter
 * (`tools/mcp-adapter.ts`) devolve `await mcpTool.handler(...)` sem embrulho, e
 * o AI SDK v6 expõe isso como `toolResults[i].output` (o `?? tr.result` do loop
 * é caminho morto — `result` não existe nesta versão). Confirmado por sonda
 * contra o `streamText` real.
 *
 * Consequência que muda o desenho: o adapter CAPTURA exceções e devolve
 * `{ error, code }` como resultado NORMAL. Ou seja, falha de ferramenta não
 * chega como exceção — chega como um output com campo `error`. Se olhássemos
 * só exceções, todo erro de tool viraria um passo "ok" mudo.
 *
 * ## Segredo nunca entra
 *
 * `list_connections` devolve host/username; `create_dashboard_share_link`
 * devolve um token que dá acesso público. Nada disso é extraído aqui: o
 * preview é restrito a `run_query`/`preview_chart_data`, e o link só vira
 * "link gerado". A trilha mostra O QUE foi feito, não a credencial de como.
 */

import type { ChatStepPreview, ChatStepStatus, ChatArtifactAction } from '@dashboards/contracts';

// ---------------------------------------------------------------------------
// Tetos do preview
// ---------------------------------------------------------------------------

/**
 * Teto de linhas da amostra. Um `run_query` pode voltar 1000 linhas; mandar
 * isso por socket a cada passo trava a aba e não ajuda ninguém a auditar —
 * quem confere um resultado olha o formato e as primeiras linhas. O tamanho
 * real fica preservado em `preview.totalRows` e em `rowCount`.
 */
export const PREVIEW_MAX_ROWS = 8;

/** Teto de colunas: um `SELECT *` de tabela larga estoura a largura da tela. */
export const PREVIEW_MAX_COLUMNS = 12;

/** Teto de caracteres por célula — um JSONB inteiro numa célula é ruído. */
const PREVIEW_MAX_CELL_CHARS = 200;

// ---------------------------------------------------------------------------
// Campos de auditoria (subconjunto de ChatToolStepEvent)
// ---------------------------------------------------------------------------

/**
 * O que este módulo sabe dizer sobre um passo. Espelha os campos de auditoria
 * do `ChatToolStepEvent` — todos opcionais, como manda o contrato: um passo
 * que não sabemos rotular ainda aparece na tela com o nome da ferramenta.
 */
export interface AuditFields {
  title?: string;
  target?: string;
  summary?: string;
  sql?: string;
  connectionName?: string;
  rowCount?: number;
  durationMs?: number;
  status?: ChatStepStatus;
  errorMessage?: string;
  isDestructive?: boolean;
  preview?: ChatStepPreview;
}

export interface DescribeOptions {
  /**
   * Resolve id de conexão -> nome, SÍNCRONO e a partir de cache já quente.
   *
   * A busca no banco é assíncrona e não cabe numa função pura; quem orquestra
   * aquece o cache antes (ver `connectionIdOf` e `harvestConnectionNames`) e
   * injeta a consulta aqui. Se o nome não estiver disponível, o campo é
   * simplesmente omitido — trilha sem o nome da conexão ainda é útil; passo
   * derrubado por causa de um `SELECT name` não é.
   */
  connectionName?: (connectionId: string) => string | undefined;
}

// ---------------------------------------------------------------------------
// Rótulos
// ---------------------------------------------------------------------------

/**
 * Rótulo humano por ferramenta, em português.
 *
 * Vale a pena ser explícito em vez de derivar do nome (`create_chart` ->
 * "Create chart"): o usuário desta tela é auditor, não desenvolvedor, e o
 * rótulo é a primeira coisa que ele lê para decidir se confia no passo.
 */
export const TOOL_TITLES: Readonly<Record<string, string>> = {
  // Conexões e dados
  list_connections: 'Listando conexões',
  get_connection_schema: 'Lendo o schema do banco',
  run_query: 'Executando consulta',
  list_catalog: 'Consultando o catálogo de blocos',
  // Gráficos
  list_charts: 'Listando gráficos',
  create_chart: 'Criando gráfico',
  update_chart: 'Atualizando gráfico',
  publish_chart: 'Publicando gráfico',
  preview_chart_data: 'Pré-visualizando dados do gráfico',
  delete_chart: 'Excluindo gráfico',
  unpublish_chart: 'Despublicando gráfico',
  // Dashboards
  list_dashboards: 'Listando dashboards',
  create_dashboard: 'Criando dashboard',
  update_dashboard: 'Atualizando dashboard',
  add_chart_to_dashboard: 'Adicionando gráfico ao dashboard',
  publish_dashboard: 'Publicando dashboard',
  delete_dashboard: 'Excluindo dashboard',
  unpublish_dashboard: 'Despublicando dashboard',
  create_dashboard_share_link: 'Gerando link de compartilhamento',
  // Agente
  activate_skill: 'Ativando skill',
};

/**
 * Rótulo da ferramenta. Nome desconhecido devolve o PRÓPRIO nome: uma tool
 * nova (ou renomeada) precisa aparecer feia na trilha, não sumir dela.
 */
export function toolTitle(toolName: string): string {
  return TOOL_TITLES[toolName] ?? toolName;
}

/**
 * A ferramenta APAGA ou tira do ar? A tela destaca esses passos: um agente que
 * excluiu um dashboard não pode relatar isso com o mesmo peso visual de uma
 * leitura.
 */
export function isDestructiveTool(toolName: string): boolean {
  return toolName.startsWith('delete_') || toolName.startsWith('unpublish_');
}

// ---------------------------------------------------------------------------
// Utilidades defensivas (nada aqui pode lançar)
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** "340 ms" / "1.4 s" — sem `toLocaleString` para não depender do ICU do host. */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function joinSummary(parts: Array<string | undefined>): string | undefined {
  const kept = parts.filter((p): p is string => Boolean(p));
  return kept.length > 0 ? kept.join(' · ') : undefined;
}

// ---------------------------------------------------------------------------
// Erro de ferramenta
// ---------------------------------------------------------------------------

/**
 * Mensagem de falha do output, ou `undefined` se o passo deu certo.
 *
 * Três formatos convivem, todos reais:
 *   - `{ error: 'mensagem', code }` — o adapter MCP embrulhando uma exceção;
 *   - `{ error: { message } }` — erro já estruturado;
 *   - `{ state: 'error', error: { code, message } }` — `preview_chart_data`,
 *     que devolve `BlockDataResult` e sinaliza a falha no `state`.
 */
export function toolErrorMessage(output: unknown): string | undefined {
  const rec = asRecord(output);
  if (!rec) return undefined;
  const direto = str(rec.error);
  if (direto) return direto;
  const aninhado = asRecord(rec.error);
  if (aninhado) {
    const msg = str(aninhado.message);
    if (msg) return msg;
    const code = str(aninhado.code);
    if (code) return code;
    return 'a ferramenta falhou';
  }
  // `state: 'error'` sem objeto de erro utilizável.
  if (str(rec.state) === 'error') return 'a ferramenta falhou';
  return undefined;
}

// ---------------------------------------------------------------------------
// SQL e conexão
// ---------------------------------------------------------------------------

/** O SQL dos args — só existe em `run_query`, e é O campo desta feature. */
function sqlOf(toolName: string, args: Record<string, unknown> | undefined): string | undefined {
  if (toolName !== 'run_query' || !args) return undefined;
  return str(args.sql);
}

/**
 * Tabela principal do FROM, para dar um alvo legível ao passo ("messages").
 *
 * Deliberadamente ingênuo: se o SQL for complexo demais para esta regra, o
 * passo fica sem `target` — o SQL completo já está no campo `sql`, que é a
 * evidência de verdade. Um parser de SQL aqui seria custo sem retorno.
 */
export function mainTableOf(sql: string | undefined): string | undefined {
  if (!sql) return undefined;
  // `(?!\()` pula `FROM (SELECT ...)`; o motor segue procurando o próximo FROM.
  const m = /\bfrom\s+(?!\()("?[A-Za-z_][\w$]*"?(?:\s*\.\s*"?[A-Za-z_][\w$]*"?)*)/i.exec(sql);
  const bruto = m?.[1];
  if (!bruto) return undefined;
  const limpo = bruto.replace(/["\s]/g, '');
  return limpo === '' ? undefined : limpo;
}

/**
 * Id da conexão referenciado pelos args, quando houver.
 *
 * Quem orquestra usa isto para aquecer o cache de nomes ANTES de descrever o
 * passo (a busca é assíncrona; a descrição é pura).
 */
export function connectionIdOf(toolName: string, args: unknown): string | undefined {
  const rec = asRecord(args);
  if (!rec) return undefined;
  const direto = str(rec.connectionId);
  if (direto) return direto;
  // create_chart/update_chart carregam a conexão dentro do dataBinding.
  const binding = asRecord(rec.draftDataBinding);
  return binding ? str(binding.connectionId) : undefined;
}

/**
 * Pares `id -> nome` que podem ser aproveitados do próprio output, sem ir ao
 * banco. `list_connections` já traz a lista inteira: usar o que passou pela
 * frente é mais barato (e mais fiel ao que o agente viu) do que consultar.
 */
export function harvestConnectionNames(output: unknown): Array<[string, string]> {
  const rec = asRecord(output);
  const lista = rec?.connections;
  if (!Array.isArray(lista)) return [];
  const pares: Array<[string, string]> = [];
  for (const item of lista) {
    const c = asRecord(item);
    const id = str(c?.id);
    const nome = str(c?.name);
    // host/username/database ficam de fora de propósito: nada de infraestrutura
    // vaza para a trilha.
    if (id && nome) pares.push([id, nome]);
  }
  return pares;
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

type Cell = string | number | boolean | null;

/** Reduz qualquer valor a algo que a tabela da tela consegue mostrar. */
function cell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  const t = typeof value;
  if (t === 'string') {
    const s = value as string;
    return s.length > PREVIEW_MAX_CELL_CHARS ? `${s.slice(0, PREVIEW_MAX_CELL_CHARS)}…` : s;
  }
  if (t === 'number') return Number.isFinite(value as number) ? (value as number) : null;
  if (t === 'boolean') return value as boolean;
  if (t === 'bigint') return (value as bigint).toString();
  if (value instanceof Date) return value.toISOString();
  try {
    const s = JSON.stringify(value) ?? String(value);
    return s.length > PREVIEW_MAX_CELL_CHARS ? `${s.slice(0, PREVIEW_MAX_CELL_CHARS)}…` : s;
  } catch {
    return String(value);
  }
}

/**
 * Monta a amostra aplicando os DOIS tetos (linhas e colunas) e registrando o
 * tamanho real em `totalRows`. Exportada porque quem persiste a trilha aplica
 * exatamente o mesmo corte antes de gravar.
 */
export function buildPreview(
  columns: string[],
  rows: unknown[],
  totalRows?: number,
): ChatStepPreview | undefined {
  const cols = columns.filter((c) => typeof c === 'string').slice(0, PREVIEW_MAX_COLUMNS);
  if (cols.length === 0) return undefined;

  const amostra = rows.slice(0, PREVIEW_MAX_ROWS).map((row) => {
    if (Array.isArray(row)) return cols.map((_c, i) => cell(row[i]));
    const rec = asRecord(row);
    return cols.map((c, i) => cell(rec ? rec[c] : Array.isArray(row) ? row[i] : undefined));
  });

  const total = totalRows ?? rows.length;
  const preview: ChatStepPreview = { columns: cols, rows: amostra };
  // Só declara o total quando ele conta uma verdade que a amostra esconde.
  if (total > amostra.length) preview.totalRows = total;
  return preview;
}

/** Preview do `run_query`: `{ columns:[{name,dataTypeID}], rows: Record[] }`. */
function previewFromQueryResult(out: Record<string, unknown>): ChatStepPreview | undefined {
  const linhas = Array.isArray(out.rows) ? out.rows : [];
  let nomes: string[] = [];
  if (Array.isArray(out.columns)) {
    nomes = out.columns
      .map((c) => str(asRecord(c)?.name) ?? str(c))
      .filter((n): n is string => Boolean(n));
  }
  if (nomes.length === 0 && linhas.length > 0) {
    nomes = Object.keys(asRecord(linhas[0]) ?? {});
  }
  const total = num(out.rowCount) ?? linhas.length;
  return buildPreview(nomes, linhas, total);
}

/**
 * Preview do `preview_chart_data`: o `data` já vem no shape do contrato de
 * bloco, que muda conforme o gráfico (`table`, `series`, `categorical`,
 * `scalar`). Cada um vira a mesma tabelinha de conferência.
 */
function previewFromBlockData(out: Record<string, unknown>): ChatStepPreview | undefined {
  const data = out.data;

  // shape 'table': { columns: [{key,label}], rows: [{...}] }
  const tabela = asRecord(data);
  if (tabela && Array.isArray(tabela.columns) && Array.isArray(tabela.rows)) {
    const chaves = tabela.columns
      .map((c) => str(asRecord(c)?.key))
      .filter((k): k is string => Boolean(k));
    if (chaves.length > 0) return buildPreview(chaves, tabela.rows);
  }

  // shapes 'series' e 'categorical': array de objetos.
  if (Array.isArray(data)) {
    const primeira = asRecord(data[0]);
    if (!primeira) return undefined;
    return buildPreview(Object.keys(primeira), data);
  }

  // shape 'scalar': um objeto só ({ value, label, unit, delta }).
  if (tabela) {
    const chaves = Object.keys(tabela);
    if (chaves.length === 0) return undefined;
    return buildPreview(chaves, [tabela], 1);
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Alvo do passo
// ---------------------------------------------------------------------------

function targetOf(
  toolName: string,
  args: Record<string, unknown> | undefined,
  out: Record<string, unknown> | undefined,
  sql: string | undefined,
): string | undefined {
  switch (toolName) {
    case 'run_query':
      return mainTableOf(sql);

    case 'get_connection_schema': {
      const tabelas = args?.tables;
      if (Array.isArray(tabelas) && tabelas.length > 0) {
        const nomes = tabelas.map((t) => str(t)).filter((t): t is string => Boolean(t));
        if (nomes.length > 0) {
          return nomes.length <= 3
            ? nomes.join(', ')
            : `${nomes.slice(0, 3).join(', ')} +${nomes.length - 3}`;
        }
      }
      return str(args?.search) ?? str(args?.schema);
    }

    case 'activate_skill':
      return str(args?.slug) ?? str(out?.slug);

    case 'create_dashboard_share_link':
      // NUNCA o token nem a url: são credencial de acesso público.
      return str(args?.dashboardId);

    case 'list_connections':
    case 'list_charts':
    case 'list_dashboards':
    case 'list_catalog':
      return str(args?.search) ?? str(args?.type) ?? str(args?.catalogType);

    default: {
      // Artefatos: o TÍTULO é o alvo; o id é o fallback honesto quando o
      // retorno não traz título (é o caso de `delete_*`, que devolve só o id).
      const titulo = str(out?.title) ?? str(args?.title);
      if (titulo) return titulo;
      return str(args?.chartId) ?? str(args?.dashboardId) ?? str(out?.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Resumo do desfecho
// ---------------------------------------------------------------------------

function contagem(out: Record<string, unknown>, campo: string): number | undefined {
  const total = num(out.total);
  if (total !== undefined) return total;
  const lista = out[campo];
  return Array.isArray(lista) ? lista.length : undefined;
}

function summaryOf(
  toolName: string,
  out: Record<string, unknown>,
  rowCount: number | undefined,
  durationMs: number | undefined,
): string | undefined {
  const tempo = durationMs !== undefined ? formatDuration(durationMs) : undefined;

  switch (toolName) {
    case 'run_query': {
      const linhas =
        rowCount !== undefined
          ? `${plural(rowCount, 'linha', 'linhas')}${out.truncated === true ? ' (truncado)' : ''}`
          : undefined;
      return joinSummary([linhas, tempo]);
    }

    case 'preview_chart_data': {
      const estado = str(out.state);
      const shape = str(out.shape);
      const linhas = rowCount !== undefined ? plural(rowCount, 'linha', 'linhas') : undefined;
      if (estado === 'success') {
        return joinSummary([shape ? `pré-visualização ${shape}` : 'pré-visualização ok', linhas, tempo]);
      }
      return joinSummary(['pré-visualização falhou', tempo]);
    }

    case 'list_connections': {
      const n = contagem(out, 'connections');
      return n === undefined ? undefined : plural(n, 'conexão', 'conexões');
    }
    case 'list_charts': {
      const n = contagem(out, 'charts');
      return n === undefined ? undefined : plural(n, 'gráfico', 'gráficos');
    }
    case 'list_dashboards': {
      const n = contagem(out, 'dashboards');
      return n === undefined ? undefined : plural(n, 'dashboard', 'dashboards');
    }
    case 'list_catalog': {
      const n = contagem(out, 'blocks');
      return n === undefined ? undefined : plural(n, 'tipo de bloco', 'tipos de bloco');
    }

    case 'get_connection_schema': {
      const tabelas = Array.isArray(out.tables) ? out.tables.length : undefined;
      if (str(out.mode) === 'columns') {
        const colunas = num(out.totalColumns);
        return joinSummary([
          tabelas !== undefined ? plural(tabelas, 'tabela', 'tabelas') : undefined,
          colunas !== undefined ? plural(colunas, 'coluna', 'colunas') : undefined,
        ]);
      }
      const total = num(out.total) ?? tabelas;
      return total === undefined ? undefined : plural(total, 'tabela', 'tabelas');
    }

    case 'create_chart':
      return 'gráfico criado';
    case 'update_chart':
      return 'gráfico atualizado';
    case 'publish_chart':
      return 'gráfico publicado';
    case 'unpublish_chart':
      return 'gráfico despublicado';
    case 'delete_chart':
      return 'gráfico excluído';
    case 'create_dashboard':
      return 'dashboard criado';
    case 'update_dashboard':
      return 'dashboard atualizado';
    case 'add_chart_to_dashboard':
      return 'gráfico adicionado ao dashboard';
    case 'publish_dashboard':
      return 'dashboard publicado';
    case 'unpublish_dashboard':
      return 'dashboard despublicado';
    case 'delete_dashboard':
      return 'dashboard excluído';

    case 'create_dashboard_share_link':
      // Sem token, sem url: é uma credencial de acesso público.
      return str(out.warning) ? 'link gerado (dashboard em rascunho)' : 'link gerado';

    case 'activate_skill':
      return 'skill ativada';

    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// A função principal
// ---------------------------------------------------------------------------

function build(
  toolName: string,
  args: unknown,
  output: unknown,
  durationMs: number | undefined,
  opts: DescribeOptions,
): AuditFields {
  const a = asRecord(args);
  const o = asRecord(output);

  const sql = sqlOf(toolName, a);
  const fields: AuditFields = {
    title: toolTitle(toolName),
    isDestructive: isDestructiveTool(toolName),
  };

  const alvo = targetOf(toolName, a, o, sql);
  if (alvo) fields.target = alvo;
  if (sql) fields.sql = sql;

  const connectionId = connectionIdOf(toolName, args);
  if (connectionId && opts.connectionName) {
    const nome = opts.connectionName(connectionId);
    if (nome) fields.connectionName = nome;
  }

  // Fase `call`: a chamada saiu e ainda não voltou. Sem output não há desfecho
  // a resumir — mas o SQL e a conexão já aparecem na tela, que é o ponto.
  if (output === undefined) {
    fields.status = 'running';
    return fields;
  }

  const erro = toolErrorMessage(output);
  if (erro) {
    fields.status = 'error';
    fields.errorMessage = erro;
    if (durationMs !== undefined) fields.durationMs = durationMs;
    fields.summary = 'falhou';
    return fields;
  }

  fields.status = 'ok';

  // Duração: a informada pela PRÓPRIA ferramenta ganha da medida por fora —
  // `run_query` cronometra a execução no banco, que é o número que interessa
  // ao auditor (o nosso inclui serialização e ida-e-volta do adapter).
  const meta = asRecord(o?.meta);
  const propria = num(o?.durationMs) ?? num(meta?.durationMs);
  const duracao = propria ?? durationMs;
  if (duracao !== undefined) fields.durationMs = duracao;

  if (toolName === 'run_query' && o) {
    const linhas = Array.isArray(o.rows) ? o.rows : [];
    const rowCount = num(o.rowCount) ?? linhas.length;
    fields.rowCount = rowCount;
    const preview = previewFromQueryResult(o);
    if (preview) fields.preview = preview;
    fields.summary = summaryOf(toolName, o, rowCount, duracao);
    return fields;
  }

  if (toolName === 'preview_chart_data' && o) {
    const rowCount = num(meta?.rowCount) ?? (Array.isArray(o.data) ? o.data.length : undefined);
    if (rowCount !== undefined) fields.rowCount = rowCount;
    const preview = previewFromBlockData(o);
    if (preview) fields.preview = preview;
    fields.summary = summaryOf(toolName, o, rowCount, duracao);
    return fields;
  }

  if (o) fields.summary = summaryOf(toolName, o, undefined, duracao);
  return fields;
}

/**
 * Traduz um passo de ferramenta nos campos de auditoria do `ChatToolStepEvent`.
 *
 * Pura: mesmos argumentos, mesmo resultado. `output === undefined` descreve a
 * fase `call` (status `running`); com output, descreve a fase `result`.
 *
 * NUNCA lança. Um output malformado (string, null, array, objeto com formato
 * inesperado) degrada para o rótulo da ferramenta — porque derrubar o turno
 * para proteger uma legenda seria trocar o essencial pelo acessório.
 */
export function describeToolStep(
  toolName: string,
  args: unknown,
  output: unknown,
  durationMs?: number,
  opts: DescribeOptions = {},
): AuditFields {
  try {
    return build(toolName, args, output, durationMs, opts);
  } catch {
    return {
      title: toolTitle(toolName),
      isDestructive: isDestructiveTool(toolName),
      status: output === undefined ? 'running' : 'ok',
      ...(durationMs !== undefined ? { durationMs } : {}),
    };
  }
}

/**
 * Frase pronta para o `chat:phase` de fase `tool` — ex.: "Executando consulta ·
 * teste". Vem montada do servidor porque só ele conhece o alvo real da chamada.
 */
export function stepLabel(fields: AuditFields, toolName: string): string {
  const titulo = fields.title ?? toolTitle(toolName);
  const complemento = fields.connectionName ?? fields.target;
  return complemento ? `${titulo} · ${complemento}` : titulo;
}

// ---------------------------------------------------------------------------
// Artefatos
// ---------------------------------------------------------------------------

export interface ArtifactTouch {
  kind: 'chart' | 'dashboard';
  id: string;
  title: string;
  action: ChatArtifactAction;
}

const ARTIFACT_BY_TOOL: Readonly<
  Record<string, { kind: 'chart' | 'dashboard'; action: ChatArtifactAction }>
> = {
  create_chart: { kind: 'chart', action: 'created' },
  update_chart: { kind: 'chart', action: 'updated' },
  publish_chart: { kind: 'chart', action: 'published' },
  unpublish_chart: { kind: 'chart', action: 'unpublished' },
  delete_chart: { kind: 'chart', action: 'deleted' },
  create_dashboard: { kind: 'dashboard', action: 'created' },
  update_dashboard: { kind: 'dashboard', action: 'updated' },
  add_chart_to_dashboard: { kind: 'dashboard', action: 'updated' },
  publish_dashboard: { kind: 'dashboard', action: 'published' },
  unpublish_dashboard: { kind: 'dashboard', action: 'unpublished' },
  delete_dashboard: { kind: 'dashboard', action: 'deleted' },
};

/**
 * O artefato que este passo tocou, ou `null` quando o passo não mexeu em nada
 * (leitura) ou falhou.
 *
 * Vira um cartão acionável na resposta ("Abrir dashboard"). Sem isso o agente
 * anuncia em texto que criou algo e o usuário precisa caçar o item na
 * listagem — o trabalho fica pronto e some.
 *
 * `titleHint` cobre `delete_*`, que devolve só `{ id, deleted: true }`: o
 * título vem do que o turno já sabia sobre aquele id.
 */
export function artifactTouchedBy(
  toolName: string,
  args: unknown,
  output: unknown,
  titleHint?: (id: string) => string | undefined,
): ArtifactTouch | null {
  const mapa = ARTIFACT_BY_TOOL[toolName];
  if (!mapa) return null;
  if (toolErrorMessage(output)) return null; // nada mudou, nada a anunciar

  const o = asRecord(output);
  const a = asRecord(args);
  const id =
    str(o?.id) ??
    (mapa.kind === 'chart' ? str(a?.chartId) : str(a?.dashboardId)) ??
    str(o?.dashboardId) ??
    str(o?.chartId);
  if (!id) return null;

  const title = str(o?.title) ?? titleHint?.(id) ?? str(a?.title) ?? id;
  return { kind: mapa.kind, id, title, action: mapa.action };
}

// ---------------------------------------------------------------------------
// Gráfico renderizável
// ---------------------------------------------------------------------------

/** O que a tela precisa saber sobre um gráfico além dos dados. */
export interface ChartMeta {
  chartId: string;
  title: string;
  catalogType: string;
  props?: Record<string, unknown>;
  dataBinding?: unknown;
}

/**
 * Metadados de gráfico presentes no retorno de `create_chart`/`update_chart`
 * (`serializeChart`). Esses dois trazem título, tipo e binding — mas NÃO os
 * dados. Verificado nos handlers do MCP.
 */
export function chartMetaFrom(toolName: string, output: unknown): ChartMeta | null {
  if (toolName !== 'create_chart' && toolName !== 'update_chart') return null;
  const o = asRecord(output);
  if (!o || toolErrorMessage(output)) return null;
  const chartId = str(o.id);
  const title = str(o.title);
  const catalogType = str(o.catalogType);
  if (!chartId || !title || !catalogType) return null;
  const meta: ChartMeta = { chartId, title, catalogType };
  const props = asRecord(o.draftProps) ?? asRecord(o.publishedProps);
  if (props) meta.props = props;
  const binding = o.draftDataBinding ?? o.publishedDataBinding;
  if (binding) meta.dataBinding = binding;
  return meta;
}

/** Id do chart pré-visualizado (o `blockId` do BlockDataResult é o chartId). */
export function previewedChartId(toolName: string, args: unknown, output: unknown): string | undefined {
  if (toolName !== 'preview_chart_data') return undefined;
  return str(asRecord(output)?.blockId) ?? str(asRecord(args)?.chartId);
}

/**
 * O output de `preview_chart_data` renderiza?
 *
 * É a única ferramenta cujo retorno traz DADOS no shape do contrato de bloco
 * (`BlockDataResult`) — `create_chart`/`update_chart` devolvem só a definição.
 * Por isso o `chat:chart` nasce do encontro dos dois: metadados de um lado,
 * dados do outro.
 */
export function isRenderableChartData(output: unknown): boolean {
  const o = asRecord(output);
  return !!o && str(o.state) === 'success' && o.data !== undefined;
}

/**
 * Gráficos DEFINIDOS no turno que ainda não chegaram à tela com dados.
 *
 * O encontro descrito acima tem um lado frágil: `preview_chart_data` é
 * OPCIONAL para o agente. Quando ele cria o gráfico e responde sem
 * pré-visualizar, a definição fica órfã, o `chat:chart` não sai e o usuário
 * recebe o cartão "Abrir gráfico" sem gráfico nenhum — ou seja, o que a tela
 * mostra passa a depender da rota que o modelo escolheu.
 *
 * Esta função é o CRITÉRIO de quem o servidor precisa materializar por conta
 * própria. Ela mora aqui, separada da orquestração, porque é a parte que dá
 * para verificar sem banco, sem socket e sem agente.
 *
 * Três recusas, cada uma por um motivo:
 *   - `jaEmitidos`: o preview já mandou o gráfico daquele id NESTE turno.
 *     Emitir de novo anexaria dois gráficos à mesma resposta.
 *   - sem `dataBinding`: não há query para executar — mandar o servidor tentar
 *     seria uma ida ao banco garantidamente inútil.
 *   - id repetido: `create_chart` seguido de `update_chart` do MESMO gráfico o
 *     define duas vezes. Vale a ÚLTIMA definição (a que o usuário vai ver), uma
 *     vez só.
 */
export function chartsAwaitingData(
  definidos: Iterable<ChartMeta>,
  jaEmitidos: ReadonlySet<string> = new Set(),
): ChartMeta[] {
  const pendentes = new Map<string, ChartMeta>();
  for (const meta of definidos) {
    if (!meta || typeof meta.chartId !== 'string' || meta.chartId === '') continue;
    if (jaEmitidos.has(meta.chartId)) continue;
    if (meta.dataBinding === undefined || meta.dataBinding === null) continue;
    pendentes.set(meta.chartId, meta);
  }
  return [...pendentes.values()];
}

/**
 * O gráfico cabe no que é razoável trafegar por socket e gravar na mensagem?
 *
 * Medido em caracteres do JSON — a mesma moeda do teto de `output` do turno.
 *
 * Verificado antes de escrever isto: NADA no caminho dos dados limita esse
 * tamanho. `executeBlockData` não recebe `maxRows`; o `dataBinding` do chart só
 * tem `ttlSeconds` (não tem `maxRows`); o `maxRows` declarado nos manifestos do
 * catálogo não é lido por ninguém no servidor. O único teto vigente é o do
 * pg-runner (`PG_RUNNER_MAX_ROWS`, 50 000 linhas por padrão), que existe para
 * não estourar a memória do processo — não para caber numa bolha de conversa.
 *
 * Recusa em vez de cortar: um gráfico truncado é um gráfico ERRADO — mostraria
 * meia série com cara de série inteira, que é pior do que não mostrar. Sem o
 * gráfico, o usuário volta ao cartão "Abrir gráfico", que é honesto.
 */
export function chartDataFitsBudget(resultado: unknown, maxChars: number): boolean {
  try {
    const texto = JSON.stringify(resultado);
    return typeof texto === 'string' && texto.length <= maxChars;
  } catch {
    // Circular ou BigInt: não serializa — não vai pelo fio nem para o banco.
    return false;
  }
}
