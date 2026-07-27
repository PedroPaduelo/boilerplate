/**
 * Regressão do bloco `bar_chart` depois da migração para a base de gráficos.
 *
 * O que este arquivo trava:
 * 1. OS TRÊS ESTADOS — carregando, sem dados e com dados. Barra vazia em
 *    silêncio era o defeito clássico do bloco antigo.
 * 2. LEITURA SEM VER — as categorias do eixo vivem dentro do SVG; o bloco
 *    precisa publicá-las como tabela para leitor de tela.
 * 3. COR DE TOKEN — o acento vira token do design system, e uma cor crua
 *    legada NÃO atravessa para o desenho.
 *
 * Consultas por papel acessível — nunca por classe (o StyleX gera nomes novos
 * a cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

const MULTI_SERIES = [
  { x: 'Jan', y: 120, series: 'Receita' },
  { x: 'Jan', y: 90, series: 'Despesa' },
  { x: 'Fev', y: 138, series: 'Receita' },
  { x: 'Fev', y: 110, series: 'Despesa' },
];

describe('bloco bar_chart — estados', () => {
  it('mostra esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando a consulta não devolveu linhas', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });

  it('mostra a mensagem do erro no lugar do gráfico', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

describe('bloco bar_chart — leitura sem ver', () => {
  it('anuncia o gráfico como imagem de dados', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByRole('img', { name: /barras/i })).toBeInTheDocument();
  });

  it('publica as categorias e os valores como tabela', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Jan' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Mai' })).toBeInTheDocument();
    // Uma coluna por série, além da coluna de categoria.
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
  });

  it('abre uma coluna por série quando o dado é multi-série', () => {
    renderWithProviders(<Block props={{}} data={MULTI_SERIES} state="success" />);
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Receita' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Despesa' }),
    ).toBeInTheDocument();
  });
});

describe('bloco bar_chart — cor', () => {
  it('resolve o acento antigo para um token de dado do DS', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: 'chart-3' }}
        data={MULTI_SERIES}
        state="success"
      />,
    );
    // A legenda é a única marca de cor que existe fora do SVG.
    expect(container.innerHTML).toContain('--color-data-categorical-purple');
  });

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: '#40E0D0' }}
        data={MULTI_SERIES}
        state="success"
      />,
    );
    expect(container.innerHTML).not.toContain('#40E0D0');
    expect(container.innerHTML).toContain('--color-data-categorical-');
  });
});
