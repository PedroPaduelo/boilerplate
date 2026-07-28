/**
 * Contrato do cartão de artefato: o que o agente criou tem de ser ALCANÇÁVEL a
 * partir da resposta, e uma exclusão não pode sair com a mesma cara de uma
 * criação.
 *
 * As consultas vão pelo papel `link` (e pelo `href` que ele carrega), que é o
 * que o `LinkProvider` do shell transforma em navegação client-side.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ArtifactCard } from '../components/artifact-card';
import type { ChatArtifact } from '../model';

function artifact(overrides: Partial<ChatArtifact> = {}): ChatArtifact {
  return {
    kind: 'dashboard',
    id: 'dash_1',
    title: 'Arrecadação 2026',
    action: 'created',
    ...overrides,
  };
}

describe('ArtifactCard', () => {
  it('dashboard criado leva para a tela do dashboard', () => {
    renderWithProviders(<ArtifactCard artifact={artifact()} />);

    const link = screen.getByRole('link', {
      name: 'Abrir dashboard: Arrecadação 2026',
    });
    expect(link).toHaveAttribute('href', '/dashboards/dash_1');
    expect(screen.getByText('Criado')).toBeInTheDocument();
  });

  it('gráfico atualizado leva para a tela do gráfico', () => {
    renderWithProviders(
      <ArtifactCard
        artifact={artifact({
          kind: 'chart',
          id: 'chart_9',
          title: 'Total por mês',
          action: 'updated',
        })}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Abrir gráfico: Total por mês' }),
    ).toHaveAttribute('href', '/charts/chart_9');
    expect(screen.getByText('Atualizado')).toBeInTheDocument();
  });

  it('publicar e despublicar são estados distintos, nomeados', () => {
    const { rerender } = renderWithProviders(
      <ArtifactCard artifact={artifact({ action: 'published' })} />,
    );
    expect(screen.getByText('Publicado')).toBeInTheDocument();

    rerender(<ArtifactCard artifact={artifact({ action: 'unpublished' })} />);
    expect(screen.getByText('Despublicado')).toBeInTheDocument();
  });

  it('exclusão não vira link morto e se declara em texto', () => {
    renderWithProviders(<ArtifactCard artifact={artifact({ action: 'deleted' })} />);

    // Não há para onde levar: nenhum link, nenhum botão.
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);

    expect(screen.getByText('Excluído')).toBeInTheDocument();
    expect(
      screen.getByText('Dashboard excluído pelo agente. Não há mais o que abrir.'),
    ).toBeInTheDocument();
    // O título continua legível (o usuário precisa saber O QUE sumiu).
    expect(screen.getByText('Arrecadação 2026')).toBeInTheDocument();
  });
});
