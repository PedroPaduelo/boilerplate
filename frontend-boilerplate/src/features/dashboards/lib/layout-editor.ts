/**
 * Operações PURAS de edição do LAYOUT de um dashboard (T-G2). Sem React —
 * 100% testáveis isoladas. Todas retornam um NOVO layout (imutável); nunca
 * mutam o argumento.
 *
 * O editor humano do MVP é ENXUTO e SEM drag-and-drop (decisão do usuário):
 * reordenar/mover/remover blocos, ajustar span, editar blocos narrativos
 * (title/rich_text), ajustar filtros e o `dataBinding` de um bloco. O grosso do
 * layout é montado pelo agente (T-H) — aqui é o ajuste fino + publish.
 *
 * Fonte da verdade do formato: `@dashboards/contracts` (doc 20). Antes de salvar
 * (PATCH /dashboards/:id) o layout é validado contra o contrato via
 * `validateLayoutForSave` para dar feedback claro de erro ANTES de bater na API.
 *
 * NOTA (gotcha T-I/T-E): os tipos de `@dashboards/contracts` resolvem para `any`
 * no FE (`json-schema-to-ts` não é dep do FE), então tipamos localmente os
 * elementos do layout (subset fiel ao contrato).
 */
import { validateDashboardLayout, formatErrors } from '@dashboards/contracts';
/**
 * Import do MÓDULO, não do barril do render-engine: este arquivo é puro (sem
 * React) e o barril arrasta o registry — que varre o catálogo inteiro por glob.
 * A altura é a mesma política do motor; só o caminho é mais curto.
 */
import {
  BLOCK_HEIGHT_PX_MAX,
  BLOCK_HEIGHT_PX_MIN,
  hasDeclaredHeight,
  type BlockHeight,
} from '@/shared/render-engine/lib/block-sizing';
import type { DashFilter, DashFilterType } from './dashboard-filters';

export type { DashFilter, DashFilterType };
export type { BlockHeight };

/** Parâmetro de binding (contrato: requer filterId E as). */
export interface EditorBindingParam {
  filterId: string;
  as: string;
}

/** dataBinding de um bloco de dados (contrato: requer connectionId E query). */
export interface EditorDataBinding {
  connectionId: string;
  query: string;
  params?: EditorBindingParam[];
  transform?: unknown;
  ttlSeconds?: number;
}

export interface EditorBlock {
  id: string;
  type: string;
  span: number;
  /**
   * Altura própria do bloco (degrau ou px). Sobrepõe a da linha — exceção
   * pontual, não o caminho normal (ver `EditorRow.height`).
   */
  height?: BlockHeight;
  /** Título do card. O backend o preenche com o título do Chart referenciado. */
  title?: string;
  /** Subtítulo do card (linha de apoio no cabeçalho). */
  subtitle?: string;
  /**
   * Apresentação do card (doc 41). O editor humano ainda não os edita — mas
   * PRECISA carregá-los, pelo mesmo motivo de `blocks` e `tabs`: sem eles,
   * abrir e salvar apagaria o que o agente escreveu, em silêncio.
   */
  description?: string;
  unit?: string;
  icon?: string;
  emphasis?: string;
  /** Linhas ocupadas em containers de mosaico. */
  rowSpan?: number;
  props?: Record<string, unknown>;
  dataBinding?: EditorDataBinding;
  /**
   * Sub-blocos de um bloco CONTAINER (`section`, `grid`). O editor humano não
   * os edita — mas PRECISA carregá-los, porque `sanitizeLayoutForSave`
   * reconstrói o bloco campo a campo: sem isto, abrir e salvar um dashboard
   * montado pelo agente apagaria em silêncio tudo o que estivesse dentro de
   * uma seção. É o mesmo motivo que trouxe `tabs` para este tipo.
   */
  blocks?: EditorBlock[];
}

export interface EditorRow {
  id: string;
  title?: string;
  /** Uma linha sobre o que a seção mostra (doc 41). */
  description?: string;
  /** Faixas declaradas da linha (1..6). */
  columns?: number;
  /** `equal` (padrão) ou `span` — ver `RowItemSizing` no contrato. */
  itemSizing?: string;
  /**
   * Altura da LINHA (degrau nomeado ou px). A linha é a unidade de decisão de
   * altura: ela escolhe um tamanho e todos os seus blocos ficam com ele — é o
   * que impede um gráfico terminar maior que o vizinho. Ausente = o motor
   * deriva dos tipos que a linha contém.
   */
  height?: BlockHeight;
  blocks: EditorBlock[];
}

/**
 * Aba do dashboard (doc 40) — referencia rows por id, não as contém.
 *
 * Os campos de APRESENTAÇÃO (ícone, descrição, grupo, ordem, nível, divisor)
 * estão aqui pelo motivo que este arquivo repete: `normalizeLayout` e
 * `sanitizeLayoutForSave` reconstroem o layout campo a campo. Uma chave que o
 * editor não conhece é DESCARTADA no save — então, sem estas linhas, bastava
 * abrir no editor e clicar em Salvar para o dashboard perder os ícones, os
 * grupos e a ordem que o agente montou. Sem erro, sem aviso.
 */
export interface EditorTab {
  id: string;
  title: string;
  rowIds: string[];
  icon?: string;
  description?: string;
  group?: string;
  order?: number;
  level?: 1 | 2;
  divider?: boolean;
}

/** Preferência de aparência do dashboard (doc 41). */
export interface EditorTheme {
  colorMode?: string;
  accent?: string;
  palette?: string;
}

export interface EditorLayout {
  filters: DashFilter[];
  rows: EditorRow[];
  /**
   * OPCIONAL — ausente em layout legado. É *decisivo* que este campo exista
   * aqui: `normalizeLayout` e `sanitizeLayoutForSave` RECONSTROEM o layout campo
   * a campo, então uma chave que o editor não conhece é descartada. Sem `tabs`
   * neste tipo, bastaria abrir e salvar um dashboard no editor para as abas
   * SUMIREM — perda de dados silenciosa, sem erro nenhum na tela.
   */
  tabs?: EditorTab[];
  /** Aparência declarada pelo dashboard (doc 41). Mesma regra das abas. */
  theme?: EditorTheme;
}

export type MoveDirection = 'up' | 'down';

/* --------------------------------------------------------------- ids ------ */

let idCounter = 0;
/** Gera um id estável-o-suficiente para itens novos criados no editor. */
function genId(prefix: string): string {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${rand}`;
}

/* ---------------------------------------------------- normalização -------- */

interface RawBlock {
  id?: unknown;
  /** Forma legada de alguns seeds (usa `blockId` no lugar de `id`). */
  blockId?: unknown;
  type?: unknown;
  span?: unknown;
  height?: unknown;
  rowSpan?: unknown;
  title?: unknown;
  subtitle?: unknown;
  description?: unknown;
  unit?: unknown;
  icon?: unknown;
  emphasis?: unknown;
  props?: unknown;
  /** Forma legada: `chartId` no topo do bloco (o contrato espera em `props.chartId`). */
  chartId?: unknown;
  dataBinding?: unknown;
  blocks?: unknown;
}
interface RawRow {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  columns?: unknown;
  itemSizing?: unknown;
  height?: unknown;
  blocks?: unknown;
}

function normalizeBinding(raw: unknown): EditorDataBinding | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as Record<string, unknown>;
  const params = Array.isArray(b.params)
    ? (b.params as Record<string, unknown>[]).map((p) => ({
        filterId: typeof p.filterId === 'string' ? p.filterId : '',
        as: typeof p.as === 'string' ? p.as : '',
      }))
    : undefined;
  return {
    connectionId: typeof b.connectionId === 'string' ? b.connectionId : '',
    query: typeof b.query === 'string' ? b.query : '',
    ...(params && params.length > 0 ? { params } : {}),
    ...(b.transform !== undefined ? { transform: b.transform } : {}),
    ...(typeof b.ttlSeconds === 'number' ? { ttlSeconds: b.ttlSeconds } : {}),
  };
}

/** Texto do bloco (título/subtítulo): só entra se tiver conteúdo. */
function normalizeText(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : undefined;
}

function normalizeBlock(raw: RawBlock): EditorBlock {
  const span = typeof raw.span === 'number' ? raw.span : 12;
  const id =
    typeof raw.id === 'string'
      ? raw.id
      : typeof raw.blockId === 'string'
        ? raw.blockId
        : genId('blk');
  // Preserva a referência ao chart: o contrato a espera em `props.chartId` (forma
  // que o backend lê em collectChartRefs); seeds legados a põem no topo do bloco.
  const props: Record<string, unknown> = {
    ...(raw.props && typeof raw.props === 'object'
      ? (raw.props as Record<string, unknown>)
      : {}),
  };
  if (typeof raw.chartId === 'string' && props.chartId === undefined) {
    props.chartId = raw.chartId;
  }
  const title = normalizeText(raw.title);
  const subtitle = normalizeText(raw.subtitle);
  const children = Array.isArray(raw.blocks)
    ? (raw.blocks as RawBlock[]).map(normalizeBlock)
    : [];
  return {
    id,
    type: typeof raw.type === 'string' ? raw.type : 'title',
    span: clampSpan(span),
    ...(hasDeclaredHeight(raw.height) ? { height: raw.height as BlockHeight } : {}),
    ...(typeof raw.rowSpan === 'number' && raw.rowSpan >= 1
      ? { rowSpan: Math.round(raw.rowSpan) }
      : {}),
    ...(title ? { title } : {}),
    ...(subtitle ? { subtitle } : {}),
    // Apresentação (doc 41): carregada como veio. O editor não a valida — quem
    // valida é o contrato, no save; o papel daqui é só NÃO PERDER.
    ...(normalizeText(raw.description) ? { description: raw.description as string } : {}),
    ...(normalizeText(raw.unit) ? { unit: raw.unit as string } : {}),
    ...(normalizeText(raw.icon) ? { icon: raw.icon as string } : {}),
    ...(normalizeText(raw.emphasis) ? { emphasis: raw.emphasis as string } : {}),
    ...(Object.keys(props).length > 0 ? { props } : {}),
    ...(raw.dataBinding ? { dataBinding: normalizeBinding(raw.dataBinding) } : {}),
    ...(children.length > 0 ? { blocks: children } : {}),
  };
}

/**
 * Normaliza um layout cru (vindo da API / `any` do contrato) para a forma
 * editável `EditorLayout`, garantindo arrays e clamps. Idempotente.
 */
export function normalizeLayout(raw: unknown): EditorLayout {
  const l = (raw && typeof raw === 'object' ? raw : {}) as {
    filters?: unknown;
    rows?: unknown;
  };
  const filters: DashFilter[] = Array.isArray(l.filters)
    ? (l.filters as Record<string, unknown>[]).map((f) => ({
        id: typeof f.id === 'string' ? f.id : genId('filter'),
        type: (typeof f.type === 'string' ? f.type : 'select') as DashFilterType,
        label: typeof f.label === 'string' ? f.label : '',
        ...(f.default !== undefined ? { default: f.default } : {}),
      }))
    : [];
  const rows: EditorRow[] = Array.isArray(l.rows)
    ? (l.rows as RawRow[]).map((r) => ({
        id: typeof r.id === 'string' ? r.id : genId('row'),
        ...(typeof r.title === 'string' ? { title: r.title } : {}),
        ...(normalizeText(r.description) ? { description: r.description as string } : {}),
        ...(typeof r.columns === 'number' ? { columns: r.columns } : {}),
        ...(normalizeText(r.itemSizing) ? { itemSizing: r.itemSizing as string } : {}),
        ...(hasDeclaredHeight(r.height) ? { height: r.height as BlockHeight } : {}),
        blocks: Array.isArray(r.blocks)
          ? (r.blocks as RawBlock[]).map(normalizeBlock)
          : [],
      }))
    : [];

  // ABAS (doc 40). Só entram no layout de trabalho quando existem de verdade:
  // um layout legado tem de continuar saindo daqui SEM a chave `tabs`, senão o
  // dirty-state acusaria alteração ("{} → tabs: []") em todo dashboard antigo
  // que fosse apenas aberto no editor.
  const rawTabs = (l as { tabs?: unknown }).tabs;
  const tabs: EditorTab[] = Array.isArray(rawTabs)
    ? (rawTabs as Record<string, unknown>[]).map((t, index) => ({
        id: typeof t.id === 'string' && t.id ? t.id : genId('tab'),
        title: typeof t.title === 'string' && t.title ? t.title : `Aba ${index + 1}`,
        rowIds: Array.isArray(t.rowIds)
          ? (t.rowIds as unknown[]).filter((r): r is string => typeof r === 'string')
          : [],
        // Apresentação da aba (docs 40/41) — carregada tal como veio.
        ...(normalizeText(t.icon) ? { icon: t.icon as string } : {}),
        ...(normalizeText(t.description) ? { description: t.description as string } : {}),
        ...(normalizeText(t.group) ? { group: t.group as string } : {}),
        ...(typeof t.order === 'number' ? { order: t.order } : {}),
        ...(t.level === 2 ? { level: 2 as const } : {}),
        ...(t.divider === true ? { divider: true } : {}),
      }))
    : [];

  // TEMA (doc 41): mesma regra das abas — só entra quando existe de verdade,
  // senão todo dashboard antigo passaria a acusar "alterado" ao ser aberto,
  // porque o dirty-state compara a forma canônica (`{} → theme: {}`).
  const rawTheme = (l as { theme?: unknown }).theme;
  const theme: EditorTheme | undefined =
    rawTheme && typeof rawTheme === 'object'
      ? (() => {
          const t = rawTheme as Record<string, unknown>;
          const next: EditorTheme = {
            ...(typeof t.colorMode === 'string' ? { colorMode: t.colorMode } : {}),
            ...(typeof t.accent === 'string' ? { accent: t.accent } : {}),
            ...(typeof t.palette === 'string' ? { palette: t.palette } : {}),
          };
          return Object.keys(next).length > 0 ? next : undefined;
        })()
      : undefined;

  return {
    filters,
    rows,
    ...(tabs.length > 0 ? { tabs } : {}),
    ...(theme ? { theme } : {}),
  };
}

/* ------------------------------------------------------- helpers ---------- */

export function clampSpan(span: number): number {
  if (!Number.isFinite(span)) return 12;
  return Math.max(1, Math.min(12, Math.round(span)));
}

/**
 * Normaliza uma altura antes de gravá-la no layout: degrau passa direto,
 * número é grampeado na faixa do contrato (120..1600).
 *
 * O grampeamento acontece AQUI, na escrita, e não só na leitura do motor:
 * assim o valor que vai para o JSON já é válido, e o usuário nunca descobre um
 * "layout inválido" no clique de Salvar por ter digitado 4000 num campo.
 */
export function normalizeHeight(height: BlockHeight): BlockHeight {
  if (typeof height !== 'number') return height;
  const rounded = Math.round(height);
  if (!Number.isFinite(rounded)) return BLOCK_HEIGHT_PX_MIN;
  return Math.max(BLOCK_HEIGHT_PX_MIN, Math.min(BLOCK_HEIGHT_PX_MAX, rounded));
}

export interface BlockLocation {
  rowIndex: number;
  blockIndex: number;
  row: EditorRow;
  block: EditorBlock;
}

/** Localiza um bloco (e sua row) no layout. `null` se não encontrado. */
export function findBlock(layout: EditorLayout, blockId: string): BlockLocation | null {
  for (let rowIndex = 0; rowIndex < layout.rows.length; rowIndex += 1) {
    const row = layout.rows[rowIndex];
    const blockIndex = row.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex >= 0) {
      return { rowIndex, blockIndex, row, block: row.blocks[blockIndex] };
    }
  }
  return null;
}

/** Mapeia os blocos de uma row (por id) preservando as demais. */
function mapRow(
  layout: EditorLayout,
  rowId: string,
  fn: (row: EditorRow) => EditorRow,
): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.map((row) => (row.id === rowId ? fn(row) : row)),
  };
}

/* --------------------------------------------------- mutações de bloco ---- */

/** Reordena um bloco DENTRO da sua row (mover ↑/↓). No-op nas bordas. */
export function moveBlockWithinRow(
  layout: EditorLayout,
  rowId: string,
  blockId: string,
  direction: MoveDirection,
): EditorLayout {
  return mapRow(layout, rowId, (row) => {
    const idx = row.blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return row;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= row.blocks.length) return row;
    const blocks = [...row.blocks];
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    return { ...row, blocks };
  });
}

/** id da row adjacente (acima/abaixo), ou `null` se não houver. */
export function adjacentRowId(
  layout: EditorLayout,
  rowId: string,
  direction: MoveDirection,
): string | null {
  const idx = layout.rows.findIndex((r) => r.id === rowId);
  if (idx < 0) return null;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= layout.rows.length) return null;
  return layout.rows[target].id;
}

/** Move um bloco para outra row (ENTRE rows). `position` default = fim da row destino. */
export function moveBlockToRow(
  layout: EditorLayout,
  blockId: string,
  targetRowId: string,
  position?: number,
): EditorLayout {
  const loc = findBlock(layout, blockId);
  if (!loc || loc.row.id === targetRowId) return layout;
  const block = loc.block;

  const rows = layout.rows.map((row) => {
    if (row.id === loc.row.id) {
      return { ...row, blocks: row.blocks.filter((b) => b.id !== blockId) };
    }
    if (row.id === targetRowId) {
      const blocks = [...row.blocks];
      const at =
        position === undefined
          ? blocks.length
          : Math.max(0, Math.min(position, blocks.length));
      blocks.splice(at, 0, block);
      return { ...row, blocks };
    }
    return row;
  });
  return { ...layout, rows };
}

/** Move um bloco para a row adjacente (acima/abaixo). No-op nas bordas. */
export function moveBlockToAdjacentRow(
  layout: EditorLayout,
  blockId: string,
  direction: MoveDirection,
): EditorLayout {
  const loc = findBlock(layout, blockId);
  if (!loc) return layout;
  const targetId = adjacentRowId(layout, loc.row.id, direction);
  if (!targetId) return layout;
  return moveBlockToRow(layout, blockId, targetId);
}

/** Remove um bloco do layout (de qualquer row). */
export function removeBlock(layout: EditorLayout, blockId: string): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.map((row) => ({
      ...row,
      blocks: row.blocks.filter((b) => b.id !== blockId),
    })),
  };
}

/** Ajusta a largura (span 1..12) de um bloco. */
export function setBlockSpan(
  layout: EditorLayout,
  blockId: string,
  span: number,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => ({ ...block, span: clampSpan(span) }));
}

/**
 * Ajusta a ALTURA declarada de um bloco. `undefined` remove a declaração — e
 * remover é diferente de zerar: o bloco volta a herdar a altura da linha.
 */
export function setBlockHeight(
  layout: EditorLayout,
  blockId: string,
  height: BlockHeight | undefined,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => {
    const next: EditorBlock = { ...block };
    if (height === undefined) delete next.height;
    else next.height = normalizeHeight(height);
    return next;
  });
}

/**
 * Edita um TEXTO do cabeçalho do card (`title` / `subtitle`). Vazio REMOVE o
 * campo: um título em branco não é um título, e deixá-lo como `''` faria o
 * render mostrar um cabeçalho vazio em vez de cair no nome do tipo.
 */
export function setBlockText(
  layout: EditorLayout,
  blockId: string,
  field: 'title' | 'subtitle',
  value: string,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => {
    const next: EditorBlock = { ...block };
    if (value.trim() === '') delete next[field];
    else next[field] = value;
    return next;
  });
}

/**
 * Duplica um bloco, logo depois do original, na mesma linha.
 *
 * Id NOVO (e não uma cópia do original) porque o id é a chave por onde o
 * backend devolve os dados: dois blocos com o mesmo id receberiam o mesmo
 * resultado e o editor não saberia qual está editando. O resto — inclusive o
 * `dataBinding` — é copiado, que é justamente o ponto: duplicar existe para
 * quem vai trocar uma linha do SQL, não para recomeçar do zero.
 */
export function duplicateBlock(layout: EditorLayout, blockId: string): EditorLayout {
  const loc = findBlock(layout, blockId);
  if (!loc) return layout;
  const copy: EditorBlock = { ...loc.block, id: genId('blk') };
  return mapRow(layout, loc.row.id, (row) => {
    const blocks = [...row.blocks];
    blocks.splice(loc.blockIndex + 1, 0, copy);
    return { ...row, blocks };
  });
}

/** Substitui as `props` de um bloco (usado pelos editores narrativos). */
export function setBlockProps(
  layout: EditorLayout,
  blockId: string,
  props: Record<string, unknown>,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => ({ ...block, props }));
}

/** Mescla parcialmente as `props` de um bloco. */
export function updateBlockProps(
  layout: EditorLayout,
  blockId: string,
  patch: Record<string, unknown>,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => ({
    ...block,
    props: { ...(block.props ?? {}), ...patch },
  }));
}

/** Define (ou remove, passando `undefined`) o `dataBinding` de um bloco. */
export function setBlockDataBinding(
  layout: EditorLayout,
  blockId: string,
  binding: EditorDataBinding | undefined,
): EditorLayout {
  return patchBlock(layout, blockId, (block) => {
    const next: EditorBlock = { ...block };
    if (binding === undefined) delete next.dataBinding;
    else next.dataBinding = binding;
    return next;
  });
}

function patchBlock(
  layout: EditorLayout,
  blockId: string,
  fn: (block: EditorBlock) => EditorBlock,
): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.map((row) => ({
      ...row,
      blocks: row.blocks.map((block) => (block.id === blockId ? fn(block) : block)),
    })),
  };
}

/* ----------------------------------------------------- mutações de row ---- */

/**
 * Acrescenta uma row vazia ao final.
 *
 * `tabId` diz em qual aba a linha nasce. Se o layout tem abas e nenhuma aba for
 * informada, ela entra na PRIMEIRA — o mesmo critério do backend em
 * `add_chart_to_dashboard`: a linha nova precisa ser visível sem o usuário sair
 * procurando por ela. Layout sem abas ignora o parâmetro.
 */
export function addRow(
  layout: EditorLayout,
  title?: string,
  tabId?: string,
): EditorLayout {
  const row: EditorRow = { id: genId('row'), blocks: [], ...(title ? { title } : {}) };
  const next: EditorLayout = { ...layout, rows: [...layout.rows, row] };
  if (!next.tabs || next.tabs.length === 0) return next;

  const targetId =
    tabId && next.tabs.some((t) => t.id === tabId) ? tabId : next.tabs[0].id;
  return {
    ...next,
    tabs: next.tabs.map((tab) =>
      tab.id === targetId ? { ...tab, rowIds: [...tab.rowIds, row.id] } : tab,
    ),
  };
}

/**
 * Ajusta a ALTURA da linha. `undefined` remove a declaração e devolve a linha
 * à derivação automática (a altura que os tipos dela pedem).
 */
export function setRowHeight(
  layout: EditorLayout,
  rowId: string,
  height: BlockHeight | undefined,
): EditorLayout {
  return mapRow(layout, rowId, (row) => {
    const next: EditorRow = { ...row };
    if (height === undefined) delete next.height;
    else next.height = normalizeHeight(height);
    return next;
  });
}

/**
 * Reordena uma LINHA (↑/↓). No-op nas bordas.
 *
 * Quando há abas, quem manda na ordem de exibição é `tab.rowIds` (é ele que o
 * `layoutForTab` percorre) — então mover é trocar de lugar DENTRO da aba, e a
 * troca acontece entre linhas da MESMA aba. Reordenar o array `rows` global
 * nesse caso não mudaria nada na tela e ainda embaralharia linhas de abas
 * vizinhas. Sem abas, `rows` é a ordem, e é ele que muda.
 */
export function moveRow(
  layout: EditorLayout,
  rowId: string,
  direction: MoveDirection,
): EditorLayout {
  const tab = layout.tabs?.find((t) => t.rowIds.includes(rowId));
  if (tab) {
    const idx = tab.rowIds.indexOf(rowId);
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= tab.rowIds.length) return layout;
    const rowIds = [...tab.rowIds];
    [rowIds[idx], rowIds[target]] = [rowIds[target], rowIds[idx]];
    return {
      ...layout,
      tabs: layout.tabs?.map((t) => (t.id === tab.id ? { ...t, rowIds } : t)),
    };
  }

  const idx = layout.rows.findIndex((r) => r.id === rowId);
  if (idx < 0) return layout;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= layout.rows.length) return layout;
  const rows = [...layout.rows];
  [rows[idx], rows[target]] = [rows[target], rows[idx]];
  return { ...layout, rows };
}

/**
 * Remove uma row inteira (e seus blocos) — e o id dela das abas, senão a aba
 * ficaria referenciando uma linha inexistente.
 */
export function removeRow(layout: EditorLayout, rowId: string): EditorLayout {
  return {
    ...layout,
    rows: layout.rows.filter((r) => r.id !== rowId),
    ...(layout.tabs
      ? {
          tabs: layout.tabs.map((tab) => ({
            ...tab,
            rowIds: tab.rowIds.filter((id) => id !== rowId),
          })),
        }
      : {}),
  };
}

/* -------------------------------------------------- mutações de aba ------- */

/**
 * Cria uma aba.
 *
 * A PRIMEIRA aba criada num layout legado herda TODAS as rows existentes. Sem
 * isso, ligar abas num dashboard pronto jogaria todo o conteúdo para o limbo
 * das linhas órfãs — o normalizador do contrato o recuperaria na leitura, mas o
 * JSON salvo ficaria mentindo sobre a organização do dashboard.
 */
export function addTab(layout: EditorLayout, title?: string): EditorLayout {
  const isFirst = !layout.tabs || layout.tabs.length === 0;
  const tab: EditorTab = {
    id: genId('tab'),
    title:
      title?.trim() ||
      (isFirst ? 'Visão geral' : `Aba ${(layout.tabs?.length ?? 0) + 1}`),
    rowIds: isFirst ? layout.rows.map((row) => row.id) : [],
  };
  return { ...layout, tabs: [...(layout.tabs ?? []), tab] };
}

/** Renomeia uma aba. Título vazio é ignorado (aba sem nome é inacessível). */
export function renameTab(
  layout: EditorLayout,
  tabId: string,
  title: string,
): EditorLayout {
  if (!layout.tabs) return layout;
  return {
    ...layout,
    tabs: layout.tabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)),
  };
}

/** Reordena uma aba (↑/↓). No-op nas bordas. */
export function moveTab(
  layout: EditorLayout,
  tabId: string,
  direction: MoveDirection,
): EditorLayout {
  if (!layout.tabs) return layout;
  const idx = layout.tabs.findIndex((t) => t.id === tabId);
  if (idx < 0) return layout;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= layout.tabs.length) return layout;
  const tabs = [...layout.tabs];
  [tabs[idx], tabs[target]] = [tabs[target], tabs[idx]];
  return { ...layout, tabs };
}

/**
 * Remove uma aba — SEM remover as linhas dela.
 *
 * As linhas viram órfãs e o normalizador do contrato as recupera na primeira
 * aba. É proposital: apagar uma aba é um gesto de ORGANIZAÇÃO, e não pode
 * apagar de tabela o trabalho que estava dentro dela. Para excluir o conteúdo
 * existe o botão de remover linha. Removida a última aba, o layout volta a ser
 * legado (uma aba implícita com tudo).
 */
export function removeTab(layout: EditorLayout, tabId: string): EditorLayout {
  if (!layout.tabs) return layout;
  const tabs = layout.tabs.filter((t) => t.id !== tabId);
  if (tabs.length === 0) {
    // Sem nenhuma aba, o layout VOLTA ao formato legado: a chave `tabs` é
    // removida em vez de virar `[]`, senão o dado salvo carregaria um array
    // vazio que não significa nada e o dirty-state acusaria diferença.
    const rest: EditorLayout = { filters: layout.filters, rows: layout.rows };
    return rest;
  }
  // as rowIds da aba removida não são redistribuídas aqui: vira órfã e o
  // `resolveDashboardTabs` a devolve na primeira aba, num único lugar de regra.
  return { ...layout, tabs };
}

/** Move uma row para outra aba (remove das demais — row pertence a UMA aba). */
export function setRowTab(
  layout: EditorLayout,
  rowId: string,
  tabId: string,
): EditorLayout {
  if (!layout.tabs) return layout;
  return {
    ...layout,
    tabs: layout.tabs.map((tab) => {
      const without = tab.rowIds.filter((id) => id !== rowId);
      return tab.id === tabId
        ? { ...tab, rowIds: [...without, rowId] }
        : { ...tab, rowIds: without };
    }),
  };
}

/** Edita o título de uma row (vazio → remove o título). */
export function setRowTitle(
  layout: EditorLayout,
  rowId: string,
  title: string,
): EditorLayout {
  return mapRow(layout, rowId, (row) => {
    const next = { ...row };
    if (title.trim() === '') delete next.title;
    else next.title = title;
    return next;
  });
}

/* -------------------------------------------------- mutações de filtro ---- */

/** Adiciona um filtro novo (com defaults sensatos). */
export function addFilter(
  layout: EditorLayout,
  filter?: Partial<DashFilter>,
): EditorLayout {
  const f: DashFilter = {
    id: filter?.id ?? genId('filter'),
    type: filter?.type ?? 'select',
    label: filter?.label ?? 'Novo filtro',
    ...(filter?.default !== undefined ? { default: filter.default } : {}),
  };
  return { ...layout, filters: [...layout.filters, f] };
}

/** Remove um filtro pelo id. */
export function removeFilter(layout: EditorLayout, filterId: string): EditorLayout {
  return { ...layout, filters: layout.filters.filter((f) => f.id !== filterId) };
}

/** Edita parcialmente um filtro (id/label/type/default). */
export function updateFilter(
  layout: EditorLayout,
  filterId: string,
  patch: Partial<DashFilter>,
): EditorLayout {
  return {
    ...layout,
    filters: layout.filters.map((f) => (f.id === filterId ? { ...f, ...patch } : f)),
  };
}

/* -------------------------------------------------- save / validação ------ */

/**
 * Constrói o objeto de layout LIMPO para enviar à API — fiel ao contrato
 * (`additionalProperties: false`): só inclui as chaves opcionais quando têm
 * valor. Mantém connectionId/query/params como o usuário digitou (mesmo vazios)
 * para que a validação do contrato APONTE o problema (ex.: connectionId vazio →
 * minLength). Ordem de chaves determinística (estável p/ comparação de dirty).
 */
export function sanitizeLayoutForSave(layout: EditorLayout): {
  filters: unknown[];
  rows: unknown[];
  tabs?: unknown[];
  theme?: unknown;
} {
  const filters = layout.filters.map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    ...(f.default !== undefined ? { default: f.default } : {}),
  }));

  const rows = layout.rows.map((row) => ({
    id: row.id,
    ...(row.title !== undefined && row.title !== '' ? { title: row.title } : {}),
    ...(row.description ? { description: row.description } : {}),
    ...(hasDeclaredHeight(row.height) ? { height: row.height } : {}),
    ...(typeof row.columns === 'number' ? { columns: row.columns } : {}),
    ...(row.itemSizing ? { itemSizing: row.itemSizing } : {}),
    blocks: row.blocks.map(sanitizeBlock),
  }));

  // ABAS: só vão no payload quando existem. Um layout legado continua sendo
  // salvo como `{ filters, rows }` exatamente como antes — o contrato tem
  // `additionalProperties: false`, então mandar `tabs: []` num dashboard que
  // nunca teve abas seria acrescentar ruído ao dado salvo de todo mundo.
  //
  // `rowIds` é FILTRADO contra as rows que realmente existem: remover uma linha
  // pelo editor não pode deixar um id pendurado na aba (o normalizador do
  // contrato ignora id órfão na leitura, mas o dado salvo mentiria).
  const knownRowIds = new Set(layout.rows.map((row) => row.id));
  const tabs = (layout.tabs ?? []).map((tab) => ({
    id: tab.id,
    title: tab.title,
    rowIds: tab.rowIds.filter((rowId) => knownRowIds.has(rowId)),
    // ESCREVER TUDO O QUE FOI LIDO — a mesma regra do `sanitizeBlock`. Cada
    // campo ausente aqui é um campo que o editor apaga ao salvar.
    ...(tab.icon ? { icon: tab.icon } : {}),
    ...(tab.description ? { description: tab.description } : {}),
    ...(tab.group ? { group: tab.group } : {}),
    ...(typeof tab.order === 'number' ? { order: tab.order } : {}),
    ...(tab.level === 2 ? { level: 2 } : {}),
    ...(tab.divider ? { divider: true } : {}),
  }));

  const theme =
    layout.theme && Object.keys(layout.theme).length > 0 ? layout.theme : undefined;

  return {
    filters,
    rows,
    ...(tabs.length > 0 ? { tabs } : {}),
    ...(theme ? { theme } : {}),
  };
}

/**
 * Um bloco na forma do contrato.
 *
 * A regra aqui é ESCREVER TUDO O QUE FOI LIDO. Este objeto é construído campo a
 * campo, então toda chave que o normalizador conhece precisa aparecer nesta
 * função — senão a chave some do dado salvo, e some em SILÊNCIO: sem erro, sem
 * aviso, só um dashboard que perdeu o título dos cards (ou o conteúdo de uma
 * seção inteira) porque alguém abriu o editor e clicou em Salvar.
 *
 * Recursivo por causa dos containers: `blocks` dentro de `blocks`.
 */
function sanitizeBlock(block: EditorBlock): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: block.id,
    type: block.type,
    span: block.span,
  };
  if (hasDeclaredHeight(block.height)) out.height = block.height;
  if (typeof block.rowSpan === 'number' && block.rowSpan > 1) out.rowSpan = block.rowSpan;
  if (block.title) out.title = block.title;
  if (block.subtitle) out.subtitle = block.subtitle;
  if (block.description) out.description = block.description;
  if (block.unit) out.unit = block.unit;
  if (block.icon) out.icon = block.icon;
  if (block.emphasis) out.emphasis = block.emphasis;
  if (block.props && Object.keys(block.props).length > 0) out.props = block.props;
  if (block.dataBinding) out.dataBinding = sanitizeBinding(block.dataBinding);
  if (block.blocks && block.blocks.length > 0)
    out.blocks = block.blocks.map(sanitizeBlock);
  return out;
}

function sanitizeBinding(binding: EditorDataBinding): Record<string, unknown> {
  const out: Record<string, unknown> = {
    connectionId: binding.connectionId,
    query: binding.query,
  };
  if (binding.params && binding.params.length > 0) {
    out.params = binding.params.map((p) => ({ filterId: p.filterId, as: p.as }));
  }
  if (binding.transform !== undefined && binding.transform !== '') {
    out.transform = binding.transform;
  }
  if (binding.ttlSeconds !== undefined) out.ttlSeconds = binding.ttlSeconds;
  return out;
}

export interface LayoutValidationResult {
  valid: boolean;
  /** Layout limpo pronto para o PATCH (`{ filters, rows }`). */
  payload: { filters: unknown[]; rows: unknown[] };
  /** Mensagem de erro legível (do ajv) quando inválido. */
  error?: string;
}

/**
 * Valida o layout editado contra o CONTRATO COMPARTILHADO (doc 20) ANTES de
 * salvar — feedback de erro rápido e claro, sem round-trip à API. Espelha o
 * `assertValidLayout` do backend (mesma função `validateDashboardLayout`).
 */
export function validateLayoutForSave(layout: EditorLayout): LayoutValidationResult {
  const payload = sanitizeLayoutForSave(layout);
  const valid = validateDashboardLayout(payload) as boolean;
  return {
    valid,
    payload,
    ...(valid ? {} : { error: formatErrors(validateDashboardLayout.errors) }),
  };
}

/** Compara dois layouts pela forma canônica (sanitizada) — usado p/ dirty-state. */
export function layoutsEqual(a: EditorLayout, b: EditorLayout): boolean {
  return (
    JSON.stringify(sanitizeLayoutForSave(a)) === JSON.stringify(sanitizeLayoutForSave(b))
  );
}
