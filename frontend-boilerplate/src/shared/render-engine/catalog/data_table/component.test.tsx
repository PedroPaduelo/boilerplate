/**
 * Regressão do bloco `data_table` após a migração para o `Table` do Astryx +
 * plugins headless e a repaginação visual (SUB-12). Busca, ordenação e
 * paginação mudaram de implementação — o comportamento visível não pode ter
 * mudado.
 *
 * Consulta por PAPEL (cell/columnheader/button/status/alert), nunca por classe:
 * os nomes de classe são hashes do StyleX e mudam a cada build.
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

  /* ---------------------------------------------------------------------- *
   * Contrato comum (briefing §5): markdown + {{variavel}} e estados
   * ---------------------------------------------------------------------- */

  it('rótulo de coluna resolve {{variavel}} sem perder o nome acessível', () => {
    renderWithProviders(
      <Component
        props={{ pageSize: 10 }}
        data={{
          columns: [{ key: 'municipio', label: 'Município ({{contagem}})' }],
          rows: [{ municipio: 'Centro' }, { municipio: 'Norte' }],
        }}
        state="success"
      />,
    );

    // O cabeçalho é um botão de ordenação: o rótulo precisa continuar sendo o
    // texto da coluna (e não a CHAVE dela) depois da interpolação.
    expect(screen.getByRole('button', { name: /Município \(2\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /municipio/ })).not.toBeInTheDocument();
  });

  it('célula de texto aceita Markdown; célula numérica sai intacta', () => {
    renderWithProviders(
      <Component
        props={{ pageSize: 10 }}
        data={{
          columns: [
            { key: 'municipio', label: 'Município', type: 'string' },
            { key: 'valor', label: 'Valor', type: 'number' },
          ],
          rows: [{ municipio: 'Centro *norte*', valor: 12345 }],
        }}
        state="success"
      />,
    );

    expect(screen.getByRole('cell', { name: 'Centro norte' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '12.345' })).toBeInTheDocument();
  });

  it('sem colunas: só o estado vazio (nada de busca sobre o nada)', () => {
    renderWithProviders(
      <Component props={{}} data={{ columns: [], rows: [] }} state="success" />,
    );

    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('carregando: esqueleto no lugar da tabela', () => {
    renderWithProviders(<Component props={{}} state="loading" />);

    expect(screen.getByRole('status', { name: /Carregando/ })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('erro: aviso no lugar da tabela (e não "sem dados")', () => {
    renderWithProviders(<Component props={{}} state="error" error="Consulta expirou" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao carregar o bloco');
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
