/**
 * Regressão do bloco `divider` após a migração para o `Divider` do Astryx: o
 * rótulo central continua sendo rótulo do divisor (prop nativa) e a orientação
 * continua sendo respeitada.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco divider', () => {
  it('horizontal com rótulo central', () => {
    renderWithProviders(
      <Component props={{ label: 'Resumo do período' }} state="success" />,
    );

    expect(screen.getByText('Resumo do período')).toBeInTheDocument();
  });

  it('horizontal sem rótulo continua desenhando a linha', () => {
    const { container } = renderWithProviders(<Component props={{}} state="success" />);

    expect(
      container.querySelector('[data-divider-orientation="horizontal"]'),
    ).toBeInTheDocument();
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
});
