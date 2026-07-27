/**
 * Regressão do bloco `flip_words`.
 *
 * O ponto crítico da migração: no efeito legado só a palavra do instante
 * existia no DOM, então leitor de tela e busca da página perdiam as demais.
 * Aqui a lista INTEIRA precisa estar sempre presente, e a parte animada fica
 * marcada como decorativa.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const WORDS = ['claros', 'rápidos', 'acionáveis'];

afterEach(() => cleanup());

describe('bloco flip_words', () => {
  it('mantém o prefixo e TODAS as palavras no conteúdo acessível', () => {
    renderWithProviders(
      <definition.Component
        props={{ prefix: 'Dados que são', words: WORDS, duration: 2200 }}
        state="success"
      />,
    );

    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('Dados que são');
    for (const word of WORDS) {
      expect(heading).toHaveTextContent(word);
    }
  });

  it('marca a palavra animada como decorativa', () => {
    const { container } = renderWithProviders(
      <definition.Component props={{ words: WORDS }} state="success" />,
    );

    const effect = container.querySelector('[data-slot="flip-words"]');
    expect(effect).not.toBeNull();
    expect(effect?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
