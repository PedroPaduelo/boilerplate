/**
 * Regressão do bloco `progress_bar` depois de passar a usar a barra do design
 * system.
 *
 * O que este arquivo trava:
 * 1. VALOR DE VERDADE — a barra se anuncia como `progressbar` com valor,
 *    mínimo e máximo; antes o percentual só existia no texto ao lado.
 * 2. COR SEMÂNTICA — `variant` mapeia para a variante do sistema e um acento
 *    preenchido vence o variant, virando a cor de destaque.
 * 3. CARREGANDO E SEM DADOS — nenhum dos dois é área em branco.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** A variante é exposta como atributo de tema pelo próprio design system. */
function variantOf(container: HTMLElement): string | null {
  return container.querySelector('[data-variant]')?.getAttribute('data-variant') ?? null;
}

describe('bloco progress_bar', () => {
  it('anuncia o progresso com rótulo e valor', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const bar = screen.getByRole('progressbar', { name: 'Uso da cota' });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('lê "valor de total" quando a escala não é percentual', () => {
    renderWithProviders(
      <Block
        props={{ max: 500 }}
        data={{ value: 125, label: 'Processos' }}
        state="success"
      />,
    );
    expect(screen.getByText('125 de 500')).toBeInTheDocument();
  });

  it('esconde a leitura do valor quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showValue: false }} data={fixture} state="success" />,
    );
    expect(screen.queryByText('68%')).not.toBeInTheDocument();
  });

  it('mapeia o variant antigo para a variante semântica do sistema', () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'error' }} data={fixture} state="success" />,
    );
    expect(variantOf(container)).toBe('error');
  });

  it('deixa o acento preenchido vencer o variant', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ variant: 'error', accent: 'chart-2' }}
        data={fixture}
        state="success"
      />,
    );
    expect(variantOf(container)).toBe('accent');
  });

  it('mostra esqueleto enquanto carrega e aviso quando não há valor', () => {
    const { unmount } = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    unmount();

    renderWithProviders(<Block props={{}} data={{ value: null }} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});
