/**
 * Regressão do bloco `table` após a migração para o `Table` do Astryx e a
 * repaginação visual (SUB-12).
 *
 * Consulta por PAPEL (columnheader/cell/table/status/alert) em vez de classe:
 * os nomes de classe são gerados pelo StyleX e mudam a cada build.
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

  /* ---------------------------------------------------------------------- *
   * Contrato comum (briefing §5): markdown + {{variavel}} e estados
   * ---------------------------------------------------------------------- */

  it('rótulo de coluna aceita Markdown e {{variavel}} dos dados', () => {
    renderWithProviders(
      <Component
        props={{}}
        data={{
          columns: [
            { key: 'municipio', label: '**Município** ({{contagem}})', type: 'string' },
          ],
          rows: [{ municipio: 'Centro' }, { municipio: 'Norte' }],
        }}
        state="success"
      />,
    );

    // Se o markdown/interpolação não tivessem rodado, o nome acessível ainda
    // traria os asteriscos e o `{{contagem}}` cru.
    expect(
      screen.getByRole('columnheader', { name: 'Município (2)' }),
    ).toBeInTheDocument();
  });

  it('célula de texto aceita Markdown; célula numérica sai intacta', () => {
    renderWithProviders(
      <Component
        props={{}}
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

  it('coluna numérica alinha à direita na CÉLULA (texto segue em linha)', () => {
    renderWithProviders(<Component props={{}} data={fixture} state="success" />);

    // O alinhamento fica no `<td>`/`<th>` — é assim que o corte com reticências
    // do DS continua valendo (ele só age sobre conteúdo em linha).
    expect(screen.getByRole('cell', { name: '2.400' }).getAttribute('style')).toContain(
      'text-align: end',
    );
    expect(
      screen.getByRole('columnheader', { name: 'Valor' }).getAttribute('style'),
    ).toContain('text-align: end');
    expect(
      screen.getByRole('cell', { name: 'Norte' }).getAttribute('style') ?? '',
    ).not.toContain('text-align');
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
