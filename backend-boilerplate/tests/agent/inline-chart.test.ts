/**
 * Rede de segurança do GRÁFICO EMBUTIDO na resposta.
 *
 * O problema que estes testes travam foi medido na aplicação rodando: pedimos
 * "monte um gráfico de barras com o total de mensagens por dia" e o agente
 * respondeu com `run_query` + `list_catalog` + `create_chart`. A tela mostrou a
 * trilha, o texto e o cartão "Abrir gráfico" — e nenhum gráfico. Faltou o
 * `preview_chart_data`, que é OPCIONAL para o agente.
 *
 * Ou seja: o que o usuário via dependia da rota que o modelo escolheu. O
 * servidor passou a executar os dados que faltaram, e é essa decisão — o que
 * materializar, o que recusar, quando desistir — que está sob teste aqui.
 *
 * Tudo com dependências injetadas: nenhuma linha abaixo precisa de banco,
 * socket, Redis ou agente.
 */
import {
  chartDataFitsBudget,
  chartsAwaitingData,
  type ChartMeta,
} from '@/modules/agent/services/audit-trail';
import { materializarGraficosPendentes } from '@/modules/agent/services/run-agent-background';

const binding = { connectionId: 'con_1', query: 'select 1' };

function meta(chartId: string, extra: Partial<ChartMeta> = {}): ChartMeta {
  return {
    chartId,
    title: `Gráfico ${chartId}`,
    catalogType: 'bar_chart',
    dataBinding: binding,
    ...extra,
  };
}

/** Retorno de sucesso do `preview_chart_data` (um `BlockDataResult`). */
function previewOk(chartId: string, pontos = 2) {
  return {
    blockId: chartId,
    state: 'success',
    shape: 'categorical',
    data: Array.from({ length: pontos }, (_, i) => ({ label: `d${i}`, value: i })),
    meta: { cached: false, rowCount: pontos },
  };
}

// ---------------------------------------------------------------------------

describe('quais gráficos precisam ser materializados', () => {
  it('o gráfico criado sem preview entra na fila — é o caso do relato', () => {
    expect(chartsAwaitingData([meta('cht_1')], new Set())).toEqual([meta('cht_1')]);
  });

  it('o que o preview já mandou NÃO entra: dois gráficos na mesma resposta', () => {
    expect(chartsAwaitingData([meta('cht_1')], new Set(['cht_1']))).toEqual([]);
  });

  it('sem dataBinding não há query para rodar — nem tenta o banco', () => {
    const semBinding = { chartId: 'cht_2', title: 'X', catalogType: 'kpi' };
    expect(chartsAwaitingData([semBinding], new Set())).toEqual([]);
  });

  it('create seguido de update do MESMO gráfico materializa UMA vez, a última definição', () => {
    const primeiro = meta('cht_1', { title: 'Rascunho' });
    const corrigido = meta('cht_1', { title: 'Vendas por mês' });

    const fila = chartsAwaitingData([primeiro, corrigido], new Set());

    expect(fila).toHaveLength(1);
    expect(fila[0].title).toBe('Vendas por mês');
  });

  it('entrada malformada é descartada em vez de derrubar o turno', () => {
    const lixo = [
      null,
      undefined,
      { title: 'sem id' },
      { chartId: '', title: 'id vazio', catalogType: 'kpi', dataBinding: binding },
    ] as unknown as ChartMeta[];

    expect(() => chartsAwaitingData(lixo, new Set())).not.toThrow();
    expect(chartsAwaitingData(lixo, new Set())).toEqual([]);
  });
});

describe('teto de tamanho do gráfico', () => {
  it('gráfico normal passa', () => {
    expect(chartDataFitsBudget(previewOk('cht_1', 30), 128_000)).toBe(true);
  });

  it('gráfico grande demais é RECUSADO, não cortado', () => {
    // Meia série com cara de série inteira seria pior que gráfico nenhum.
    expect(chartDataFitsBudget(previewOk('cht_1', 5000), 8_000)).toBe(false);
  });

  it('referência circular não lança (JSON.stringify explodiria)', () => {
    const circular: Record<string, unknown> = { state: 'success' };
    circular.self = circular;
    expect(() => chartDataFitsBudget(circular, 128_000)).not.toThrow();
    expect(chartDataFitsBudget(circular, 128_000)).toBe(false);
  });
});

describe('materialização — um bônus que nunca pode custar a resposta', () => {
  it('executa os dados e emite o gráfico que faltava', async () => {
    const emitidos: Array<[string, unknown]> = [];

    await materializarGraficosPendentes([meta('cht_1')], new Set(), {
      previewChartData: async (id) => previewOk(id),
      emitirGrafico: async (id, resultado) => {
        emitidos.push([id, resultado]);
      },
    });

    expect(emitidos).toHaveLength(1);
    expect(emitidos[0][0]).toBe('cht_1');
  });

  it('não emite duas vezes o gráfico que o preview do agente já mandou', async () => {
    const previews: string[] = [];

    await materializarGraficosPendentes([meta('cht_1')], new Set(['cht_1']), {
      previewChartData: async (id) => {
        previews.push(id);
        return previewOk(id);
      },
      emitirGrafico: async () => {},
    });

    // Nem sequer vai ao banco.
    expect(previews).toEqual([]);
  });

  it.each([
    ['a query falhou', { blockId: 'cht_1', state: 'error', error: { code: 'query_failed', message: 'timeout' } }],
    ['o resultado não bate com o contrato', { blockId: 'cht_1', state: 'error', error: { message: 'contract_violation' } }],
    ['veio sem dados', { blockId: 'cht_1', state: 'success' }],
    ['veio lixo', 'não é um resultado'],
  ])('não emite quando %s — e não lança', async (_caso, resultado) => {
    const emitidos: string[] = [];
    const desistencias: string[] = [];

    await expect(
      materializarGraficosPendentes([meta('cht_1')], new Set(), {
        previewChartData: async () => resultado,
        emitirGrafico: async (id) => {
          emitidos.push(id);
        },
        aoDesistir: (id) => desistencias.push(id),
      }),
    ).resolves.toBeUndefined();

    expect(emitidos).toEqual([]);
    expect(desistencias).toEqual(['cht_1']);
  });

  it('exceção do preview (RBAC, gráfico apagado no meio do turno) não derruba o turno', async () => {
    const desistencias: string[] = [];

    await expect(
      materializarGraficosPendentes([meta('cht_1')], new Set(), {
        previewChartData: async () => {
          throw new Error('forbidden');
        },
        emitirGrafico: async () => {},
        aoDesistir: (_id, motivo) => desistencias.push(motivo),
      }),
    ).resolves.toBeUndefined();

    expect(desistencias).toEqual(['forbidden']);
  });

  it('gráfico acima do teto não vai pelo fio (o cartão "Abrir gráfico" continua honesto)', async () => {
    const emitidos: string[] = [];
    const motivos: string[] = [];

    await materializarGraficosPendentes([meta('cht_1')], new Set(), {
      previewChartData: async (id) => previewOk(id, 5000),
      emitirGrafico: async (id) => {
        emitidos.push(id);
      },
      aoDesistir: (_id, motivo) => motivos.push(motivo),
      maxChars: 1000,
    });

    expect(emitidos).toEqual([]);
    expect(motivos[0]).toContain('teto');
  });

  it('query travada não sequestra o turno: o prazo vence e a resposta segue', async () => {
    const motivos: string[] = [];

    const inicio = Date.now();
    await materializarGraficosPendentes([meta('cht_1')], new Set(), {
      // Nunca resolve — é o `statement_timeout` de 30s do pg-runner somado à
      // espera por conexão do pool. `chat:done` não pode esperar por isso.
      previewChartData: () => new Promise<never>(() => {}),
      emitirGrafico: async () => {},
      aoDesistir: (_id, motivo) => motivos.push(motivo),
      budgetMs: 30,
    });

    expect(Date.now() - inicio).toBeLessThan(2000);
    expect(motivos[0]).toContain('prazo');
  });

  it('o prazo é do CONJUNTO: gastando tudo no primeiro, o segundo nem tenta', async () => {
    const tentados: string[] = [];
    let relogio = 0;

    await materializarGraficosPendentes([meta('cht_1'), meta('cht_2')], new Set(), {
      previewChartData: async (id) => {
        tentados.push(id);
        relogio += 10_000; // o primeiro consumiu o orçamento inteiro
        return previewOk(id);
      },
      emitirGrafico: async () => {},
      agora: () => relogio,
      budgetMs: 10_000,
    });

    expect(tentados).toEqual(['cht_1']);
  });

  it('sem gráfico pendente, não faz nada (nenhuma ida ao banco)', async () => {
    const previews: string[] = [];

    await materializarGraficosPendentes([], new Set(), {
      previewChartData: async (id) => {
        previews.push(id);
        return previewOk(id);
      },
      emitirGrafico: async () => {},
    });

    expect(previews).toEqual([]);
  });
});
