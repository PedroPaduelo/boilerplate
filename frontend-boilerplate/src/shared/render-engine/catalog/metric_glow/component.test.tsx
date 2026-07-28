/**
 * Regressão do bloco `metric_glow` depois da repaginação para o card de resumo
 * da referência (`04-widgets-prontos.md` §2).
 *
 * O que este arquivo trava:
 * 1. CARD PRÓPRIO — o bloco não recebe a moldura do motor; o título é dele.
 * 2. FORMATO — o default do catálogo é NÚMERO, não moeda (a moeda é escolha
 *    explícita via `valueFormat`).
 * 3. HALO — a forma decorativa continua existindo e continua ATRÁS do
 *    conteúdo (é o que distingue este bloco do KPI).
 * 4. CONTRATO COMUM — rótulo com Markdown e `{{variavel}}`.
 * 5. ESTADOS — carregando, vazio e erro.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

describe('bloco metric_glow', () => {
  it('desenha o próprio cabeçalho e o valor em número (não em moeda)', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('Receita do mês')).toBeInTheDocument();
    expect(screen.getByText('124.500')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="metric-glow-card"]')).toBeInTheDocument();
  });

  it('formata como moeda quando o bloco declara o formato', () => {
    renderWithProviders(
      <Block props={{ valueFormat: 'compactBRL' }} data={fixture} state="success" />,
    );

    expect(screen.getByText('R$ 124,50 mil')).toBeInTheDocument();
  });

  it('mantém o halo como forma decorativa atrás do conteúdo', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    const decoration = container.querySelector('[data-slot="summary-card-decoration"]');
    expect(decoration).toBeInTheDocument();
    expect(decoration).toHaveAttribute('aria-hidden', 'true');
    expect(
      decoration?.querySelector('[data-slot="metric-glow-halo"]'),
    ).toBeInTheDocument();
  });

  it('o rótulo aceita Markdown e {{variavel}} dos dados', () => {
    renderWithProviders(
      <Block
        props={{ label: 'Receita em **{{unidade}}**' }}
        data={fixture}
        state="success"
      />,
    );

    const emphasis = screen.getByText('BRL');
    expect(emphasis.tagName.toLowerCase()).toBe('strong');
  });

  it('ancora a variação no canto do card, com sinal explícito', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );

    expect(screen.getByText('+12,5%')).toBeInTheDocument();
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

  it('carregando: mantém o título e troca o número por esqueleto', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="loading" />);

    expect(screen.getByText('Receita do mês')).toBeInTheDocument();
    expect(screen.queryByText('124.500')).not.toBeInTheDocument();
  });

  it('vazio: diz que não há dado em vez de mostrar zero', () => {
    renderWithProviders(<Block props={{}} data={undefined} state="empty" />);

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument();
  });

  it('erro: mostra o aviso e o detalhe recebido', () => {
    renderWithProviders(
      <Block props={{}} data={undefined} state="error" error="consulta inválida" />,
    );

    expect(screen.getByText('Erro ao carregar os dados')).toBeInTheDocument();
    expect(screen.getByText('consulta inválida')).toBeInTheDocument();
  });
});
