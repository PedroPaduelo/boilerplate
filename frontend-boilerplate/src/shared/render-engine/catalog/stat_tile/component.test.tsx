/**
 * Regressão do bloco `stat_tile` depois da repaginação para o card de resumo
 * da referência (`04-widgets-prontos.md` §2).
 *
 * O que este arquivo trava:
 * 1. CARD PRÓPRIO — o bloco não recebe a moldura do motor, então o título é
 *    responsabilidade dele.
 * 2. FORMATO — o default do ladrilho é número compacto, não moeda.
 * 3. CONTRATO COMUM — rótulo e texto auxiliar aceitam Markdown e
 *    `{{variavel}}` resolvida a partir dos dados.
 * 4. TENDÊNCIA — bloco ancorado no canto, com `+` no positivo, colorido pela
 *    leitura de negócio (`deltaPolarity`).
 * 5. ESTADOS — carregando, vazio e erro.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

describe('bloco stat_tile', () => {
  it('desenha o próprio cabeçalho e o valor em número compacto', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('Eventos hoje')).toBeInTheDocument();
    expect(screen.getByText('8,42 mil')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="stat-tile"]')).toBeInTheDocument();
  });

  it('o texto auxiliar aceita Markdown e {{variavel}} dos dados', () => {
    renderWithProviders(
      <Block
        props={{ hint: 'de **{{total}}** no período' }}
        data={fixture}
        state="success"
      />,
    );

    // `{{total}}` sai cru abaixo de 10 mil (é a regra do interpolador: ano e
    // código são os números pequenos que mais aparecem num rótulo).
    const emphasis = screen.getByText('8420');
    expect(emphasis).toBeInTheDocument();
    expect(emphasis.tagName.toLowerCase()).toBe('strong');
  });

  it('ancora a variação no canto do card, com sinal explícito', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('+6%')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="summary-card-trend"]'),
    ).toBeInTheDocument();
  });

  it('marca a alta como piora quando subir é ruim', () => {
    const { container } = renderWithProviders(
      <Block props={{ deltaPolarity: 'up-bad' }} data={fixture} state="success" />,
    );

    expect(container.querySelector('[data-slot="delta-badge"]')).toHaveAttribute(
      'data-variant',
      'error',
    );
  });

  it('esconde a variação quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showDelta: false }} data={fixture} state="success" />,
    );

    expect(screen.queryByText('+6%')).not.toBeInTheDocument();
  });

  it('carregando: mantém o título e troca o número por esqueleto', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="skeleton" />);

    expect(screen.getByText('Eventos hoje')).toBeInTheDocument();
    expect(screen.queryByText('8,42 mil')).not.toBeInTheDocument();
  });

  it('vazio: diz que não há dado em vez de mostrar zero', () => {
    renderWithProviders(<Block props={{}} data={undefined} state="empty" />);

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument();
  });

  it('erro: mostra o aviso e o detalhe recebido', () => {
    renderWithProviders(
      <Block props={{}} data={undefined} state="error" error="conexão recusada" />,
    );

    expect(screen.getByText('Erro ao carregar os dados')).toBeInTheDocument();
    expect(screen.getByText('conexão recusada')).toBeInTheDocument();
  });
});
