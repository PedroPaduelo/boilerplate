/**
 * O contrato deste editor em uma frase: uma prop declarada como `array` no
 * `propsSchema` SEMPRE sai como array.
 *
 * Era exatamente isso que faltava: o editor genérico devolvia string, e os
 * blocos que iteram a lista (`flip_words`, `resizable_panels`, `card_hover`)
 * quebravam — um deles derrubando a aplicação inteira.
 */
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { PropFieldEditor } from '../prop-field-editor';

describe('prop do tipo array no playground', () => {
  it('lista de textos: digitar emite um array, nunca a string digitada', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PropFieldEditor
        field={{
          key: 'words',
          schema: { type: 'array', items: { type: 'string' } },
          required: true,
        }}
        value={['claros']}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText(/words/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'auditáveis, confiáveis');

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(Array.isArray(last)).toBe(true);
    expect(last).toEqual(['auditáveis', 'confiáveis']);
  });

  it('lista de números: converte para number', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PropFieldEditor
        field={{
          key: 'defaultSizes',
          schema: { type: 'array', items: { type: 'number' } },
          required: false,
        }}
        value={[]}
        onChange={onChange}
      />,
    );

    await userEvent.type(screen.getByLabelText(/defaultSizes/i), '70, 30');

    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([70, 30]);
  });

  it('lista de números: item não numérico vira erro e NÃO propaga valor', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PropFieldEditor
        field={{
          key: 'defaultSizes',
          schema: { type: 'array', items: { type: 'number' } },
          required: false,
        }}
        value={[50, 50]}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText(/defaultSizes/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'abc');

    expect(screen.getByText(/não é um número/)).toBeInTheDocument();
    // O último valor propagado nunca é a string inválida.
    for (const [emitted] of onChange.mock.calls) {
      expect(Array.isArray(emitted)).toBe(true);
    }
  });

  it('lista de objetos: edita como JSON e emite o array parseado', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PropFieldEditor
        field={{
          key: 'items',
          schema: { type: 'array', items: { type: 'object' } },
          required: false,
        }}
        value={[{ title: 'Antigo' }]}
        onChange={onChange}
      />,
    );

    const area = screen.getByLabelText(/items/i);
    await userEvent.clear(area);
    await userEvent.paste('[{"title":"Novo"}]');

    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([{ title: 'Novo' }]);
  });

  it('lista de objetos: JSON que não é lista vira erro explícito', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PropFieldEditor
        field={{
          key: 'items',
          schema: { type: 'array', items: { type: 'object' } },
          required: false,
        }}
        value={[]}
        onChange={onChange}
      />,
    );

    const area = screen.getByLabelText(/items/i);
    await userEvent.clear(area);
    await userEvent.paste('{"title":"não é lista"}');

    expect(screen.getByText(/precisa ser uma lista JSON/)).toBeInTheDocument();
  });
});
