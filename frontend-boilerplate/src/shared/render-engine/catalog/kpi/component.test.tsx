/**
 * Regressão do bloco `kpi` depois da repaginação para o card de resumo da
 * referência (`04-widgets-prontos.md` §2).
 *
 * O que este arquivo trava:
 * 1. CARD PRÓPRIO — o bloco não recebe a moldura do motor, então o título é
 *    responsabilidade dele: `label` (ou `data.label`) tem de aparecer.
 * 2. CONTRATO COMUM — rótulo com Markdown e `{{variavel}}` resolvida a partir
 *    dos dados.
 * 3. TENDÊNCIA — vira o bloco ancorado no canto, com `+` no positivo, e a cor
 *    continua sendo LEITURA DE NEGÓCIO (`deltaPolarity`), não o sinal.
 * 4. ESTADOS — carregando, vazio e erro; nenhum deles é área em branco.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

describe('bloco kpi', () => {
  it('desenha o próprio cabeçalho e o valor formatado pela unidade', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('Total arrecadado')).toBeInTheDocument();
    expect(screen.getByText('R$ 1,28 mi')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="kpi-card"]')).toBeInTheDocument();
  });

  it('o rótulo aceita Markdown e {{variavel}} dos dados', () => {
    renderWithProviders(
      <Block
        props={{ label: 'Total em **{{unidade}}**' }}
        data={fixture}
        state="success"
      />,
    );

    const emphasis = screen.getByText('BRL');
    expect(emphasis).toBeInTheDocument();
    expect(emphasis.tagName.toLowerCase()).toBe('strong');
  });

  it('ancora a variação no canto do card, com sinal explícito', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="summary-card-trend"]'),
    ).toBeInTheDocument();
  });

  it('marca a alta como piora quando subir é ruim', () => {
    const { container } = renderWithProviders(
      <Block props={{ deltaPolarity: 'up-bad' }} data={fixture} state="success" />,
    );

    const trend = container.querySelector('[data-slot="delta-badge"]');
    expect(trend).toHaveAttribute('data-variant', 'error');
  });

  it('esconde a variação quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showDelta: false }} data={fixture} state="success" />,
    );

    expect(screen.queryByText('+12%')).not.toBeInTheDocument();
  });

  it('reserva a caixa de 48×48 quando há ícone', () => {
    const { container } = renderWithProviders(
      <Block props={{ icon: 'DollarSign' }} data={fixture} state="success" />,
    );

    expect(
      container.querySelector('[data-slot="summary-card-icon"]'),
    ).toBeInTheDocument();
  });

  it('carregando: mantém o título e troca o número por esqueleto', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="loading" />);

    expect(screen.getByText('Total arrecadado')).toBeInTheDocument();
    expect(screen.queryByText('R$ 1,28 mi')).not.toBeInTheDocument();
  });

  it('vazio: diz que não há dado em vez de mostrar zero', () => {
    renderWithProviders(<Block props={{}} data={undefined} state="empty" />);

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument();
  });

  it('erro: mostra o aviso e o detalhe recebido', () => {
    renderWithProviders(
      <Block props={{}} data={undefined} state="error" error="timeout na consulta" />,
    );

    expect(screen.getByText('Erro ao carregar os dados')).toBeInTheDocument();
    expect(screen.getByText('timeout na consulta')).toBeInTheDocument();
  });
});
