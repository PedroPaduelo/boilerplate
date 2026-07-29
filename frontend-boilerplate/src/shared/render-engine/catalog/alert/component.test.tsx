/**
 * Regressão do bloco `alert` após a migração para o `Banner` do Astryx.
 *
 * O que importa aqui não é a aparência (classes do StyleX mudam a cada build),
 * e sim o CONTRATO OBSERVÁVEL: a severidade certa chega ao leitor de tela e o
 * botão de fechar continua fechando.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { Component } from './component';

afterEach(() => cleanup());

describe('bloco alert', () => {
  it('erro interrompe o leitor de tela (role=alert) com título e descrição', () => {
    renderWithProviders(
      <Component
        props={{
          variant: 'error',
          title: 'Falha na apuração',
          description: 'Tente de novo.',
        }}
        state="success"
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Falha na apuração');
    expect(alert).toHaveTextContent('Tente de novo.');
  });

  it('informativo apenas anuncia (role=status)', () => {
    renderWithProviders(
      <Component props={{ variant: 'info', title: 'Prazo alterado' }} state="success" />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Prazo alterado');
  });

  it('destructive herda a severidade de erro', () => {
    renderWithProviders(
      <Component
        props={{ variant: 'destructive', title: 'Ação irreversível' }}
        state="success"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Ação irreversível');
  });

  it('dismissible: o alerta some ao ser fechado', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Component props={{ title: 'Fecha comigo', dismissible: true }} state="success" />,
    );

    // "Dispensar": rótulo pt-BR do `Banner` (catálogo do DS). Antes era
    // /dismiss/i, que só passava porque o render de teste não tinha o i18n.
    await user.click(screen.getByRole('button', { name: /dispensar/i }));

    expect(screen.queryByText('Fecha comigo')).not.toBeInTheDocument();
  });

  it('sem dismissible não existe botão de fechar', () => {
    renderWithProviders(<Component props={{ title: 'Alerta fixo' }} state="success" />);

    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });
});
