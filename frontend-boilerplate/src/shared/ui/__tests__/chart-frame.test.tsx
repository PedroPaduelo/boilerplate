/**
 * Regressão da CASCA comum dos gráficos (`ChartFrame`).
 *
 * O que este arquivo trava:
 * 1. OS CINCO ESTADOS — carregando, vazio, erro, sem permissão e sucesso.
 *    Nenhum deles é uma área em branco.
 * 2. CABEÇALHO DO CONTRATO COMUM — título, subtítulo e descrição existem em
 *    TODO gráfico e aceitam Markdown + `{{variavel}}`.
 * 3. ACESSIBILIDADE — o desenho se anuncia com papel e rótulo, e o equivalente
 *    textual é IRMÃO da região (papéis como `img` podam os descendentes).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ChartFrame } from '@/shared/ui';

const PLOT = <svg data-testid="plot" />;

describe('estados', () => {
  it('carregando: esqueleto no lugar do desenho', () => {
    renderWithProviders(
      <ChartFrame label="Receita" height={200} state="loading">
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByLabelText('Carregando Receita')).toBeInTheDocument();
    expect(screen.queryByTestId('plot')).not.toBeInTheDocument();
  });

  it('vazio: avisa em vez de desenhar eixo sem dado', () => {
    renderWithProviders(
      <ChartFrame label="Receita" height={200} state="empty" emptyMessage="Nada no mês">
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByText('Nada no mês')).toBeInTheDocument();
    expect(screen.queryByTestId('plot')).not.toBeInTheDocument();
  });

  it('erro: mostra a mensagem da execução', () => {
    renderWithProviders(
      <ChartFrame
        label="Receita"
        height={200}
        state="error"
        errorMessage="timeout na consulta"
      >
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('timeout na consulta')).toBeInTheDocument();
  });

  it('sem permissão: estado próprio, não um erro genérico', () => {
    renderWithProviders(
      <ChartFrame label="Receita" height={200} state="forbidden">
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByText(/sem permissão/i)).toBeInTheDocument();
  });

  it('sucesso: desenha a plotagem', () => {
    renderWithProviders(
      <ChartFrame label="Receita" height={200}>
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByTestId('plot')).toBeInTheDocument();
  });
});

describe('cabeçalho do contrato comum', () => {
  it('renderiza título, subtítulo e descrição com markdown e variáveis', () => {
    renderWithProviders(
      <ChartFrame
        label="Receita"
        height={200}
        title="Receita de **{{rotuloMaximo}}**"
        subtitle="Total: {{total}}"
        description="Fonte: {{fonte}}"
        scope={{ rotuloMaximo: 'março', total: 120, fonte: 'ERP' }}
      >
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByText('março')).toBeInTheDocument();
    expect(screen.getByText(/Total: 120/)).toBeInTheDocument();
    expect(screen.getByText(/Fonte: ERP/)).toBeInTheDocument();
  });

  it('sem nenhum campo preenchido, não desenha cabeçalho vazio', () => {
    const { container } = renderWithProviders(
      <ChartFrame label="Receita" height={200}>
        {PLOT}
      </ChartFrame>,
    );
    expect(container.querySelector('[data-slot="chart-header"]')).toBeNull();
  });
});

describe('acessibilidade', () => {
  it('anuncia o papel, o rótulo interpolado e o equivalente textual', () => {
    renderWithProviders(
      <ChartFrame
        label="Receita de {{ano}}"
        scope={{ ano: 2026 }}
        summary="3 pontos, pico em março"
        height={200}
      >
        {PLOT}
      </ChartFrame>,
    );
    expect(screen.getByRole('img', { name: 'Receita de 2026' })).toBeInTheDocument();
    expect(screen.getByText('3 pontos, pico em março')).toBeInTheDocument();
  });

  it('expõe medidor com valor', () => {
    renderWithProviders(
      <ChartFrame
        label="Uso"
        height={120}
        role="meter"
        valueNow={42}
        valueMin={0}
        valueMax={100}
      >
        {PLOT}
      </ChartFrame>,
    );
    const meter = screen.getByRole('meter', { name: 'Uso' });
    expect(meter).toHaveAttribute('aria-valuenow', '42');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });
});
