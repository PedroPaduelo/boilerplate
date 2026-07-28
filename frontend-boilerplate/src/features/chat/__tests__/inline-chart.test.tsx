/**
 * O card do gráfico dentro da resposta.
 *
 * Uma resposta rende até sete gráficos seguidos, então o card é julgado
 * REPETIDO, não isolado. Os casos cobrem as quatro decisões que isso impôs:
 *
 * 1. RECORTE DECLARADO — período/volume/unidade abaixo do título, derivados do
 *    payload. Sem isso o número não tem contexto (doc §6).
 * 2. NADA DE INVENÇÃO — quando o payload não prova o recorte, a linha não sai.
 * 3. ALTURA RESERVADA — a caixa nasce do tamanho final; o dado chegando não
 *    empurra o texto que está sendo lido.
 * 4. CARTÃO DE NÚMERO É DIFERENTE — KPI não recebe moldura (já é um card, e
 *    envolvê-lo duplicava o título) e vizinhos vão lado a lado numa grade.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_BODY_HEIGHT } from '@/shared/render-engine/lib/block-sizing';
import type { ChatChartPayload } from '../transport';
import { InlineChart, InlineCharts } from '../components/inline-chart';

/**
 * Payloads como o backend os entrega (JSON cru). `Record<string, unknown>` no
 * helper — e um único cast por `unknown` — porque o teste monta variações de
 * `result` que o tipo do transporte estreitaria demais.
 */
function chart(overrides: Record<string, unknown> = {}): ChatChartPayload {
  return {
    title: 'Mensagens por dia',
    catalogType: 'bar_chart',
    props: {},
    result: {
      state: 'success',
      shape: 'series',
      data: [
        { x: '2026-07-18', y: 3 },
        { x: '2026-07-28', y: 34 },
      ],
    },
    ...overrides,
  } as unknown as ChatChartPayload;
}

function kpi(title: string): ChatChartPayload {
  return chart({
    title,
    catalogType: 'kpi',
    props: { label: title, valueFormat: 'number' },
    result: {
      state: 'success',
      shape: 'scalar',
      data: { value: 4090, label: title },
    },
  });
}

describe('InlineChart (card do gráfico na resposta)', () => {
  it('declara o recorte abaixo do título', () => {
    renderWithProviders(<InlineChart chart={chart()} />);

    expect(screen.getByText('Mensagens por dia')).toBeInTheDocument();
    expect(screen.getByText(/18\/07 a 28\/07/)).toBeInTheDocument();
  });

  it('não inventa recorte quando o payload não o comprova', () => {
    const semRecorte = chart({
      catalogType: 'kpi',
      props: {},
      result: {
        state: 'success',
        shape: 'scalar',
        data: { value: 371 },
      },
    });

    renderWithProviders(<InlineChart chart={semRecorte} />);
    expect(document.querySelector('[data-slot="inline-chart-scope"]')).toBeNull();
  });

  it('reserva a altura final do corpo desde o esqueleto', () => {
    // Mesmo SEM dados (estado de carregamento), a caixa já tem a altura do
    // gráfico pronto — é o que evita o pulo quando o dado chega. O número vem
    // de `CHART_BODY_HEIGHT` (não é cravado aqui): a repaginação o subiu para
    // acomodar os 320px de desenho da referência + padding + legenda.
    const carregando = chart({
      result: { state: 'running' },
    });

    const { container } = renderWithProviders(<InlineChart chart={carregando} />);
    const body = container.querySelector('[data-slot="inline-chart-body"]');

    expect(body).not.toBeNull();
    expect(body?.getAttribute('style')).toContain(`${CHART_BODY_HEIGHT.series}px`);
  });

  it('cartão de número não ganha moldura nem título repetido', () => {
    const { container } = renderWithProviders(<InlineChart chart={kpi('Total')} />);

    expect(container.querySelector('[data-slot="inline-chart-compact"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="inline-chart"]')).toBeNull();
    // O rótulo vive DENTRO do card do KPI: uma vez, não duas.
    expect(screen.getAllByText('Total')).toHaveLength(1);
  });

  it('payload quebrado vira erro nomeado, não card vazio', () => {
    const quebrado = chart({ catalogType: 'tipo_que_nao_existe' });
    renderWithProviders(<InlineChart chart={quebrado} />);

    expect(screen.getByText(/não consegui montar este gráfico/i)).toBeInTheDocument();
  });
});

describe('InlineCharts (a sequência inteira da resposta)', () => {
  it('agrupa cartões de número vizinhos numa grade', () => {
    const { container } = renderWithProviders(
      <InlineCharts
        messageId="msg_1"
        charts={[kpi('Enviadas'), kpi('Recebidas'), kpi('Total'), chart()]}
      />,
    );

    const grids = container.querySelectorAll('[data-slot="inline-chart-grid"]');
    expect(grids).toHaveLength(1);
    // Os três KPIs na grade; o gráfico fica FORA dela, em largura cheia.
    expect(grids[0].querySelectorAll('[data-slot="inline-chart-compact"]')).toHaveLength(
      3,
    );
    expect(grids[0].querySelector('[data-slot="inline-chart"]')).toBeNull();
    expect(container.querySelector('[data-slot="inline-chart"]')).not.toBeNull();
  });

  it('preserva a ordem do agente ao alternar entre número e gráfico', () => {
    const { container } = renderWithProviders(
      <InlineCharts
        messageId="msg_1"
        charts={[chart(), kpi('Contatos'), kpi('Conversas'), chart()]}
      />,
    );

    // gráfico → grade(2 KPIs) → gráfico: três grupos, na ordem recebida.
    const slots = [...container.querySelectorAll('[data-slot]')]
      .map((el) => el.getAttribute('data-slot'))
      .filter((slot) => slot === 'inline-chart' || slot === 'inline-chart-grid');

    expect(slots).toEqual(['inline-chart', 'inline-chart-grid', 'inline-chart']);
  });

  it('anima a entrada só enquanto a resposta está chegando', () => {
    const { container, unmount } = renderWithProviders(
      <InlineCharts messageId="msg_1" charts={[chart()]} isEntering />,
    );
    expect(container.querySelector('.app-step-in')).not.toBeNull();
    unmount();

    // Conversa antiga: os gráficos já existem, animá-los seria piscar à toa.
    const { container: settled } = renderWithProviders(
      <InlineCharts messageId="msg_1" charts={[chart()]} />,
    );
    expect(settled.querySelector('.app-step-in')).toBeNull();
  });

  it('lista vazia não renderiza nada', () => {
    const { container } = renderWithProviders(
      <InlineCharts messageId="msg_1" charts={[]} />,
    );
    expect(container.querySelector('[data-slot]')).toBeNull();
  });
});
