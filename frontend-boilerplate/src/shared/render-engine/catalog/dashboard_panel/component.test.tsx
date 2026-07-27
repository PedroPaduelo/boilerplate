/**
 * Regressão do bloco `dashboard_panel`: a regra de "título explícito" — que
 * evita cabeçalho duplicado quando o painel está dentro de uma seção homônima
 * — sobreviveu à troca do painel legado por `Card`/`Section` + `Layout`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco dashboard_panel', () => {
  it('título explícito vira cabeçalho com descrição', () => {
    renderWithProviders(
      <Component
        props={{ title: 'Arrecadação consolidada', description: 'Indicadores do mês' }}
        state="success"
      >
        <p>filhos</p>
      </Component>,
    );

    expect(
      screen.getByRole('heading', { name: 'Arrecadação consolidada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Indicadores do mês')).toBeInTheDocument();
    expect(screen.getByText('filhos')).toBeInTheDocument();
  });

  it('título default ("Painel") não vira cabeçalho — só o corpo', () => {
    renderWithProviders(
      <Component props={{ title: 'Painel' }} state="success">
        <p>filhos</p>
      </Component>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('filhos')).toBeInTheDocument();
  });

  it('título vazio não vira cabeçalho', () => {
    renderWithProviders(
      <Component props={{ title: '   ' }} state="success">
        <p>filhos</p>
      </Component>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('sem filhos, mostra a grade ilustrativa de indicadores', () => {
    renderWithProviders(<Component props={{ title: 'Arrecadação' }} state="success" />);

    expect(screen.getAllByText('KPI')).toHaveLength(4);
    expect(screen.getByText('Donut')).toBeInTheDocument();
  });
});
