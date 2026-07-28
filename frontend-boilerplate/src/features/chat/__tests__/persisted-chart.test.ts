/**
 * `readPersistedChart` — o que faz o gráfico da resposta sobreviver ao F5.
 *
 * O backend grava `toolData.charts` desde a materialização do turno; esta
 * leitura é a metade do front. Os casos cobrem o contrato: formato novo,
 * mensagens sem gráfico, lixo que não pode derrubar a conversa e a regra do
 * "último válido vence" (mesma do streaming).
 */
import { describe, expect, it } from 'vitest';
import { readPersistedChart } from '../lib/chat-tools';

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

describe('readPersistedChart', () => {
  it('lê o gráfico do formato persistido ({steps, artifacts, charts, usage})', () => {
    const chart = readPersistedChart(
      record({ steps: [], artifacts: [], charts: [CHART], usage: {} }),
    );
    expect(chart).toEqual(CHART);
  });

  it('devolve undefined para mensagens sem gráfico (usuário, formato antigo, null)', () => {
    expect(readPersistedChart(record(null))).toBeUndefined();
    expect(readPersistedChart(record(undefined))).toBeUndefined();
    // Formato ANTIGO: array de passos crus — não tem `charts`.
    expect(readPersistedChart(record([{ toolCallId: 't1' }]))).toBeUndefined();
    expect(readPersistedChart(record({ steps: [], artifacts: [] }))).toBeUndefined();
  });

  it('descarta lixo sem derrubar: charts que não são objetos ou sem os campos mínimos', () => {
    expect(
      readPersistedChart(record({ charts: ['x', 42, null, { title: 'só título' }] })),
    ).toBeUndefined();
    // Sem `result` não há o que desenhar — cai fora em vez de virar cartão vazio.
    expect(
      readPersistedChart(
        record({ charts: [{ title: 'a', catalogType: 'kpi', result: null }] }),
      ),
    ).toBeUndefined();
  });

  it('com mais de um gráfico, vale o ÚLTIMO válido — a regra do streaming', () => {
    const first = { ...CHART, chartId: 'chart_1', title: 'Primeiro' };
    const last = { ...CHART, chartId: 'chart_2', title: 'Último' };
    const invalidTail = { title: 'quebrado' };

    const chart = readPersistedChart(record({ charts: [first, last, invalidTail] }));
    expect(chart?.chartId).toBe('chart_2');
  });
});
