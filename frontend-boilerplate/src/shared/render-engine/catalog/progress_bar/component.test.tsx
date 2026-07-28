/**
 * Regressão do bloco `progress_bar` depois da repaginação para a BARRA
 * HORIZONTAL da referência (§8, versão escalar).
 *
 * O que este arquivo trava:
 * 1. VALOR DE VERDADE — a barra se anuncia como `progressbar` com valor,
 *    mínimo e máximo; o percentual não existe só no texto ao lado.
 * 2. LAYOUT DA REFERÊNCIA — raio 2 px (não cápsula), trilha a 16 %
 *    (`--ds-color-action-selected`), preenchimento no verde a 80 %
 *    (`rgba(0,120,103,0.8)`, a cor mais recorrente do catálogo) e largura
 *    proporcional ao valor, animada com os 360 ms do motion.
 * 3. COR SEMÂNTICA — `variant` mapeia para a variante do sistema e um acento
 *    preenchido vence o variant, virando a cor de série do tema.
 * 4. CONTRATO COMUM — o rótulo aceita Markdown e `{{variavel}}`.
 * 5. CARREGANDO, SEM DADOS E ERRO — nenhum dos três é área em branco.
 *
 * Consultas por PAPEL e por atributo de dado: as classes são hashes do StyleX.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** A variante é refletida como atributo de dado pelo próprio bloco. */
function variantOf(container: HTMLElement): string | null {
  return container.querySelector('[data-variant]')?.getAttribute('data-variant') ?? null;
}

/** Estilo do trilho (fundo) e do preenchimento (a barra de valor). */
function barStyles(container: HTMLElement): { track: string; fill: string } {
  const track = container.querySelector('[data-slot="chart-bar-track"]');
  return {
    track: track?.getAttribute('style') ?? '',
    fill: track?.querySelector('span')?.getAttribute('style') ?? '',
  };
}

describe('bloco progress_bar', () => {
  it('anuncia o progresso com rótulo e valor', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const bar = screen.getByRole('progressbar', { name: 'Uso da cota' });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '68%');
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
    // A leitura continua existindo para quem usa leitor de tela.
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '68%');
  });

  it('desenha a barra da referência: raio 2px, trilha de 16% e verde a 80%', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    const { track, fill } = barStyles(container);

    expect(track).toContain('border-radius: 2px');
    expect(track).toContain('background-color: var(--ds-color-action-selected)');
    expect(fill).toContain('border-radius: 2px');
    expect(fill).toContain('background-color: rgba(0, 120, 103, 0.8)');
  });

  it('dá à barra a largura do valor, animada com a duração do motion', () => {
    const { container } = renderWithProviders(
      <Block props={{ max: 200 }} data={{ value: 50 }} state="success" />,
    );
    const { fill } = barStyles(container);

    expect(fill).toContain('inline-size: 25%');
    expect(fill).toContain('transition: inline-size 360ms');
  });

  it('escreve rótulo e valor na tipografia da legenda própria', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);

    // 11,375/500 no rótulo e 14,875/600 no valor (`01-fundamentos.md` §4).
    const label = screen.getByText('Uso da cota').closest('span[style]');
    expect(label?.getAttribute('style')).toContain('font-size: 11.375px');
    expect(label?.getAttribute('style')).toContain('font-weight: 500');

    const value = screen.getByText('68%');
    expect(value.getAttribute('style')).toContain('font-size: 14.875px');
    expect(value.getAttribute('style')).toContain('font-weight: 600');
  });

  it('mapeia o variant antigo para a variante semântica do sistema', () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'error' }} data={fixture} state="success" />,
    );
    expect(variantOf(container)).toBe('error');
    expect(barStyles(container).fill).toContain(
      'background-color: var(--ds-color-error-main)',
    );
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
    // `chart-2` é a 2ª cor da paleta da referência: âmbar.
    expect(barStyles(container).fill).toContain(
      'background-color: var(--ds-color-warning-main)',
    );
  });

  it('resolve Markdown e {{variavel}} no rótulo', () => {
    const { container } = renderWithProviders(
      <Block
        props={{}}
        data={{ value: 68, label: '**Uso** da cota ({{valor}} de {{escala}})' }}
        state="success"
      />,
    );
    expect(container.querySelector('strong')).toHaveTextContent('Uso');
    expect(screen.getByText(/da cota \(68 de 100\)/)).toBeInTheDocument();
    // O mesmo texto, sem marcação, vira o nome acessível da região.
    expect(
      screen.getByRole('progressbar', { name: 'Uso da cota (68 de 100)' }),
    ).toBeInTheDocument();
  });

  it('cobre carregando, sem dados e erro', () => {
    const carregando = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    carregando.unmount();

    const vazio = renderWithProviders(
      <Block props={{}} data={{ value: null }} state="success" />,
    );
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    vazio.unmount();

    renderWithProviders(<Block props={{}} state="error" error="timeout" />);
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
  });
});
