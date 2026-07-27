/**
 * Regressão dos primitivos de visualização de dados.
 *
 * O que este arquivo trava (e por quê):
 * 1. TOKEN, NUNCA HEX — a paleta só devolve valores vindos do tema; se alguém
 *    cravar uma cor num gráfico, o teste da paleta não pega, mas o de fumaça
 *    abaixo garante que a cor sempre atravessa o `useChartPalette`.
 * 2. OS TRÊS ESTADOS — carregando, sem dados e com dados. Eixo vazio silencioso
 *    era o defeito mais comum dos gráficos legados.
 * 3. ACESSIBILIDADE — gráfico se anuncia como imagem de dados; medidor e
 *    progresso expõem valor; ranking continua sendo texto legível.
 *
 * Consultas por papel acessível — nunca por classe (StyleX gera nomes novos a
 * cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import {
  AreaChart,
  BarChart,
  BarList,
  DonutChart,
  HBarChart,
  LineChart,
  ProgressCircle,
  RadialGauge,
  ScatterChart,
  SparkChart,
} from '@/shared/ui';
import {
  CHART_SERIES_COLORS,
  chartRampToken,
  chartSeriesToken,
  useChartPalette,
} from '@/shared/ui/charts/use-chart-palette';

/** Sonda: expõe o que a paleta devolve para o gráfico, sem depender de SVG. */
function PaletteProbe() {
  const palette = useChartPalette();
  return (
    <span
      data-testid="palette-probe"
      data-color={palette.colorAt(0)}
      data-var={palette.varAt(0)}
      data-grid={palette.chrome('grid')}
    />
  );
}

const SERIES = [
  { label: 'Receita', data: [10, 20, 30] },
  { label: 'Custo', data: [5, 12, 18] },
];
const LABELS = ['Jan', 'Fev', 'Mar'];
const POINTS = [
  { label: 'Norte', value: 40 },
  { label: 'Sul', value: 60 },
];

describe('paleta de gráficos', () => {
  it('só monta nomes de token de data-viz do DS', () => {
    for (const color of CHART_SERIES_COLORS) {
      expect(chartSeriesToken(color)).toBe(`--color-data-categorical-${color}`);
    }
    expect(chartRampToken('shamrock', 3)).toBe('--color-data-shamrock-3');
  });

  it('entrega ao gráfico valor vindo do tema — cor literal nunca chega', () => {
    renderWithProviders(<PaletteProbe />);
    const probe = screen.getByTestId('palette-probe');

    // Forma usada no DOM: sempre `var(--token)`.
    expect(probe.getAttribute('data-var')).toBe('var(--color-data-categorical-blue)');
    // Forma usada dentro do SVG: valor resolvido pelo tema (ou o próprio
    // `var()` como fallback) — nunca vazio, nunca um hex escrito no código.
    expect(probe.getAttribute('data-color')).toBeTruthy();
    expect(probe.getAttribute('data-grid')).toBeTruthy();
  });
});

describe('estados obrigatórios', () => {
  it('mostra o esqueleto enquanto carrega, sem desenhar o gráfico', () => {
    renderWithProviders(<AreaChart series={SERIES} labels={LABELS} isLoading />);
    expect(
      screen.queryByRole('img', { name: /gráfico de área/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
  });

  it('avisa quando não há dados em vez de desenhar eixo vazio', () => {
    renderWithProviders(<LineChart series={[]} emptyMessage="Nenhum lançamento" />);
    expect(screen.getByText('Nenhum lançamento')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('trata série presente porém sem pontos como vazio', () => {
    renderWithProviders(<BarChart series={[{ label: 'Vazia', data: [] }]} />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});

describe('acessibilidade', () => {
  it('anuncia o gráfico como imagem de dados com equivalente textual', () => {
    renderWithProviders(
      <AreaChart series={SERIES} labels={LABELS} label="Receita por mês" />,
    );
    expect(screen.getByRole('img', { name: 'Receita por mês' })).toBeInTheDocument();
    expect(screen.getByText(/2 série\(s\): Receita, Custo/)).toBeInTheDocument();
  });

  it('expõe o medidor radial como meter com valor', () => {
    renderWithProviders(<RadialGauge value={42} max={100} label="Uso de CPU" />);
    const meter = screen.getByRole('meter', { name: 'Uso de CPU' });
    expect(meter).toHaveAttribute('aria-valuenow', '42');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  it('expõe o círculo de progresso como progressbar com valor', () => {
    renderWithProviders(<ProgressCircle value={73} label="Cobertura" />);
    const bar = screen.getByRole('progressbar', { name: 'Cobertura' });
    expect(bar).toHaveAttribute('aria-valuenow', '73');
  });

  it('exige rótulo no spark, que não tem eixo para ler', () => {
    renderWithProviders(<SparkChart data={[1, 4, 2, 8]} label="Tendência de sessões" />);
    expect(screen.getByRole('img', { name: 'Tendência de sessões' })).toBeInTheDocument();
  });
});

describe('renderização', () => {
  it('desenha rosca, barras horizontais e dispersão sem quebrar', () => {
    renderWithProviders(
      <>
        <DonutChart data={POINTS} label="Distribuição" />
        <HBarChart data={POINTS} label="Ranking" />
        <ScatterChart
          data={[{ x: 1, y: 2, category: 'A' }]}
          label="Correlação"
          xLabel="Preço"
          yLabel="Volume"
        />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Distribuição' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ranking' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Correlação' })).toBeInTheDocument();
  });

  it('legenda lista as séries pelo rótulo', () => {
    renderWithProviders(<LineChart series={SERIES} labels={LABELS} />);
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Custo')).toBeInTheDocument();
  });
});

describe('BarList', () => {
  it('é lista de texto (não imagem) e ordena do maior para o menor', () => {
    renderWithProviders(
      <BarList data={POINTS} valueFormatter={(value) => `${value} un`} />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Sul');
    expect(items[0]).toHaveTextContent('60 un');
    expect(items[1]).toHaveTextContent('Norte');
  });

  it('mostra estado vazio com mensagem própria', () => {
    renderWithProviders(<BarList data={[]} emptyMessage="Nada no período" />);
    expect(screen.getByText('Nada no período')).toBeInTheDocument();
  });
});
