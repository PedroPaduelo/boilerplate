/**
 * Regressão do bloco `progress_circle` depois da repaginação para o vocabulário
 * dos circulares da referência (rosca §10 + medidores §11–§13).
 *
 * O que este arquivo trava:
 * 1. VALOR DE VERDADE — o anel se anuncia como `progressbar` com valor, mínimo
 *    e máximo; o percentual não existe só como desenho.
 * 2. LAYOUT DA REFERÊNCIA — volta completa, trilha de 16%
 *    (`--ds-color-action-selected`), valor central 17,5px/700 e "Total"
 *    12,25px/600 na cor de rótulo (`01-fundamentos.md` §4).
 * 3. TOM SEMÂNTICO — `variant` mapeia para o tom do sistema e um `accent`
 *    preenchido vence o variant, virando o tom de destaque.
 * 4. LEITURA COMPLETA — com escala própria, a leitura diz "X% (v de max)".
 * 5. CONTRATO COMUM — rótulo aceita `{{variavel}}`; carregando, sem dados e
 *    erro nunca viram área em branco.
 *
 * Consultas por PAPEL e por atributo de dado — nunca por classe (os nomes são
 * hashes do StyleX).
 */
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Preenchimentos usados no desenho (trilha e arco de valor). */
function fills(container: HTMLElement): string[] {
  return [...container.querySelectorAll('path[fill]')].map(
    (path) => path.getAttribute('fill') ?? '',
  );
}

describe('bloco progress_circle — leitura e acessibilidade', () => {
  it('anuncia o anel como progressbar, com valor e escala', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const bar = screen.getByRole('progressbar', { name: 'Conclusão' });

    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '75% — Conclusão');
  });

  it('escreve o percentual e o rótulo no centro do anel', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Conclusão')).toBeInTheDocument();
  });

  it('usa "Total" quando o dado não traz rótulo', () => {
    renderWithProviders(<Block props={{}} data={{ value: 40 }} state="success" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('explicita "X de Y" quando a escala não é percentual', () => {
    renderWithProviders(
      <Block
        props={{ max: 500 }}
        data={{ value: 125, label: 'Processos' }}
        state="success"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Processos' });

    expect(bar).toHaveAttribute('aria-valuemax', '500');
    expect(screen.getByText('25%')).toBeInTheDocument();
    // A leitura completa fica no equivalente textual, para leitor de tela.
    expect(screen.getByText('25% (125 de 500)')).toBeInTheDocument();
  });
});

describe('bloco progress_circle — layout dos circulares', () => {
  it('usa a trilha de 16% da referência', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    expect(fills(container)).toContain('rgba(145 158 171 / 0.16)');
  });

  it('escreve o valor em 17,5px/700 e o "Total" em 12,25px/600', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);

    const value = screen.getByText('75%');
    expect(value).toHaveAttribute('font-size', '17.5');
    expect(value).toHaveAttribute('font-weight', '700');
    expect(value).toHaveAttribute('fill', '#1C252E');

    const total = screen.getByText('Conclusão');
    expect(total).toHaveAttribute('font-size', '12.25');
    expect(total).toHaveAttribute('font-weight', '600');
    expect(total).toHaveAttribute('fill', '#637381');
  });

  // O arco de valor entra ANIMADO (360ms), então a cor só existe no DOM depois
  // que a entrada roda — esperar por ela também prova que a animação acontece.
  it('pinta o anel com o tom semântico do variant', async () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'error' }} data={fixture} state="success" />,
    );
    await waitFor(() => expect(fills(container)).toContain('#FF5630'));
  });

  it('deixa o acento preenchido vencer o variant, no tom de destaque', async () => {
    const { container } = renderWithProviders(
      <Block
        props={{ variant: 'error', accent: 'chart-2' }}
        data={fixture}
        state="success"
      />,
    );
    await waitFor(() => expect(fills(container)).toContain('#00A76F'));
    expect(fills(container)).not.toContain('#FF5630');
  });
});

describe('bloco progress_circle — contrato comum', () => {
  it('resolve {{variavel}} no rótulo e no nome acessível', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={{ value: 75, label: '{{valor}} de cobertura' }}
        state="success"
      />,
    );
    expect(
      screen.getByRole('progressbar', { name: '75 de cobertura' }),
    ).toBeInTheDocument();
    expect(screen.getByText('75 de cobertura')).toBeInTheDocument();
  });

  it('cobre carregando, sem dados e erro', () => {
    const carregando = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    carregando.unmount();

    const vazio = renderWithProviders(
      <Block props={{}} data={{ value: null }} state="success" />,
    );
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    vazio.unmount();

    renderWithProviders(<Block props={{}} state="error" error="Consulta expirou" />);
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});
