/**
 * Regressão do bloco `expandable_cards` — o único do lote decorativo com
 * ESTADO (abrir/fechar) e, por isso, o que mais pode regredir.
 *
 * Cobre o comportamento que a migração prometeu manter:
 *  - a grade colapsada mostra um card por filho, com nome acessível;
 *  - o card anuncia que abre um diálogo e reflete o estado (`aria-expanded`);
 *  - clicar expande o conteúdo do card CERTO num modal;
 *  - Esc e o botão de fechar voltam para a grade;
 *  - a miniatura do card é decorativa (não é ela que carrega o conteúdo).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ExpandableCards } from './expandable-cards';
import type { ExpandableCardItem } from './types';

const ITEMS: ExpandableCardItem[] = [
  {
    id: 'arrecadacao',
    title: 'Arrecadação',
    subtitle: 'Bar Chart',
    preview: <span>miniatura</span>,
    content: <p>corpo da arrecadação</p>,
  },
  {
    id: 'divida',
    title: 'Dívida ativa',
    subtitle: 'Donut',
    content: <p>corpo da dívida</p>,
  },
];

function renderGrid() {
  return renderWithProviders(<ExpandableCards items={ITEMS} columns={2} gap="md" />);
}

afterEach(() => cleanup());

describe('bloco expandable_cards — grade colapsada', () => {
  it('mostra um card por item, com nome acessível e subtítulo', () => {
    renderGrid();

    expect(screen.getByRole('button', { name: 'Arrecadação' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dívida ativa' })).toBeInTheDocument();
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
  });

  it('anuncia que o card abre um diálogo e começa fechado', () => {
    const { container } = renderGrid();

    const cards = container.querySelectorAll('[data-slot="expandable-card"]');
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card).toHaveAttribute('aria-haspopup', 'dialog');
      expect(card).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('mantém a miniatura como decoração', () => {
    const { container } = renderGrid();

    const preview = container.querySelector('[data-slot="expandable-card-preview"]');
    expect(preview).not.toBeNull();
    expect(preview).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('bloco expandable_cards — expandir e fechar', () => {
  it('abre o conteúdo do card clicado num diálogo', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid();

    expect(screen.queryByText('corpo da arrecadação')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Arrecadação' }));

    expect(screen.getByText('corpo da arrecadação')).toBeInTheDocument();
    expect(screen.queryByText('corpo da dívida')).not.toBeInTheDocument();

    const opened = container.querySelector('[data-slot="expandable-card"]');
    expect(opened).toHaveAttribute('aria-expanded', 'true');
  });

  it('fecha com a tecla Esc', async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole('button', { name: 'Dívida ativa' }));
    expect(screen.getByText('corpo da dívida')).toBeInTheDocument();

    const dialog = document.querySelector('dialog');
    expect(dialog).not.toBeNull();
    fireEvent.keyDown(dialog as Element, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByText('corpo da dívida')).not.toBeInTheDocument();
  });

  it('fecha pelo botão de fechar do cabeçalho', async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole('button', { name: 'Arrecadação' }));
    expect(screen.getByText('corpo da arrecadação')).toBeInTheDocument();

    const close = screen
      .getAllByRole('button')
      .find((button) => /fechar|close/i.test(button.getAttribute('aria-label') ?? ''));
    expect(close).toBeDefined();

    await user.click(close as HTMLElement);
    expect(screen.queryByText('corpo da arrecadação')).not.toBeInTheDocument();
  });
});
