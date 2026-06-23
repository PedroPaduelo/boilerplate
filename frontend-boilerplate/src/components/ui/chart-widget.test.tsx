/**
 * Testes do ChartWidget — foco na RETROCOMPATIBILIDADE (sem as props novas,
 * nada de takeaway/botão é renderizado) e nas novas capacidades opt-in
 * (takeaway + botão "mais detalhes" via onDetails/detailsHref).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ChartWidget } from './chart-widget';

afterEach(() => cleanup());

describe('ChartWidget — retrocompat (sem props novas)', () => {
  it('renderiza título, badge de tipo e children; sem takeaway nem botão', () => {
    render(
      <ChartWidget title="Receita por mês" chartType="Gráfico de Barras">
        <div>conteudo-do-grafico</div>
      </ChartWidget>,
    );
    expect(screen.getByText('Receita por mês')).toBeInTheDocument();
    expect(screen.getByText('Gráfico de Barras')).toBeInTheDocument();
    expect(screen.getByText('conteudo-do-grafico')).toBeInTheDocument();
    expect(screen.queryByText('Mais detalhes')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="chart-widget-takeaway"]')).toBeNull();
  });

  it('mostra a query no footer técnico quando passada', () => {
    render(
      <ChartWidget title="X" query="SELECT 1" durationMs={42}>
        <div>c</div>
      </ChartWidget>,
    );
    expect(screen.getByText('SELECT 1')).toBeInTheDocument();
    expect(screen.getByText(/42ms/)).toBeInTheDocument();
  });
});

describe('ChartWidget — takeaway + ações (opt-in)', () => {
  it('renderiza o takeaway quando passado', () => {
    render(
      <ChartWidget title="X" takeaway="Maior valor: Mai (R$ 110)">
        <div>c</div>
      </ChartWidget>,
    );
    expect(screen.getByText('Maior valor: Mai (R$ 110)')).toBeInTheDocument();
  });

  it('botão "mais detalhes" dispara onDetails ao clicar', () => {
    const onDetails = vi.fn();
    render(
      <ChartWidget title="X" onDetails={onDetails}>
        <div>c</div>
      </ChartWidget>,
    );
    const btn = screen.getByRole('button', { name: /mais detalhes/i });
    fireEvent.click(btn);
    expect(onDetails).toHaveBeenCalledTimes(1);
  });

  it('detailsHref renderiza o botão como link com href', () => {
    render(
      <ChartWidget title="X" detailsHref="/detalhe/1" detailsLabel="Ver tudo">
        <div>c</div>
      </ChartWidget>,
    );
    const link = screen.getByRole('link', { name: /ver tudo/i });
    expect(link).toHaveAttribute('href', '/detalhe/1');
  });
});
