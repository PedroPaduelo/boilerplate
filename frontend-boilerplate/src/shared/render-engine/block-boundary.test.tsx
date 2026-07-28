/**
 * Regressão do incidente que motivou a cerca: uma prop no tipo errado derrubava
 * a aplicação inteira em vez de estragar só o bloco.
 *
 * Reprodução original: no playground do catálogo, editar a prop `words` do
 * bloco `flip_words` gravava uma string onde o componente faz `words.join(...)`.
 * O `TypeError` subia até a raiz e a página virava "Unexpected Application
 * Error". O que estes testes travam é o COMPORTAMENTO esperado — bloco quebrado
 * é um bloco, não a tela.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { BlockBoundary } from './block-boundary';

function Exploding({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('words.join is not a function');
  return <div>gráfico desenhado</div>;
}

describe('BlockBoundary (cerca de contenção de um bloco)', () => {
  beforeEach(() => {
    // React registra o erro capturado no console; silenciar mantém a saída do
    // teste legível sem esconder falhas reais (o assert é sobre o que renderiza).
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra o aviso no lugar do bloco, com o tipo e a causa', () => {
    renderWithProviders(
      <BlockBoundary type="flip_words">
        <Exploding shouldThrow />
      </BlockBoundary>,
    );

    expect(screen.getByText(/Não foi possível desenhar este bloco/)).toBeInTheDocument();
    expect(screen.getByText(/flip_words/)).toBeInTheDocument();
    expect(screen.getByText(/words\.join is not a function/)).toBeInTheDocument();
  });

  it('preserva o resto da árvore quando um bloco quebra', () => {
    renderWithProviders(
      <div>
        <span>resto da página</span>
        <BlockBoundary type="flip_words">
          <Exploding shouldThrow />
        </BlockBoundary>
      </div>,
    );

    expect(screen.getByText('resto da página')).toBeInTheDocument();
  });

  it('não interfere quando o bloco renderiza normalmente', () => {
    renderWithProviders(
      <BlockBoundary type="bar_chart">
        <Exploding shouldThrow={false} />
      </BlockBoundary>,
    );

    expect(screen.getByText('gráfico desenhado')).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível desenhar/)).not.toBeInTheDocument();
  });

  it('volta a renderizar quando a configuração que quebrou muda (resetKey)', () => {
    const { rerender } = renderWithProviders(
      <BlockBoundary type="flip_words" resetKey="ruim">
        <Exploding shouldThrow />
      </BlockBoundary>,
    );
    expect(screen.getByText(/Não foi possível desenhar este bloco/)).toBeInTheDocument();

    rerender(
      <BlockBoundary type="flip_words" resetKey="corrigido">
        <Exploding shouldThrow={false} />
      </BlockBoundary>,
    );

    expect(screen.getByText('gráfico desenhado')).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível desenhar/)).not.toBeInTheDocument();
  });
});
