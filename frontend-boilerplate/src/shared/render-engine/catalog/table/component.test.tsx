/**
 * Regressão do bloco `table` após a migração para o `Table` do Astryx.
 *
 * Consulta por PAPEL (columnheader/cell/table) em vez de classe: os nomes de
 * classe são gerados pelo StyleX e mudam a cada build.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { fixture } from './fixture';

afterEach(() => cleanup());

describe('bloco table', () => {
  it('desenha os cabeçalhos e as células do contrato de dados', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    expect(screen.getByRole('columnheader', { name: 'Município' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Norte' })).toBeInTheDocument();
  });

  it('formata número no padrão pt-BR', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    expect(screen.getByRole('cell', { name: '2.400' })).toBeInTheDocument();
  });

  it('pageSize corta as linhas exibidas', () => {
    renderWithProviders(
      <Component props={{ pageSize: 1 }} data={fixture} state="success" />,
    );

    expect(screen.getByRole('cell', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Norte' })).not.toBeInTheDocument();
  });

  it('vazio: mantém o cabeçalho e explica que não há linhas', () => {
    renderWithProviders(
      <Component
        props={{}}
        data={{ columns: fixture.columns, rows: [] }}
        state="success"
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Município' })).toBeInTheDocument();
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('sem colunas: só o estado vazio (nada de tabela oca)', () => {
    renderWithProviders(
      <Component props={{}} data={{ columns: [], rows: [] }} state="success" />,
    );

    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
