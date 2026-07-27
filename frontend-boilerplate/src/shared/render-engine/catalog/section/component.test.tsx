/**
 * Regressão do bloco `section` após a migração para `Section` + `Layout`: o
 * cabeçalho continua sendo um heading de verdade (não texto em negrito) e os
 * filhos continuam no corpo.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const Component = definition.Component;

afterEach(() => cleanup());

describe('bloco section', () => {
  it('desenha título, subtítulo e os filhos', () => {
    renderWithProviders(
      <Component
        props={{ title: 'Sumário executivo', subtitle: 'Visão geral do período' }}
        state="success"
      >
        <p>sub-blocos</p>
      </Component>,
    );

    expect(
      screen.getByRole('heading', { name: 'Sumário executivo' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Visão geral do período')).toBeInTheDocument();
    expect(screen.getByText('sub-blocos')).toBeInTheDocument();
  });

  it('sem subtítulo, só o título aparece', () => {
    renderWithProviders(
      <Component props={{ title: 'Detalhamento' }} state="success">
        <p>sub-blocos</p>
      </Component>,
    );

    expect(screen.getByRole('heading', { name: 'Detalhamento' })).toBeInTheDocument();
  });

  it('sem filhos, mostra a composição ilustrativa', () => {
    renderWithProviders(<Component props={{ title: 'Seção' }} state="success" />);

    expect(screen.getByText('KPI')).toBeInTheDocument();
    expect(screen.getByText('Gráfico')).toBeInTheDocument();
    expect(screen.getByText('Tabela')).toBeInTheDocument();
  });
});
