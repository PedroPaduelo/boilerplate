/**
 * Testes das capacidades de APRESENTAÇÃO do layout (doc 41): ícone, unidade,
 * ênfase, colunas, ordem/hierarquia de aba e tema do dashboard.
 *
 * O que estes testes protegem, em uma frase: o layout é escrito por um AGENTE,
 * sem revisão humana antes de renderizar. Então o que está aqui não é "o campo
 * funciona" — é "o campo escrito ERRADO não derruba nem mente". Um valor fora
 * do vocabulário tem de degradar para o padrão, em silêncio e sem perder o
 * bloco; e um dashboard antigo, que não tem nenhum destes campos, tem de sair
 * exatamente como saía antes.
 *
 * Rodar: `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDashboardLayout,
  formatErrors,
} from '../src/validation/validator';
import {
  dashboardLayoutFixture,
  dashboardRichLayoutFixture,
} from '../src/fixtures';
import { resolveDashboardTabs } from '../src/layout/tabs';
import {
  iconForBlockType,
  isSemanticIcon,
  resolveBlockPresentation,
  resolveDashboardTheme,
  resolveRowLayout,
} from '../src/layout/presentation';
import type { Block, DashboardLayout, Row } from '../src/types';

/* ------------------------------------------------------------- schema ----- */

test('o layout RICO (todas as capacidades) valida contra o schema', () => {
  const ok = validateDashboardLayout(dashboardRichLayoutFixture);
  assert.ok(ok, formatErrors(validateDashboardLayout.errors));
});

test('`description` no BLOCO passa a ser aceita (era rejeitada pelo contrato)', () => {
  // Regressão de uma lacuna real: o render-engine já LIA `block.description`,
  // mas o schema (additionalProperties: false) rejeitava o layout que a usasse
  // — ou seja, o campo era impossível de salvar.
  const layout: DashboardLayout = {
    filters: [],
    rows: [
      {
        id: 'r1',
        blocks: [
          {
            id: 'b1',
            type: 'bar_chart',
            span: 12,
            description: 'Valores baixados, sem parcelamento em aberto.',
          },
        ],
      },
    ],
  };
  assert.ok(
    validateDashboardLayout(layout),
    formatErrors(validateDashboardLayout.errors),
  );
});

test('campo de apresentação FORA do vocabulário é rejeitado na validação', () => {
  // O contrato é a última barreira antes do banco: `emphasis: "gigante"` tem de
  // falhar aqui, com caminho JSON, e não virar dado salvo que a tela ignora.
  const layout = {
    filters: [],
    rows: [
      { id: 'r1', blocks: [{ id: 'b1', type: 'kpi', span: 4, emphasis: 'gigante' }] },
    ],
  };
  assert.equal(validateDashboardLayout(layout), false);
});

/* -------------------------------------------------------------- ícones ---- */

test('ícone é derivado do TIPO quando o bloco não declara', () => {
  // É o que garante "ícone por tipo de gráfico" de graça: o agente escreve
  // `bar_chart` e o card já nasce com âncora visual.
  assert.equal(iconForBlockType('bar_chart'), 'chart');
  assert.equal(iconForBlockType('line_chart'), 'trend');
  assert.equal(iconForBlockType('donut'), 'pie');
  assert.equal(iconForBlockType('data_table'), 'table');
});

test('tipo desconhecido não inventa ícone', () => {
  // `undefined` (e não um ícone genérico) porque só a TELA sabe se o item está
  // numa lista que precisa de alinhamento — ela decide o marcador neutro.
  assert.equal(iconForBlockType('bloco_do_futuro'), undefined);
  assert.equal(iconForBlockType(undefined), undefined);
});

test('ícone DECLARADO vence o derivado do tipo', () => {
  const block = { id: 'b', type: 'bar_chart', span: 6, icon: 'money' } as Block;
  assert.equal(resolveBlockPresentation(block).icon, 'money');
});

test('ícone irreconhecível cai no derivado, em vez de propagar lixo', () => {
  const block = { id: 'b', type: 'bar_chart', span: 6, icon: 'unicornio' } as unknown as Block;
  assert.equal(resolveBlockPresentation(block).icon, 'chart');
  assert.equal(isSemanticIcon('unicornio'), false);
});

/* ------------------------------------------------- unidade e ênfase ------- */

test('unidade é aparada; vazia não vira unidade', () => {
  const comEspaco = { id: 'b', type: 'kpi', span: 4, unit: '  R$ ' } as Block;
  assert.equal(resolveBlockPresentation(comEspaco).unit, 'R$');

  const vazia = { id: 'b', type: 'kpi', span: 4, unit: '   ' } as Block;
  assert.equal(resolveBlockPresentation(vazia).unit, undefined);
});

test('ênfase inválida degrada para `default` (o card não some)', () => {
  const block = { id: 'b', type: 'kpi', span: 4, emphasis: 'enorme' } as unknown as Block;
  assert.equal(resolveBlockPresentation(block).emphasis, 'default');
});

test('apresentação também é lida de `props` (é onde o playground grava)', () => {
  const block = {
    id: 'b',
    type: 'kpi',
    span: 4,
    props: { unit: '%', emphasis: 'featured' },
  } as unknown as Block;
  const presentation = resolveBlockPresentation(block);
  assert.equal(presentation.unit, '%');
  assert.equal(presentation.emphasis, 'featured');
});

/* ------------------------------------------------------ linha / grade ----- */

test('colunas fora da faixa são ignoradas, não grampeadas em silêncio no absurdo', () => {
  assert.equal(resolveRowLayout({ id: 'r', columns: 3, blocks: [] } as Row).columns, 3);
  // 40 colunas seriam faixas de 12px: grampeia no teto do contrato (6).
  assert.equal(
    resolveRowLayout({ id: 'r', columns: 40, blocks: [] } as unknown as Row).columns,
    6,
  );
  // Sem declaração: `undefined` = "deixe o motor encaixar" (colapso responsivo).
  assert.equal(resolveRowLayout({ id: 'r', blocks: [] } as Row).columns, undefined);
});

test('`equal` é o padrão de largura — `span` precisa ser pedido', () => {
  // A regra existe para impedir o desequilíbrio ACIDENTAL (span 7 + span 5).
  assert.equal(resolveRowLayout({ id: 'r', blocks: [] } as Row).itemSizing, 'equal');
  assert.equal(
    resolveRowLayout({ id: 'r', itemSizing: 'span', blocks: [] } as Row).itemSizing,
    'span',
  );
});

/* -------------------------------------------------- ordem das abas -------- */

test('`order` decide a ordem de exibição, não a posição no array', () => {
  const tabs = resolveDashboardTabs(dashboardRichLayoutFixture);
  // No fixture, "Recuperação" (order 10) vem DEPOIS de "Cobrança" (order 20)
  // no array — e precisa aparecer antes na tela.
  assert.deepEqual(
    tabs.map((tab) => tab.id),
    ['tab_recuperacao', 'tab_cobranca', 'tab_bairro'],
  );
});

test('aba SEM `order` não é empurrada para o fim por outra que declarou', () => {
  /*
   * A decisão mais sutil do desenho: ausência de `order` significa "sem
   * opinião", e não zero. Se valesse zero, escrever `order` numa única aba
   * reordenaria todas as demais — o oposto do que quem escreveu o campo pediu.
   */
  const layout: DashboardLayout = {
    filters: [],
    rows: [
      { id: 'r1', blocks: [] },
      { id: 'r2', blocks: [] },
      { id: 'r3', blocks: [] },
    ],
    tabs: [
      { id: 'a', title: 'A', rowIds: ['r1'] },
      { id: 'b', title: 'B', rowIds: ['r2'] },
      { id: 'c', title: 'C', rowIds: ['r3'], order: 1 },
    ],
  };
  const tabs = resolveDashboardTabs(layout);
  // 'c' pediu a posição 1 → entra depois de 'a' (posição 0) e antes de 'b'
  // (posição 1 implícita, que perde o desempate por vir depois no array).
  assert.deepEqual(
    tabs.map((tab) => tab.id),
    ['a', 'c', 'b'],
  );
});

test('ordenação é ESTÁVEL com `order` repetido', () => {
  const layout: DashboardLayout = {
    filters: [],
    rows: [{ id: 'r1', blocks: [] }],
    tabs: [
      { id: 'x', title: 'X', rowIds: [], order: 5 },
      { id: 'y', title: 'Y', rowIds: [], order: 5 },
      { id: 'z', title: 'Z', rowIds: ['r1'], order: 5 },
    ],
  };
  assert.deepEqual(
    resolveDashboardTabs(layout).map((tab) => tab.id),
    ['x', 'y', 'z'],
  );
});

test('reordenar NÃO perde linha nenhuma (o invariante continua valendo)', () => {
  const tabs = resolveDashboardTabs(dashboardRichLayoutFixture);
  const rendered = tabs.flatMap((tab) => tab.rows.map((row) => row.id)).sort();
  const declared = dashboardRichLayoutFixture.rows.map((row) => row.id).sort();
  assert.deepEqual(rendered, declared);
});

/* ---------------------------------------------------- hierarquia ---------- */

test('`level` só aceita 2; qualquer outro valor é aba de primeiro nível', () => {
  const layout = {
    filters: [],
    rows: [],
    tabs: [
      { id: 'a', title: 'A', rowIds: [], level: 2 },
      { id: 'b', title: 'B', rowIds: [], level: 7 },
      { id: 'c', title: 'C', rowIds: [] },
    ],
  } as unknown as DashboardLayout;
  const [a, b, c] = resolveDashboardTabs(layout);
  assert.equal(a.level, 2);
  // Hierarquia inventada é pior que hierarquia ausente: desalinha a lista sem
  // o autor entender por quê.
  assert.equal(b.level, undefined);
  assert.equal(c.level, undefined);
});

test('`divider` só passa quando é literalmente `true`', () => {
  const layout = {
    filters: [],
    rows: [],
    tabs: [
      { id: 'a', title: 'A', rowIds: [], divider: true },
      { id: 'b', title: 'B', rowIds: [], divider: 'sim' },
    ],
  } as unknown as DashboardLayout;
  const [a, b] = resolveDashboardTabs(layout);
  assert.equal(a.divider, true);
  assert.equal(b.divider, undefined);
});

/* ---------------------------------------------------------- tema ---------- */

test('tema do dashboard é lido e normalizado', () => {
  const theme = resolveDashboardTheme(dashboardRichLayoutFixture);
  assert.equal(theme.colorMode, 'dark');
  assert.equal(theme.accent, 'teal');
  assert.equal(theme.palette, 'multi');
});

test('tema ausente/inválido devolve objeto vazio (nunca nulo)', () => {
  // Devolver sempre um objeto poupa o chamador de uma checagem de nulo por
  // campo — que é exatamente o tipo de checagem esquecida em um dos três
  // consumidores.
  assert.deepEqual(resolveDashboardTheme(dashboardLayoutFixture), {});
  assert.deepEqual(resolveDashboardTheme(null), {});
  assert.deepEqual(
    resolveDashboardTheme({
      filters: [],
      rows: [],
      theme: { colorMode: 'sepia', palette: 'arco-iris' },
    } as unknown as DashboardLayout),
    {},
  );
});

/* -------------------------------------------------- retrocompatibilidade -- */

test('RETROCOMPAT: layout legado não ganha nenhum campo novo', () => {
  /*
   * A promessa que sustenta a mudança inteira: um dashboard salvo antes disto
   * continua válido e continua sendo lido exatamente como era. Se um default
   * vazasse para cá (um `emphasis: 'default'` gravado, um `columns` inventado),
   * a diferença apareceria no dirty-state do editor — todo dashboard antigo
   * passaria a acusar "alterado" ao ser apenas aberto.
   */
  assert.ok(validateDashboardLayout(dashboardLayoutFixture));
  const [implicit] = resolveDashboardTabs(dashboardLayoutFixture);
  assert.equal(implicit.isImplicit, true);
  assert.equal(implicit.order, undefined);
  assert.equal(implicit.level, undefined);
  assert.equal(implicit.divider, undefined);
  assert.equal(implicit.rows.length, dashboardLayoutFixture.rows.length);
});
