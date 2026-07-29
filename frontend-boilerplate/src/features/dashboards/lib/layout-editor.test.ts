import { describe, it, expect } from 'vitest';
import { dashboardLayoutFixture } from '@dashboards/contracts';
import {
  addFilter,
  addRow,
  adjacentRowId,
  clampSpan,
  findBlock,
  layoutsEqual,
  moveBlockToAdjacentRow,
  moveBlockToRow,
  moveBlockWithinRow,
  normalizeLayout,
  removeBlock,
  removeFilter,
  removeRow,
  sanitizeLayoutForSave,
  duplicateBlock,
  moveRow,
  setBlockDataBinding,
  setBlockHeight,
  setBlockText,
  setRowHeight,
  setBlockProps,
  setBlockSpan,
  setRowTitle,
  updateBlockProps,
  updateFilter,
  addTab,
  moveTab,
  removeTab,
  renameTab,
  setRowTab,
  validateLayoutForSave,
  type EditorLayout,
} from './layout-editor';

const base = (): EditorLayout => normalizeLayout(dashboardLayoutFixture);

describe('normalizeLayout', () => {
  it('coage o layout cru das fixtures para a forma editável', () => {
    const l = base();
    expect(l.filters.map((f) => f.id)).toEqual(['f_periodo', 'f_situacao']);
    expect(l.rows.map((r) => r.id)).toEqual(['row_intro', 'row_evolucao', 'row_detalhe']);
    expect(l.rows[0].blocks.map((b) => b.id)).toEqual([
      'blk_title',
      'blk_kpi_total',
      'blk_bar_mes',
    ]);
    // binding preservado nos blocos de dados, ausente nos narrativos
    expect(findBlock(l, 'blk_kpi_total')?.block.dataBinding?.connectionId).toBe(
      'conn_fazenda',
    );
    expect(findBlock(l, 'blk_title')?.block.dataBinding).toBeUndefined();
  });

  it('é idempotente (sanitize estável)', () => {
    const a = base();
    const b = normalizeLayout(sanitizeLayoutForSave(a));
    expect(layoutsEqual(a, b)).toBe(true);
  });

  it('tolera entrada inválida (objeto vazio)', () => {
    const l = normalizeLayout(undefined);
    expect(l).toEqual({ filters: [], rows: [] });
  });
});

describe('reordenar blocos', () => {
  it('moveBlockWithinRow troca blocos adjacentes (down)', () => {
    const l = moveBlockWithinRow(base(), 'row_intro', 'blk_title', 'down');
    expect(l.rows[0].blocks.map((b) => b.id)).toEqual([
      'blk_kpi_total',
      'blk_title',
      'blk_bar_mes',
    ]);
  });

  it('moveBlockWithinRow é no-op na borda (up no primeiro)', () => {
    const l0 = base();
    const l = moveBlockWithinRow(l0, 'row_intro', 'blk_title', 'up');
    expect(layoutsEqual(l, l0)).toBe(true);
  });

  it('adjacentRowId resolve vizinhos e bordas', () => {
    const l = base();
    expect(adjacentRowId(l, 'row_intro', 'down')).toBe('row_evolucao');
    expect(adjacentRowId(l, 'row_intro', 'up')).toBeNull();
    expect(adjacentRowId(l, 'row_detalhe', 'down')).toBeNull();
  });

  it('moveBlockToAdjacentRow move o bloco para a row de baixo', () => {
    const l = moveBlockToAdjacentRow(base(), 'blk_title', 'down');
    expect(findBlock(l, 'blk_title')?.row.id).toBe('row_evolucao');
    expect(l.rows[0].blocks.map((b) => b.id)).toEqual(['blk_kpi_total', 'blk_bar_mes']);
    expect(l.rows[1].blocks.at(-1)?.id).toBe('blk_title');
  });

  it('moveBlockToRow insere na posição pedida', () => {
    const l = moveBlockToRow(base(), 'blk_title', 'row_evolucao', 0);
    expect(l.rows[1].blocks[0].id).toBe('blk_title');
  });
});

describe('remover / span / props / binding', () => {
  it('removeBlock remove de qualquer row', () => {
    const l = removeBlock(base(), 'blk_donut');
    expect(findBlock(l, 'blk_donut')).toBeNull();
  });

  it('setBlockSpan faz clamp 1..12', () => {
    expect(clampSpan(99)).toBe(12);
    expect(clampSpan(0)).toBe(1);
    const l = setBlockSpan(base(), 'blk_kpi_total', 50);
    expect(findBlock(l, 'blk_kpi_total')?.block.span).toBe(12);
  });

  it('updateBlockProps mescla; setBlockProps substitui', () => {
    const merged = updateBlockProps(base(), 'blk_title', { text: 'Novo' });
    const block = findBlock(merged, 'blk_title')?.block;
    expect(block?.props?.text).toBe('Novo');
    expect(block?.props?.level).toBe(1); // preservado

    const replaced = setBlockProps(base(), 'blk_title', { text: 'X' });
    expect(findBlock(replaced, 'blk_title')?.block.props).toEqual({ text: 'X' });
  });

  it('setBlockDataBinding define e remove o binding', () => {
    const removed = setBlockDataBinding(base(), 'blk_kpi_total', undefined);
    expect(findBlock(removed, 'blk_kpi_total')?.block.dataBinding).toBeUndefined();

    const set = setBlockDataBinding(base(), 'blk_title', {
      connectionId: 'conn_x',
      query: 'SELECT 1 AS value',
    });
    expect(findBlock(set, 'blk_title')?.block.dataBinding?.connectionId).toBe('conn_x');
  });
});

describe('rows e filtros', () => {
  it('addRow / removeRow / setRowTitle', () => {
    let l = addRow(base(), 'Nova');
    expect(l.rows.at(-1)?.title).toBe('Nova');
    const newId = l.rows.at(-1)!.id;
    l = setRowTitle(l, newId, '');
    expect(l.rows.at(-1)?.title).toBeUndefined();
    l = removeRow(l, newId);
    expect(l.rows.find((r) => r.id === newId)).toBeUndefined();
  });

  it('addFilter / updateFilter / removeFilter', () => {
    let l = addFilter(base(), { id: 'f_novo', type: 'search', label: 'Busca' });
    expect(l.filters.at(-1)).toMatchObject({
      id: 'f_novo',
      type: 'search',
      label: 'Busca',
    });
    l = updateFilter(l, 'f_novo', { label: 'Busca livre' });
    expect(l.filters.at(-1)?.label).toBe('Busca livre');
    l = removeFilter(l, 'f_novo');
    expect(l.filters.find((f) => f.id === 'f_novo')).toBeUndefined();
  });
});

describe('validateLayoutForSave (contrato doc 20)', () => {
  it('layout das fixtures é válido', () => {
    const result = validateLayoutForSave(base());
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    // payload limpo: blocos narrativos sem dataBinding, etc.
    expect(result.payload.rows).toHaveLength(3);
  });

  it('connectionId vazio invalida (feedback claro do ajv)', () => {
    const broken = setBlockDataBinding(base(), 'blk_kpi_total', {
      connectionId: '',
      query: 'SELECT 1 AS value',
    });
    const result = validateLayoutForSave(broken);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('span fora de 1..12 invalida', () => {
    // burla o clamp escrevendo direto na estrutura (simula layout corrompido)
    const l = base();
    l.rows[0].blocks[0].span = 99;
    const result = validateLayoutForSave(l);
    expect(result.valid).toBe(false);
  });
});

describe('layoutsEqual', () => {
  it('detecta mudança estrutural', () => {
    const a = base();
    const b = moveBlockWithinRow(a, 'row_intro', 'blk_title', 'down');
    expect(layoutsEqual(a, b)).toBe(false);
  });
  it('ignora identidade de referência (mesma forma → igual)', () => {
    expect(layoutsEqual(base(), base())).toBe(true);
  });
});

// =============================================================================
// ABAS (doc 40)
// =============================================================================
//
// O teste mais importante deste bloco é o de PRESERVAÇÃO: `normalizeLayout` e
// `sanitizeLayoutForSave` reconstroem o layout campo a campo, então qualquer
// chave que o editor não conheça é descartada. Antes do suporte a abas, bastava
// abrir e salvar um dashboard com abas para elas SUMIREM — sem erro na tela.

const withTabs = (): EditorLayout =>
  normalizeLayout({
    ...dashboardLayoutFixture,
    tabs: [
      { id: 'tab_1', title: 'Resumo', rowIds: ['row_intro'] },
      { id: 'tab_2', title: 'Detalhe', rowIds: ['row_evolucao', 'row_detalhe'] },
    ],
  });

describe('abas — preservação no ciclo abrir → salvar', () => {
  it('normalizeLayout mantém as abas do layout carregado', () => {
    const l = withTabs();
    expect(l.tabs?.map((t) => t.id)).toEqual(['tab_1', 'tab_2']);
    expect(l.tabs?.[1].rowIds).toEqual(['row_evolucao', 'row_detalhe']);
  });

  it('REGRESSÃO: abrir e salvar NÃO apaga as abas', () => {
    const payload = sanitizeLayoutForSave(withTabs());
    expect(payload.tabs).toHaveLength(2);
    expect(payload.tabs?.[0]).toEqual({
      id: 'tab_1',
      title: 'Resumo',
      rowIds: ['row_intro'],
    });
  });

  it('RETROCOMPAT: layout legado continua saindo SEM a chave `tabs`', () => {
    // Se o editor injetasse `tabs: []` em todo dashboard antigo, (a) o
    // dirty-state acusaria alteração só por abrir a tela e (b) o dado salvo de
    // todo mundo ganharia ruído. O layout legado tem de sair idêntico.
    const legacy = normalizeLayout(dashboardLayoutFixture);
    expect(legacy.tabs).toBeUndefined();
    expect('tabs' in sanitizeLayoutForSave(legacy)).toBe(false);
  });

  it('o layout com abas é VÁLIDO contra o contrato', () => {
    expect(validateLayoutForSave(withTabs()).valid).toBe(true);
  });

  it('rowIds órfãos são limpos no save (aba não referencia linha inexistente)', () => {
    const removed = removeRow(withTabs(), 'row_evolucao');
    const payload = sanitizeLayoutForSave(removed);
    expect(payload.tabs?.[1]).toMatchObject({ rowIds: ['row_detalhe'] });
    expect(validateLayoutForSave(removed).valid).toBe(true);
  });
});

// =============================================================================
// APRESENTAÇÃO (doc 41) — ícone, unidade, ênfase, colunas, ordem, tema
// =============================================================================
//
// Mesma armadilha das abas, um nível mais fundo: o editor RECONSTRÓI o layout
// campo a campo, então cada campo de apresentação que ele não conhecesse seria
// apagado por um simples abrir → salvar. E o dono desses campos é o AGENTE —
// quem perderia o trabalho não é quem clicou em Salvar, é quem pediu o
// dashboard. Perda silenciosa, sem erro na tela, notada só dias depois.

const rich = (): EditorLayout =>
  normalizeLayout({
    theme: { colorMode: 'dark', accent: 'teal', palette: 'multi' },
    filters: [],
    rows: [
      {
        id: 'row_kpis',
        title: 'Indicadores',
        description: 'Consolidado do período.',
        columns: 3,
        itemSizing: 'span',
        blocks: [
          {
            id: 'blk_kpi',
            type: 'kpi',
            span: 4,
            title: 'Arrecadado',
            unit: 'R$',
            icon: 'money',
            emphasis: 'featured',
            description: 'Somente valores baixados.',
          },
        ],
      },
    ],
    tabs: [
      {
        id: 'tab_1',
        title: 'Arrecadação',
        rowIds: ['row_kpis'],
        icon: 'money',
        description: 'Como entrou o dinheiro no período.',
        group: 'Receita',
        order: 10,
        level: 2,
        divider: true,
      },
    ],
  });

describe('apresentação — preservação no ciclo abrir → salvar', () => {
  it('REGRESSÃO: abrir e salvar NÃO apaga a apresentação do BLOCO', () => {
    const bloco = (sanitizeLayoutForSave(rich()).rows[0] as { blocks: unknown[] })
      .blocks[0];

    expect(bloco).toMatchObject({
      title: 'Arrecadado',
      unit: 'R$',
      icon: 'money',
      emphasis: 'featured',
      description: 'Somente valores baixados.',
    });
  });

  it('REGRESSÃO: abrir e salvar NÃO apaga a composição da LINHA', () => {
    const linha = sanitizeLayoutForSave(rich()).rows[0];

    expect(linha).toMatchObject({
      description: 'Consolidado do período.',
      columns: 3,
      itemSizing: 'span',
    });
  });

  it('REGRESSÃO: abrir e salvar NÃO apaga ícone/grupo/ordem/nível da ABA', () => {
    // Estes campos já existiam antes deste trabalho e JÁ eram perdidos: o
    // `EditorTab` só carregava id/title/rowIds. Era um bug vivo.
    expect(sanitizeLayoutForSave(rich()).tabs?.[0]).toMatchObject({
      icon: 'money',
      description: 'Como entrou o dinheiro no período.',
      group: 'Receita',
      order: 10,
      level: 2,
      divider: true,
    });
  });

  it('REGRESSÃO: abrir e salvar NÃO apaga o TEMA do dashboard', () => {
    expect(sanitizeLayoutForSave(rich()).theme).toEqual({
      colorMode: 'dark',
      accent: 'teal',
      palette: 'multi',
    });
  });

  it('o layout rico é VÁLIDO contra o contrato', () => {
    expect(validateLayoutForSave(rich()).valid).toBe(true);
  });

  it('o ciclo é IDEMPOTENTE (salvar duas vezes dá o mesmo JSON)', () => {
    const uma = sanitizeLayoutForSave(rich());
    const outra = sanitizeLayoutForSave(normalizeLayout(uma));
    expect(outra).toEqual(uma);
  });

  it('RETROCOMPAT: layout legado continua saindo SEM `theme`', () => {
    // Um default vazando para cá faria todo dashboard antigo acusar "alterado"
    // só por ter sido aberto — o dirty-state compara a forma canônica.
    const legacy = normalizeLayout(dashboardLayoutFixture);
    expect('theme' in sanitizeLayoutForSave(legacy)).toBe(false);
  });
});

describe('abas — operações (criar/renomear/ordenar/remover)', () => {
  it('a PRIMEIRA aba criada herda todas as linhas existentes', () => {
    // Sem isso, ligar abas num dashboard pronto jogaria todo o conteúdo para o
    // limbo das linhas órfãs — o normalizador o recuperaria na leitura, mas o
    // JSON salvo mentiria sobre a organização do dashboard.
    const l = addTab(normalizeLayout(dashboardLayoutFixture));
    expect(l.tabs).toHaveLength(1);
    expect(l.tabs?.[0].rowIds).toEqual(['row_intro', 'row_evolucao', 'row_detalhe']);
  });

  it('a segunda aba nasce vazia', () => {
    const l = addTab(addTab(normalizeLayout(dashboardLayoutFixture)), 'Nova');
    expect(l.tabs?.[1]).toMatchObject({ title: 'Nova', rowIds: [] });
  });

  it('renomeia uma aba', () => {
    const l = renameTab(withTabs(), 'tab_2', 'Detalhamento');
    expect(l.tabs?.[1].title).toBe('Detalhamento');
  });

  it('reordena abas e faz no-op nas bordas', () => {
    const l = withTabs();
    expect(moveTab(l, 'tab_2', 'up').tabs?.map((t) => t.id)).toEqual(['tab_2', 'tab_1']);
    // primeira aba não sobe; última não desce.
    expect(moveTab(l, 'tab_1', 'up').tabs?.map((t) => t.id)).toEqual(['tab_1', 'tab_2']);
    expect(moveTab(l, 'tab_2', 'down').tabs?.map((t) => t.id)).toEqual([
      'tab_1',
      'tab_2',
    ]);
  });

  it('remover uma aba NÃO apaga as linhas dela', () => {
    // Remover aba é gesto de ORGANIZAÇÃO. Apagar o conteúdo junto seria perda
    // de trabalho num clique — para isso existe "remover linha".
    const l = removeTab(withTabs(), 'tab_2');
    expect(l.tabs).toHaveLength(1);
    expect(l.rows.map((r) => r.id)).toEqual(['row_intro', 'row_evolucao', 'row_detalhe']);
  });

  it('remover a ÚLTIMA aba devolve o layout ao formato legado', () => {
    let l = removeTab(withTabs(), 'tab_1');
    l = removeTab(l, 'tab_2');
    expect(l.tabs).toBeUndefined();
    expect('tabs' in sanitizeLayoutForSave(l)).toBe(false);
  });

  it('setRowTab move a linha e a tira das outras abas (linha pertence a UMA aba)', () => {
    const l = setRowTab(withTabs(), 'row_intro', 'tab_2');
    expect(l.tabs?.[0].rowIds).toEqual([]);
    expect(l.tabs?.[1].rowIds).toContain('row_intro');
    // e não duplicou em nenhum lugar
    const todas = (l.tabs ?? []).flatMap((t) => t.rowIds);
    expect(new Set(todas).size).toBe(todas.length);
  });

  it('addRow filia a linha nova à primeira aba (senão ela nasce órfã)', () => {
    const l = addRow(withTabs(), 'Nova linha');
    const novaId = l.rows[l.rows.length - 1].id;
    expect(l.tabs?.[0].rowIds).toContain(novaId);
  });

  it('addRow aceita a aba de destino explicitamente', () => {
    const l = addRow(withTabs(), 'Nova linha', 'tab_2');
    const novaId = l.rows[l.rows.length - 1].id;
    expect(l.tabs?.[1].rowIds).toContain(novaId);
    expect(l.tabs?.[0].rowIds).not.toContain(novaId);
  });

  it('addRow em layout legado segue funcionando (sem abas)', () => {
    const l = addRow(normalizeLayout(dashboardLayoutFixture));
    expect(l.tabs).toBeUndefined();
    expect(l.rows).toHaveLength(4);
  });
});

/* ==========================================================================
 * ALTURA — a decisão que o editor humano não tinha
 * ========================================================================== */
describe('altura declarada', () => {
  it('setRowHeight aceita degrau nomeado e o grava no payload', () => {
    const l = setRowHeight(base(), 'row_intro', 'tall');
    expect(l.rows[0].height).toBe('tall');
    const payload = sanitizeLayoutForSave(l) as { rows: { height?: unknown }[] };
    expect(payload.rows[0].height).toBe('tall');
    expect(validateLayoutForSave(l).valid).toBe(true);
  });

  it('setRowHeight aceita pixels e os grampeia na faixa do contrato', () => {
    const grande = setRowHeight(base(), 'row_intro', 99999);
    const pequeno = setRowHeight(base(), 'row_intro', 3);
    expect(grande.rows[0].height).toBe(1600);
    expect(pequeno.rows[0].height).toBe(120);
    // Grampear na ESCRITA é o que garante que o usuário nunca receba um
    // "layout inválido" por ter digitado um número absurdo.
    expect(validateLayoutForSave(grande).valid).toBe(true);
    expect(validateLayoutForSave(pequeno).valid).toBe(true);
  });

  it('setRowHeight(undefined) devolve a linha à altura automática', () => {
    const comAltura = setRowHeight(base(), 'row_intro', 'compact');
    const semAltura = setRowHeight(comAltura, 'row_intro', undefined);
    expect(semAltura.rows[0].height).toBeUndefined();
    const payload = sanitizeLayoutForSave(semAltura) as {
      rows: Record<string, unknown>[];
    };
    expect('height' in payload.rows[0]).toBe(false);
  });

  it('setBlockHeight grava a altura no BLOCO (exceção à altura da linha)', () => {
    const l = setBlockHeight(base(), 'blk_kpi_total', 240);
    expect(findBlock(l, 'blk_kpi_total')?.block.height).toBe(240);
    expect(validateLayoutForSave(l).valid).toBe(true);
  });

  it('altura não declarada não conta como alteração (dirty-state limpo)', () => {
    expect(layoutsEqual(base(), base())).toBe(true);
    expect(layoutsEqual(base(), setRowHeight(base(), 'row_intro', 'tall'))).toBe(false);
  });
});

/* ==========================================================================
 * PRESERVAÇÃO DE CAMPOS — o defeito silencioso que o editor tinha
 *
 * `sanitizeLayoutForSave` reconstrói o bloco campo a campo. Enquanto ele não
 * conhecia `title`, `subtitle`, `rowSpan` e `blocks`, abrir um dashboard
 * montado pelo agente e clicar em Salvar APAGAVA o título dos cards e o
 * conteúdo das seções — sem erro e sem aviso. Estes casos existem para que
 * isso não volte.
 * ========================================================================== */
describe('preservação de campos do contrato', () => {
  const rico = {
    filters: [],
    rows: [
      {
        id: 'r1',
        title: 'Faixa',
        blocks: [
          {
            id: 'sec',
            type: 'section',
            span: 12,
            title: 'Resumo executivo',
            subtitle: 'Trimestre corrente',
            rowSpan: 2,
            blocks: [{ id: 'filho', type: 'kpi', span: 4, title: 'Total arrecadado' }],
          },
        ],
      },
    ],
  };

  it('normalize → sanitize é IDEMPOTENTE para os campos do contrato', () => {
    const payload = sanitizeLayoutForSave(normalizeLayout(rico));
    expect(payload).toEqual(rico);
  });

  it('abrir e salvar não apaga título, subtítulo, rowSpan nem sub-blocos', () => {
    const l = normalizeLayout(rico);
    const bloco = l.rows[0].blocks[0];
    expect(bloco.title).toBe('Resumo executivo');
    expect(bloco.subtitle).toBe('Trimestre corrente');
    expect(bloco.rowSpan).toBe(2);
    expect(bloco.blocks?.[0].title).toBe('Total arrecadado');
    expect(validateLayoutForSave(l).valid).toBe(true);
  });

  it('setBlockText edita o título do card e o vazio REMOVE o campo', () => {
    const l = setBlockText(normalizeLayout(rico), 'sec', 'title', 'Outro nome');
    expect(findBlock(l, 'sec')?.block.title).toBe('Outro nome');
    const limpo = setBlockText(l, 'sec', 'title', '   ');
    expect(findBlock(limpo, 'sec')?.block.title).toBeUndefined();
  });
});

/* ==========================================================================
 * MOVER LINHA e DUPLICAR BLOCO
 * ========================================================================== */
describe('moveRow', () => {
  it('reordena as linhas quando o layout não tem abas', () => {
    const l = moveRow(base(), 'row_evolucao', 'up');
    expect(l.rows.map((r) => r.id)).toEqual(['row_evolucao', 'row_intro', 'row_detalhe']);
  });

  it('nas bordas é no-op (não some nem duplica linha)', () => {
    const l = moveRow(base(), 'row_intro', 'up');
    expect(l.rows.map((r) => r.id)).toEqual(base().rows.map((r) => r.id));
  });

  it('com abas, reordena DENTRO da aba (é `rowIds` que a visualização percorre)', () => {
    const comAbas = addTab(base());
    const primeira = comAbas.tabs?.[0].id as string;
    const antes = comAbas.tabs?.[0].rowIds ?? [];
    const l = moveRow(comAbas, antes[1], 'up');
    expect(l.tabs?.find((t) => t.id === primeira)?.rowIds).toEqual([
      antes[1],
      antes[0],
      antes[2],
    ]);
  });
});

describe('duplicateBlock', () => {
  it('insere a cópia logo depois do original, com id NOVO e mesma consulta', () => {
    const l = duplicateBlock(base(), 'blk_kpi_total');
    const linha = l.rows[0].blocks;
    expect(linha).toHaveLength(base().rows[0].blocks.length + 1);
    const original = linha[1];
    const copia = linha[2];
    expect(copia.id).not.toBe(original.id);
    expect(copia.type).toBe(original.type);
    expect(copia.dataBinding).toEqual(original.dataBinding);
    expect(validateLayoutForSave(l).valid).toBe(true);
  });
});
