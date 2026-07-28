/**
 * Regressão do bloco `divider`: o rótulo central continua sendo rótulo do
 * divisor (prop nativa do DS), a orientação continua sendo respeitada — e o
 * rótulo DEIXOU de ter texto de fábrica.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';
import { manifest } from './manifest';

afterEach(() => cleanup());

/**
 * Os defaults exatamente como o `BlockRenderer` os mescla. O manifesto é
 * tipado como JSON genérico (`string`), então o cast só recupera os literais
 * que o componente declara — não afrouxa nada.
 */
const DEFAULTS = manifest.defaultProps as {
  orientation: 'horizontal' | 'vertical';
  spacing: 'sm' | 'md' | 'lg';
};

describe('bloco divider', () => {
  it('horizontal com rótulo central', () => {
    renderWithProviders(
      <Component props={{ label: 'Resumo do período' }} state="success" />,
    );

    expect(screen.getByText('Resumo do período')).toBeInTheDocument();
  });

  it('sem rótulo, desenha a linha LIMPA — nada de texto de fábrica', () => {
    // O manifesto trazia `label: 'Resumo do período'` em `defaultProps`, e o
    // `BlockRenderer` mescla `defaultProps` em toda renderização: todo divisor
    // do produto nascia com esse texto no meio da linha.
    expect(manifest.defaultProps).not.toHaveProperty('label');

    // Renderiza com EXATAMENTE o que o `BlockRenderer` mescla quando o layout
    // não traz props — é aí que um default de fábrica apareceria.
    const { container } = renderWithProviders(
      <Component props={{ ...DEFAULTS }} state="success" />,
    );

    expect(
      container.querySelector('[data-divider-orientation="horizontal"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Resumo do período')).not.toBeInTheDocument();
  });

  it('vertical separa os dois lados', () => {
    const { container } = renderWithProviders(
      <Component props={{ orientation: 'vertical' }} state="success" />,
    );

    expect(screen.getByText('Antes')).toBeInTheDocument();
    expect(screen.getByText('Depois')).toBeInTheDocument();
    expect(
      container.querySelector('[data-divider-orientation="vertical"]'),
    ).toBeInTheDocument();
  });

  it('`spacing` muda o respiro em volta da linha', () => {
    // O respiro era fixo em 6 passos (48px) nos dois lados — num relatório
    // denso, cada divisor abria um buraco maior que o intervalo do grid.
    const compacto = renderWithProviders(
      <Component props={{ spacing: 'sm' }} state="success" />,
    );
    const compactoClass =
      compacto.container.querySelector('[data-slot="divider"]')?.className ?? '';

    cleanup();

    const espacado = renderWithProviders(
      <Component props={{ spacing: 'lg' }} state="success" />,
    );
    const espacadoClass =
      espacado.container.querySelector('[data-slot="divider"]')?.className ?? '';

    expect(compactoClass).not.toBe(espacadoClass);
  });
});
