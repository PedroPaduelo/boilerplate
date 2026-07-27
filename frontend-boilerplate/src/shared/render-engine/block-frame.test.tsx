import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { BlockFrame } from './block-frame';

describe('BlockFrame (moldura padrão dos blocos de gráfico)', () => {
  it('dá ao bloco um cabeçalho com título e tipo', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação por mês" chartType="Barras">
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(
      screen.getByRole('heading', { name: 'Arrecadação por mês' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Barras')).toBeInTheDocument();
    expect(screen.getByText('gráfico')).toBeInTheDocument();
  });

  it('carregando: troca o corpo pelo esqueleto', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação" isLoading>
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(screen.queryByText('gráfico')).not.toBeInTheDocument();
  });

  it('mostra apenas os insights ligados e não vazios', () => {
    renderWithProviders(
      <BlockFrame
        title="Arrecadação"
        takeaways={[
          { enabled: true, text: 'Maior valor em maio' },
          { enabled: false, text: 'Insight desligado' },
          { enabled: true, text: '   ' },
        ]}
      />,
    );

    expect(screen.getByText('Maior valor em maio')).toBeInTheDocument();
    expect(screen.queryByText('Insight desligado')).not.toBeInTheDocument();
  });

  it('rodapé técnico mostra a query e a duração formatada', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação" query="SELECT 1" durationMs={1400} />,
    );

    expect(screen.getByText('SELECT 1')).toBeInTheDocument();
    expect(screen.getByText('1,4s')).toBeInTheDocument();
  });

  it('showQuery=false esconde o rodapé técnico mesmo com query', () => {
    renderWithProviders(
      <BlockFrame
        title="Arrecadação"
        query="SELECT 1"
        durationMs={1400}
        showQuery={false}
      />,
    );

    expect(screen.queryByText('SELECT 1')).not.toBeInTheDocument();
  });
});
