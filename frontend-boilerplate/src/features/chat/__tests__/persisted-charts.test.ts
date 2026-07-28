/**
 * `readPersistedCharts` — o que faz os gráficos da resposta sobreviverem ao F5.
 *
 * O backend grava `toolData.charts` desde a materialização do turno; esta
 * leitura é a metade do front. Os casos cobrem o contrato: formato novo,
 * mensagens sem gráfico, lixo que não pode derrubar a conversa e — a regra que
 * mudou — TODOS os gráficos do turno, não só o último.
 */
import { describe, expect, it } from 'vitest';
import { readPersistedCharts } from '../lib/chat-tools';

const CHART = {
  chartId: 'chart_1',
  title: 'Total por mês',
  catalogType: 'bar_chart',
  props: { accent: 'chart-1' },
  result: { kind: 'categorical', items: [{ label: 'Jan', value: 10 }] },
};

function record(toolData: unknown) {
  return { id: 'msg_1', toolData };
}

describe('readPersistedCharts', () => {
  it('lê o gráfico do formato persistido ({steps, artifacts, charts, usage})', () => {
    const charts = readPersistedCharts(
      record({ steps: [], artifacts: [], charts: [CHART], usage: {} }),
    );
    expect(charts).toEqual([CHART]);
  });

  it('devolve vazio para mensagens sem gráfico (usuário, formato antigo, null)', () => {
    expect(readPersistedCharts(record(null))).toEqual([]);
    expect(readPersistedCharts(record(undefined))).toEqual([]);
    // Formato ANTIGO: array de passos crus — não tem `charts`.
    expect(readPersistedCharts(record([{ toolCallId: 't1' }]))).toEqual([]);
    expect(readPersistedCharts(record({ steps: [], artifacts: [] }))).toEqual([]);
  });

  it('descarta lixo sem derrubar: charts que não são objetos ou sem os campos mínimos', () => {
    expect(
      readPersistedCharts(record({ charts: ['x', 42, null, { title: 'só título' }] })),
    ).toEqual([]);
    // Sem `result` não há o que desenhar — cai fora em vez de virar cartão vazio.
    expect(
      readPersistedCharts(
        record({ charts: [{ title: 'a', catalogType: 'kpi', result: null }] }),
      ),
    ).toEqual([]);
  });

  /**
   * O caso que motivou a mudança: pedir um painel rende vários gráficos num
   * turno só. A regra antiga ("vale o último") devolvia UM e os outros só
   * existiam como cartão "abrir gráfico" — o usuário tinha de sair do chat
   * para ver o que acabara de pedir.
   */
  it('devolve TODOS os gráficos do turno, na ordem em que o agente os produziu', () => {
    const kpi = { ...CHART, chartId: 'chart_1', title: 'Total de mensagens' };
    const barras = { ...CHART, chartId: 'chart_2', title: 'Mensagens por dia' };
    const donut = { ...CHART, chartId: 'chart_3', title: 'Tipos de evento' };

    const charts = readPersistedCharts(record({ charts: [kpi, barras, donut] }));

    expect(charts.map((chart) => chart.chartId)).toEqual([
      'chart_1',
      'chart_2',
      'chart_3',
    ]);
  });

  it('um gráfico corrompido no meio não leva os irmãos junto', () => {
    const bom = { ...CHART, chartId: 'chart_1' };
    const outroBom = { ...CHART, chartId: 'chart_2' };

    const charts = readPersistedCharts(
      record({ charts: [bom, { title: 'quebrado' }, outroBom] }),
    );

    expect(charts.map((chart) => chart.chartId)).toEqual(['chart_1', 'chart_2']);
  });
});
