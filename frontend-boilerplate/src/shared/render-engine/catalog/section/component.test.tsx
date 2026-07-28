/**
 * Regressão do bloco `section` — a região nomeada.
 *
 * Duas coisas são travadas aqui: o cabeçalho continua sendo um heading de
 * verdade (navegável por leitor de tela, não texto em negrito) e a seção
 * DEIXOU de ser um card por padrão — ela envolve blocos que já têm moldura.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { manifest } from './manifest';

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

  it('sem título, não inventa cabeçalho — vira um contêiner puro', () => {
    // O manifesto trazia `title: 'Seção'` em `defaultProps`, e o
    // `BlockRenderer` o mesclava em toda renderização: toda seção sem título
    // aparecia com um cabeçalho de fábrica.
    renderWithProviders(
      <Component props={{}} state="success">
        <p>sub-blocos</p>
      </Component>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('sub-blocos')).toBeInTheDocument();
  });

  it('título em branco também não vira cabeçalho', () => {
    renderWithProviders(
      <Component props={{ title: '   ' }} state="success">
        <p>sub-blocos</p>
      </Component>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('NÃO é um card por padrão; card continua disponível sob demanda', () => {
    const { container } = renderWithProviders(
      <Component props={{ title: 'Arrecadação' }} state="success">
        <p>sub-blocos</p>
      </Component>,
    );
    expect(
      container
        .querySelector('[data-slot="section"]')
        ?.getAttribute('data-block-surface'),
    ).toBe('plain');
    expect(manifest.defaultProps.variant).toBe('plain');

    cleanup();

    const card = renderWithProviders(
      <Component props={{ title: 'Arrecadação', variant: 'card' }} state="success">
        <p>sub-blocos</p>
      </Component>,
    );
    expect(
      card.container
        .querySelector('[data-slot="section"]')
        ?.getAttribute('data-block-surface'),
    ).toBe('card');
  });

  it('a região é um `<section>` de verdade (marco de navegação)', () => {
    const { container } = renderWithProviders(
      <Component props={{ title: 'Arrecadação' }} state="success">
        <p>sub-blocos</p>
      </Component>,
    );

    expect(container.querySelector('section[data-slot="section"]')).not.toBeNull();
  });

  it('sem filhos, mostra a composição ilustrativa', () => {
    renderWithProviders(<Component props={{ title: 'Seção' }} state="success" />);

    expect(screen.getByText('KPI')).toBeInTheDocument();
    expect(screen.getByText('Gráfico')).toBeInTheDocument();
    expect(screen.getByText('Tabela')).toBeInTheDocument();
  });
});
