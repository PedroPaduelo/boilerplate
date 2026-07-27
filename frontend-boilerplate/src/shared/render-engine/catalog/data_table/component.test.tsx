/**
 * Regressão do bloco `data_table` após a migração para o `Table` do Astryx +
 * plugins headless. Busca, ordenação e paginação mudaram de implementação —
 * o comportamento visível não pode ter mudado.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { fixture } from './fixture';

afterEach(() => cleanup());

describe('bloco data_table', () => {
  it('mostra a página inicial com o tamanho pedido', () => {
    renderWithProviders(
      <Component props={{ pageSize: 2 }} data={fixture} state="success" />,
    );

    expect(screen.getByRole('cell', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Norte' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Sul' })).not.toBeInTheDocument();
  });

  it('a busca filtra as linhas e atualiza a contagem', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Component props={{ pageSize: 10 }} data={fixture} state="success" />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filtrar registros' }), 'centro');

    expect(screen.getByRole('cell', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Norte' })).not.toBeInTheDocument();
    expect(screen.getByText('1 registro(s)')).toBeInTheDocument();
  });

  it('busca sem resultado: o estado vazio aponta o filtro como causa', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Component props={{ pageSize: 10 }} data={fixture} state="success" />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filtrar registros' }), 'zzz');

    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
    expect(
      screen.getByText('Ajuste o filtro para ver outros registros.'),
    ).toBeInTheDocument();
  });

  it('sem linhas: o estado vazio aponta a consulta como causa', () => {
    renderWithProviders(
      <Component
        props={{}}
        data={{ columns: fixture.columns, rows: [] }}
        state="success"
      />,
    );

    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
    expect(
      screen.getByText('A consulta deste bloco não retornou linhas.'),
    ).toBeInTheDocument();
  });

  it('o cabeçalho ordena a coluna (ordenação clicável)', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Component props={{ pageSize: 2 }} data={fixture} state="success" />,
    );

    await user.click(screen.getByRole('button', { name: /Município/ }));

    // Ascendente por município: "Centro" e "Industrial" vêm antes de "Norte".
    expect(screen.getByRole('cell', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Industrial' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Norte' })).not.toBeInTheDocument();
  });
});
