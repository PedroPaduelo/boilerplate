/**
 * Regressão do bloco `donut` depois da migração para a base de gráficos.
 *
 * O que este arquivo trava:
 * 1. A LEGENDA É A LEITURA — o anel mostra proporção; quem dá o número é a
 *    legenda (categoria + valor + participação). Sem ela o bloco vira enfeite.
 * 2. OS TRÊS ESTADOS — carregando, sem dados e com dados.
 * 3. COR DE TOKEN — o acento antigo vira token de dado do design system.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const Block = definition.Component;

/** Quitado 62 + Em aberto 38 = 100 → percentuais redondos, fáceis de afirmar. */
const DATA = [
  { label: 'Quitado', value: 62 },
  { label: 'Em aberto', value: 38 },
];

describe('bloco donut', () => {
  it('lista categoria, valor e participação na legenda', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByText('Quitado')).toBeInTheDocument();
    expect(screen.getByText('R$ 62,00')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('Em aberto')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
  });

  it('esconde a legenda quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showLegend: false }} data={DATA} state="success" />,
    );
    expect(screen.queryByText('Quitado')).not.toBeInTheDocument();
  });

  it('anuncia o anel como imagem de dados com equivalente textual', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByRole('img', { name: 'Donut' })).toBeInTheDocument();
    expect(screen.getByText(/2 categorias/)).toBeInTheDocument();
  });

  it('cobre carregando e sem dados', () => {
    const { unmount } = renderWithProviders(<Block props={{}} state="loading" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    unmount();

    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });

  it('resolve o acento antigo para um token de dado do sistema', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: 'bg-emerald-500' }}
        data={DATA}
        state="success"
      />,
    );
    expect(container.innerHTML).toContain('--color-data-categorical-green');
    expect(container.innerHTML).not.toContain('emerald');
  });
});
