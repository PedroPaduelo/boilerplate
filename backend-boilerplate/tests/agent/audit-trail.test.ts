/**
 * Testes do TRADUTOR da trilha de auditoria (`services/audit-trail.ts`).
 *
 * O tradutor é puro de propósito, e é por isso que este arquivo não sobe
 * agente, banco, socket nem Redis: cada regra que o usuário vê na tela (o
 * rótulo do passo, o SQL que rodou, o teto da amostra, o destaque da ação
 * destrutiva) é verificável aqui, isolada, em milissegundos.
 *
 * Os fixtures reproduzem o RETORNO REAL das tools do MCP — `run_query` devolve
 * `{columns:[{name,dataTypeID}], rows, rowCount, truncated, durationMs}`,
 * `create_chart` devolve o `serializeChart`, `preview_chart_data` devolve um
 * `BlockDataResult` — porque um teste contra um formato inventado só provaria
 * que o inventor é coerente consigo mesmo.
 */
import {
  PREVIEW_MAX_COLUMNS,
  PREVIEW_MAX_ROWS,
  TOOL_TITLES,
  artifactTouchedBy,
  chartMetaFrom,
  connectionIdOf,
  describeToolStep,
  harvestConnectionNames,
  isDestructiveTool,
  isRenderableChartData,
  mainTableOf,
  previewedChartId,
  stepLabel,
  toolTitle,
} from '@/modules/agent/services/audit-trail';

// ---------------------------------------------------------------------------
// Fixtures com o formato REAL das tools
// ---------------------------------------------------------------------------

/** `run_query` → `QueryResultShape` do pg-runner. */
function queryResult(linhas: number, colunas = 3) {
  const nomes = Array.from({ length: colunas }, (_, i) => `col${i + 1}`);
  const rows = Array.from({ length: linhas }, (_, r) =>
    Object.fromEntries(nomes.map((n, c) => [n, `v${r}-${c}`])),
  );
  return {
    columns: nomes.map((name) => ({ name, dataTypeID: 25 })),
    rows,
    rowCount: linhas,
    truncated: false,
    durationMs: 340,
  };
}

/** `create_chart`/`update_chart` → `serializeChart`. */
const chartCriado = {
  id: 'cht_1',
  title: 'Vendas por mês',
  catalogType: 'bar_chart',
  ownerId: 'u1',
  departmentId: null,
  visibility: 'PRIVATE',
  status: 'DRAFT',
  draftProps: { title: 'Vendas por mês' },
  draftDataBinding: { connectionId: 'con_1', query: 'select 1' },
  publishedProps: null,
  publishedDataBinding: null,
  publishedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/** `preview_chart_data` → `BlockDataResult` (shape categorical). */
const previewOk = {
  blockId: 'cht_1',
  state: 'success',
  shape: 'categorical',
  data: [
    { label: 'Jan', value: 10 },
    { label: 'Fev', value: 20 },
  ],
  meta: { cached: false, rowCount: 2, durationMs: 12 },
};

// ---------------------------------------------------------------------------

describe('rótulo humano por família de ferramenta', () => {
  it.each([
    ['list_connections', 'Listando conexões'],
    ['get_connection_schema', 'Lendo o schema do banco'],
    ['run_query', 'Executando consulta'],
    ['list_catalog', 'Consultando o catálogo de blocos'],
    ['create_chart', 'Criando gráfico'],
    ['update_chart', 'Atualizando gráfico'],
    ['publish_chart', 'Publicando gráfico'],
    ['preview_chart_data', 'Pré-visualizando dados do gráfico'],
    ['delete_chart', 'Excluindo gráfico'],
    ['unpublish_chart', 'Despublicando gráfico'],
    ['list_charts', 'Listando gráficos'],
    ['create_dashboard', 'Criando dashboard'],
    ['update_dashboard', 'Atualizando dashboard'],
    ['add_chart_to_dashboard', 'Adicionando gráfico ao dashboard'],
    ['publish_dashboard', 'Publicando dashboard'],
    ['delete_dashboard', 'Excluindo dashboard'],
    ['unpublish_dashboard', 'Despublicando dashboard'],
    ['list_dashboards', 'Listando dashboards'],
    ['create_dashboard_share_link', 'Gerando link de compartilhamento'],
    ['activate_skill', 'Ativando skill'],
  ])('%s → "%s"', (tool, esperado) => {
    expect(toolTitle(tool)).toBe(esperado);
    expect(describeToolStep(tool, {}, {}).title).toBe(esperado);
  });

  it('nenhuma das 20 ferramentas do agente caiu no fallback do nome cru', () => {
    const todas = Object.keys(TOOL_TITLES);
    expect(todas).toHaveLength(20);
    for (const nome of todas) {
      expect(toolTitle(nome)).not.toBe(nome);
    }
  });

  it('nome desconhecido usa o PRÓPRIO nome — mostrar algo é melhor que esconder o passo', () => {
    expect(toolTitle('export_to_excel')).toBe('export_to_excel');
    const campos = describeToolStep('export_to_excel', { a: 1 }, { ok: true });
    expect(campos.title).toBe('export_to_excel');
    expect(campos.status).toBe('ok');
  });
});

describe('SQL — o campo desta feature', () => {
  it('extrai o SQL dos args de run_query', () => {
    const sql = 'SELECT id, nome FROM public.messages WHERE ativo = true';
    const campos = describeToolStep('run_query', { connectionId: 'con_1', sql }, queryResult(2));
    expect(campos.sql).toBe(sql);
  });

  it('SQL aparece já na CHAMADA, antes do resultado voltar', () => {
    const sql = 'SELECT count(*) FROM pedidos';
    const campos = describeToolStep('run_query', { connectionId: 'con_1', sql }, undefined);
    expect(campos.status).toBe('running');
    expect(campos.sql).toBe(sql);
    expect(campos.summary).toBeUndefined();
  });

  it('só run_query traz sql — o `query` de um dataBinding não é o SQL do passo', () => {
    const campos = describeToolStep('create_chart', {
      title: 'X',
      draftDataBinding: { connectionId: 'con_1', query: 'select 1' },
    }, chartCriado);
    expect(campos.sql).toBeUndefined();
  });

  it('deriva a tabela principal para dar alvo ao passo', () => {
    expect(mainTableOf('select * from messages')).toBe('messages');
    expect(mainTableOf('SELECT a FROM public.pedidos p JOIN itens i ON 1=1')).toBe('public.pedidos');
    expect(mainTableOf('select x from "SCH"."TABELA"')).toBe('SCH.TABELA');
    // Subquery no FROM: pula e pega o próximo FROM real.
    expect(mainTableOf('select * from (select 1 from vendas) t')).toBe('vendas');
    // Sem FROM (ou SQL que a regra não entende) → sem alvo; o `sql` continua lá.
    expect(mainTableOf('select now()')).toBeUndefined();
    expect(mainTableOf(undefined)).toBeUndefined();
  });

  it('target de run_query é a tabela', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'con_1', sql: 'select * from messages limit 10' },
      queryResult(1),
    );
    expect(campos.target).toBe('messages');
  });
});

describe('teto do preview — linhas E colunas, com o total preservado', () => {
  it('corta em 8 linhas e registra o total real em totalRows', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      queryResult(128),
    );
    expect(campos.preview?.rows).toHaveLength(PREVIEW_MAX_ROWS);
    expect(campos.preview?.totalRows).toBe(128);
    // rowCount conta a verdade mesmo com a amostra cortada.
    expect(campos.rowCount).toBe(128);
  });

  it('corta em 12 colunas', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      queryResult(3, 40),
    );
    expect(campos.preview?.columns).toHaveLength(PREVIEW_MAX_COLUMNS);
    expect(campos.preview?.columns[0]).toBe('col1');
    // Cada linha tem exatamente uma célula por coluna mantida.
    for (const linha of campos.preview!.rows) {
      expect(linha).toHaveLength(PREVIEW_MAX_COLUMNS);
    }
  });

  it('resultado pequeno vai inteiro e SEM totalRows (não há verdade escondida)', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      queryResult(3),
    );
    expect(campos.preview?.rows).toHaveLength(3);
    expect(campos.preview?.totalRows).toBeUndefined();
  });

  it('as linhas viram arrays alinhados às colunas (o objeto do pg vira tabela)', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      {
        columns: [{ name: 'id', dataTypeID: 23 }, { name: 'nome', dataTypeID: 25 }],
        rows: [{ nome: 'Ana', id: 1 }],
        rowCount: 1,
        truncated: false,
        durationMs: 5,
      },
    );
    expect(campos.preview).toEqual({ columns: ['id', 'nome'], rows: [[1, 'Ana']] });
  });

  it('valores não-escalares viram texto (uma célula não pode quebrar a tabela)', () => {
    const data = new Date('2024-03-01T10:00:00.000Z');
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      {
        columns: [{ name: 'quando' }, { name: 'json' }, { name: 'nulo' }],
        rows: [{ quando: data, json: { a: 1 }, nulo: null }],
        rowCount: 1,
      },
    );
    expect(campos.preview?.rows[0]).toEqual(['2024-03-01T10:00:00.000Z', '{"a":1}', null]);
  });

  it('preview_chart_data também vira amostra, a partir do shape do bloco', () => {
    const campos = describeToolStep('preview_chart_data', { chartId: 'cht_1' }, previewOk);
    expect(campos.preview?.columns).toEqual(['label', 'value']);
    expect(campos.preview?.rows).toEqual([
      ['Jan', 10],
      ['Fev', 20],
    ]);
    expect(campos.rowCount).toBe(2);
  });

  it('preview NÃO é gerado para tools que devolvem infraestrutura (nada de segredo)', () => {
    const campos = describeToolStep(
      'list_connections',
      {},
      {
        connections: [
          {
            id: 'con_1',
            name: 'teste',
            host: 'db.interno.local',
            username: 'admin',
            database: 'vendas',
          },
        ],
        total: 1,
      },
    );
    expect(campos.preview).toBeUndefined();
    const serializado = JSON.stringify(campos);
    expect(serializado).not.toContain('db.interno.local');
    expect(serializado).not.toContain('admin');
  });
});

describe('resumo do desfecho', () => {
  it('run_query resume linhas e tempo', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      queryResult(128),
      999,
    );
    expect(campos.summary).toBe('128 linhas · 340 ms');
    // A duração da PRÓPRIA ferramenta ganha da medida por fora.
    expect(campos.durationMs).toBe(340);
  });

  it('marca resultado truncado — o usuário precisa saber que não viu tudo', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'select * from t' },
      { ...queryResult(50), truncated: true },
    );
    expect(campos.summary).toContain('(truncado)');
  });

  it('singular e plural', () => {
    const um = describeToolStep('run_query', { sql: 'select 1' }, queryResult(1));
    expect(um.summary).toBe('1 linha · 340 ms');
    const conexoes = describeToolStep('list_connections', {}, { connections: [{}], total: 1 });
    expect(conexoes.summary).toBe('1 conexão');
    const tres = describeToolStep('list_connections', {}, { connections: [{}, {}, {}], total: 3 });
    expect(tres.summary).toBe('3 conexões');
  });

  it('escrita em artefato resume o que aconteceu', () => {
    expect(describeToolStep('create_chart', {}, chartCriado).summary).toBe('gráfico criado');
    expect(describeToolStep('publish_dashboard', {}, { id: 'd1', title: 'X' }).summary).toBe(
      'dashboard publicado',
    );
    expect(describeToolStep('delete_chart', { chartId: 'cht_1' }, { id: 'cht_1', deleted: true }).summary).toBe(
      'gráfico excluído',
    );
  });

  it('link de compartilhamento não expõe token nem url', () => {
    const campos = describeToolStep(
      'create_dashboard_share_link',
      { dashboardId: 'dsh_1' },
      {
        token: 'tok_super_secreto',
        url: 'https://app/public/tok_super_secreto',
        dashboardId: 'dsh_1',
        durationSeconds: 604800,
        status: 'PUBLISHED',
      },
    );
    expect(campos.summary).toBe('link gerado');
    expect(JSON.stringify(campos)).not.toContain('tok_super_secreto');
  });

  it('duração longa aparece em segundos', () => {
    const campos = describeToolStep('list_charts', {}, { charts: [], total: 0 }, 2500);
    expect(campos.summary).toBe('0 gráficos');
    expect(campos.durationMs).toBe(2500);
  });
});

describe('conexão — a mesma pergunta em dois bancos dá respostas diferentes', () => {
  it('usa o nome resolvido pelo cache do turno', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'con_1', sql: 'select 1 from t' },
      queryResult(1),
      undefined,
      { connectionName: (id) => (id === 'con_1' ? 'teste' : undefined) },
    );
    expect(campos.connectionName).toBe('teste');
  });

  it('omite o campo quando o nome não pôde ser resolvido — nunca derruba o passo', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'con_x', sql: 'select 1 from t' },
      queryResult(1),
      undefined,
      {
        connectionName: () => {
          return undefined;
        },
      },
    );
    expect(campos.connectionName).toBeUndefined();
    expect(campos.status).toBe('ok');
  });

  it('acha o connectionId também dentro do dataBinding de um chart', () => {
    expect(connectionIdOf('run_query', { connectionId: 'con_1' })).toBe('con_1');
    expect(
      connectionIdOf('create_chart', { draftDataBinding: { connectionId: 'con_2' } }),
    ).toBe('con_2');
    expect(connectionIdOf('list_charts', {})).toBeUndefined();
    expect(connectionIdOf('run_query', null)).toBeUndefined();
  });

  it('aproveita os nomes que já passaram no retorno de list_connections', () => {
    const pares = harvestConnectionNames({
      connections: [
        { id: 'con_1', name: 'teste', host: 'h', username: 'u' },
        { id: 'con_2', name: 'prod' },
        { id: 'con_3' },
      ],
    });
    expect(pares).toEqual([
      ['con_1', 'teste'],
      ['con_2', 'prod'],
    ]);
    expect(harvestConnectionNames({ nada: true })).toEqual([]);
    expect(harvestConnectionNames(null)).toEqual([]);
  });
});

describe('ação destrutiva', () => {
  it.each(['delete_chart', 'delete_dashboard', 'unpublish_chart', 'unpublish_dashboard'])(
    '%s é destrutiva',
    (tool) => {
      expect(isDestructiveTool(tool)).toBe(true);
      expect(describeToolStep(tool, {}, { id: 'x', deleted: true }).isDestructive).toBe(true);
    },
  );

  it.each(['run_query', 'list_charts', 'create_chart', 'publish_chart', 'preview_chart_data'])(
    '%s NÃO é destrutiva',
    (tool) => {
      expect(isDestructiveTool(tool)).toBe(false);
      expect(describeToolStep(tool, {}, {}).isDestructive).toBe(false);
    },
  );
});

describe('erro de ferramenta — precisa aparecer como passo com falha, não sumir', () => {
  it('o `{error, code}` que o adapter MCP devolve vira status error', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'c', sql: 'delete from users' },
      { error: 'somente SELECT/WITH é permitido', code: 'read_only_violation' },
      42,
    );
    expect(campos.status).toBe('error');
    expect(campos.errorMessage).toBe('somente SELECT/WITH é permitido');
    expect(campos.durationMs).toBe(42);
    // O SQL rejeitado continua visível: é a evidência do que foi TENTADO.
    expect(campos.sql).toBe('delete from users');
  });

  it('o `state: error` do preview_chart_data também vira falha', () => {
    const campos = describeToolStep('preview_chart_data', { chartId: 'cht_1' }, {
      blockId: 'cht_1',
      state: 'error',
      error: { code: 'no_binding', message: 'chart has no draft dataBinding' },
    });
    expect(campos.status).toBe('error');
    expect(campos.errorMessage).toBe('chart has no draft dataBinding');
  });

  it('erro sem mensagem utilizável ainda vira falha (e não um "ok" mudo)', () => {
    const campos = describeToolStep('publish_chart', {}, { error: {} });
    expect(campos.status).toBe('error');
    expect(campos.errorMessage).toBeTruthy();
  });
});

describe('output malformado NÃO lança', () => {
  const lixos: Array<[string, unknown]> = [
    ['null', null],
    ['string', 'boom'],
    ['número', 42],
    ['array', [1, 2, 3]],
    ['objeto vazio', {}],
    ['colunas erradas', { columns: 'nope', rows: 'nope', rowCount: 'muitas' }],
    ['linhas não-objeto', { columns: [{ name: 'a' }], rows: [1, 'x', null] }],
    ['data com shape inesperado', { blockId: 'x', state: 'success', data: 42 }],
  ];

  it.each(lixos)('run_query com output %s', (_nome, output) => {
    expect(() =>
      describeToolStep('run_query', { connectionId: 'c', sql: 'select 1 from t' }, output),
    ).not.toThrow();
    const campos = describeToolStep('run_query', { connectionId: 'c', sql: 'select 1 from t' }, output);
    // Mesmo sem entender o retorno, o passo continua identificável.
    expect(campos.title).toBe('Executando consulta');
  });

  it.each(lixos)('preview_chart_data com output %s', (_nome, output) => {
    expect(() => describeToolStep('preview_chart_data', { chartId: 'c' }, output)).not.toThrow();
  });

  it('args malformados não lançam', () => {
    for (const args of [null, undefined, 'texto', 42, [1, 2]]) {
      expect(() => describeToolStep('run_query', args, queryResult(1))).not.toThrow();
      expect(() => describeToolStep('create_chart', args, chartCriado)).not.toThrow();
    }
  });

  it('referência circular no output não lança (JSON.stringify explodiria)', () => {
    const circular: Record<string, unknown> = { columns: [{ name: 'a' }], rowCount: 1 };
    circular.rows = [{ a: circular }];
    expect(() =>
      describeToolStep('run_query', { sql: 'select a from t' }, circular),
    ).not.toThrow();
  });

  it('tool desconhecida com output esquisito continua sendo um passo', () => {
    const campos = describeToolStep('ferramenta_nova', 'args?', ['?'], 10);
    expect(campos.title).toBe('ferramenta_nova');
    expect(campos.status).toBe('ok');
  });
});

describe('rótulo da fase (o que a tela mostra enquanto roda)', () => {
  it('junta título e conexão: "Executando consulta · teste"', () => {
    const campos = describeToolStep(
      'run_query',
      { connectionId: 'con_1', sql: 'select * from messages' },
      undefined,
      undefined,
      { connectionName: () => 'teste' },
    );
    expect(stepLabel(campos, 'run_query')).toBe('Executando consulta · teste');
  });

  it('sem conexão, usa o alvo', () => {
    const campos = describeToolStep('create_chart', { title: 'Vendas por mês' }, undefined);
    expect(stepLabel(campos, 'create_chart')).toBe('Criando gráfico · Vendas por mês');
  });

  it('sem alvo nenhum, só o título', () => {
    expect(stepLabel(describeToolStep('list_catalog', {}, undefined), 'list_catalog')).toBe(
      'Consultando o catálogo de blocos',
    );
  });
});

describe('artefatos tocados pelo agente', () => {
  it('create/update/publish/unpublish/delete viram ação com id e título', () => {
    expect(artifactTouchedBy('create_chart', {}, chartCriado)).toEqual({
      kind: 'chart',
      id: 'cht_1',
      title: 'Vendas por mês',
      action: 'created',
    });
    expect(artifactTouchedBy('publish_dashboard', {}, { id: 'dsh_1', title: 'Diretoria' })).toEqual({
      kind: 'dashboard',
      id: 'dsh_1',
      title: 'Diretoria',
      action: 'published',
    });
    expect(
      artifactTouchedBy('unpublish_chart', { chartId: 'cht_1' }, { id: 'cht_1', title: 'V' }),
    ).toMatchObject({ action: 'unpublished' });
  });

  it('delete devolve só o id — o título vem do que o turno já sabia', () => {
    const semDica = artifactTouchedBy('delete_chart', { chartId: 'cht_1' }, { id: 'cht_1', deleted: true });
    expect(semDica).toEqual({ kind: 'chart', id: 'cht_1', title: 'cht_1', action: 'deleted' });

    const comDica = artifactTouchedBy(
      'delete_chart',
      { chartId: 'cht_1' },
      { id: 'cht_1', deleted: true },
      (id) => (id === 'cht_1' ? 'Vendas por mês' : undefined),
    );
    expect(comDica?.title).toBe('Vendas por mês');
  });

  it('leitura não é artefato, e falha não anuncia mudança que não houve', () => {
    expect(artifactTouchedBy('list_charts', {}, { charts: [] })).toBeNull();
    expect(artifactTouchedBy('run_query', {}, queryResult(1))).toBeNull();
    expect(artifactTouchedBy('create_chart', {}, { error: 'forbidden', code: 'forbidden' })).toBeNull();
  });
});

describe('gráfico renderizável', () => {
  it('create/update trazem a DEFINIÇÃO (sem dados)', () => {
    expect(chartMetaFrom('create_chart', chartCriado)).toEqual({
      chartId: 'cht_1',
      title: 'Vendas por mês',
      catalogType: 'bar_chart',
      props: { title: 'Vendas por mês' },
      dataBinding: { connectionId: 'con_1', query: 'select 1' },
    });
    expect(chartMetaFrom('update_chart', chartCriado)?.chartId).toBe('cht_1');
    // Outras tools não descrevem gráfico.
    expect(chartMetaFrom('preview_chart_data', previewOk)).toBeNull();
    expect(chartMetaFrom('create_chart', { error: 'nope' })).toBeNull();
    expect(chartMetaFrom('create_chart', { id: 'x' })).toBeNull(); // sem título/tipo
  });

  it('preview_chart_data traz os DADOS no shape do contrato de bloco', () => {
    expect(isRenderableChartData(previewOk)).toBe(true);
    expect(previewedChartId('preview_chart_data', { chartId: 'cht_1' }, previewOk)).toBe('cht_1');
    // Falha não renderiza.
    expect(isRenderableChartData({ blockId: 'x', state: 'error', error: { message: 'x' } })).toBe(false);
    expect(isRenderableChartData({ state: 'success' })).toBe(false);
    expect(isRenderableChartData(null)).toBe(false);
    expect(previewedChartId('create_chart', {}, chartCriado)).toBeUndefined();
  });
});
