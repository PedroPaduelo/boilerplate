/**
 * O bloco `grid` é uma DIV em volta — e este teste existe para que ele continue
 * sendo.
 *
 * A regra que se trava aqui é a mais fácil de perder de vista numa
 * repaginação: um contêiner de layout não desenha card por padrão. Card em
 * volta de blocos que já são cards empilha moldura sobre moldura e soma padding
 * a cada nível de aninhamento.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { manifest } from './manifest';

afterEach(() => cleanup());

function surfaceOf(container: HTMLElement): string | undefined {
  return container
    .querySelector('[data-slot="grid"]')
    ?.getAttribute('data-block-surface')
    ?.toString();
}

describe('bloco grid — superfície', () => {
  it('por padrão NÃO é um card: nenhuma pintura em volta', () => {
    const { container } = renderWithProviders(
      <Component props={{}} state="success">
        <p>filhos</p>
      </Component>,
    );

    expect(surfaceOf(container)).toBe('plain');
  });

  it('o manifesto entrega esse mesmo padrão ao agente', () => {
    // O `BlockRenderer` mescla `defaultProps` em toda renderização: se o
    // default aqui fosse `card`, todo grid nasceria emoldurado.
    expect(manifest.defaultProps.variant).toBe('plain');
  });

  it('card e moldura continuam disponíveis quando pedidos', () => {
    const card = renderWithProviders(
      <Component props={{ variant: 'card' }} state="success">
        <p>filhos</p>
      </Component>,
    );
    expect(surfaceOf(card.container)).toBe('card');

    cleanup();

    const framed = renderWithProviders(
      <Component props={{ variant: 'framed' }} state="success">
        <p>filhos</p>
      </Component>,
    );
    expect(surfaceOf(framed.container)).toBe('framed');
  });

  it('variante desconhecida degrada para `plain` em vez de derrubar o bloco', () => {
    // As props chegam de um JSON gerado por IA.
    const { container } = renderWithProviders(
      <Component props={{ variant: 'neon' as never }} state="success">
        <p>filhos</p>
      </Component>,
    );

    expect(surfaceOf(container)).toBe('plain');
  });
});

describe('bloco grid — conteúdo', () => {
  it('coloca no corpo a grade que o motor montou', () => {
    renderWithProviders(
      <Component props={{}} state="success">
        <p>grade de filhos</p>
      </Component>,
    );

    expect(screen.getByText('grade de filhos')).toBeInTheDocument();
  });

  it('sem filhos, mostra células de exemplo do MESMO tamanho', () => {
    const { container } = renderWithProviders(<Component props={{}} state="success" />);

    expect(screen.getAllByText('Gráfico')).toHaveLength(2);
    expect(screen.getByText('Tabela')).toBeInTheDocument();

    // Nenhuma célula do exemplo reivindica largura própria — o exemplo mostra
    // o comportamento real, não um desenho à parte.
    const placeholder = container.querySelector('[data-slot="grid-placeholder"]');
    expect(placeholder).not.toBeNull();
    for (const cell of placeholder?.children ?? []) {
      expect((cell as HTMLElement).style.gridColumn).toBe('');
    }
  });
});
