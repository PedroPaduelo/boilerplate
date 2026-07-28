/**
 * Contrato do rodapé da resposta: o que dá para FAZER com ela (copiar o
 * markdown cru, refazer, votar) e o que ela CUSTOU — sem que nada disso dispute
 * atenção com o texto.
 *
 * As consultas são por papel acessível: nome do botão e `aria-pressed`. É assim
 * que um leitor de tela enxerga o estado do voto — se o teste passar por aqui,
 * o realce visual pode mudar sem quebrar a promessa de acessibilidade.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { MessageActions } from '../components/message-actions';

const MARKDOWN = '## Arrecadação\n\n- 128 linhas\n\n```sql\nSELECT 1\n```';
const CREATED_AT = '2026-02-19T17:04:00.000Z';

/**
 * Precisa vir DEPOIS de `userEvent.setup()`: o user-event instala o próprio
 * dublê de área de transferência ao inicializar e sobrescreveria este.
 */
function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

describe('MessageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('copia o markdown CRU da resposta, sem reformatar nada', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    renderWithProviders(<MessageActions content={MARKDOWN} createdAt={CREATED_AT} />);

    await user.click(screen.getByRole('button', { name: 'Copiar resposta' }));

    expect(writeText).toHaveBeenCalledWith(MARKDOWN);
    expect(await screen.findByText('Resposta copiada em markdown.')).toBeInTheDocument();
  });

  it('falha ao copiar vira aviso — não silêncio', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    mockClipboard(writeText);

    renderWithProviders(<MessageActions content={MARKDOWN} />);

    await user.click(screen.getByRole('button', { name: 'Copiar resposta' }));

    expect(
      await screen.findByText('Não foi possível copiar a resposta.'),
    ).toBeInTheDocument();
  });

  it('refazer só existe quando há como refazer', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderWithProviders(
      <MessageActions content={MARKDOWN} onRetry={onRetry} />,
    );
    await user.click(screen.getByRole('button', { name: 'Refazer resposta' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<MessageActions content={MARKDOWN} />);
    expect(
      screen.queryByRole('button', { name: 'Refazer resposta' }),
    ).not.toBeInTheDocument();
  });

  it('marca o voto de forma acessível e avisa quem for persistir', async () => {
    const onFeedback = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<MessageActions content={MARKDOWN} onFeedback={onFeedback} />);

    const useful = screen.getByRole('button', { name: 'Marcar resposta como útil' });
    expect(useful).toHaveAttribute('aria-pressed', 'false');

    await user.click(useful);

    expect(onFeedback).toHaveBeenCalledWith('up');
    expect(useful).toHaveAttribute('aria-pressed', 'true');
    // O estado também aparece em TEXTO: quem não distingue o realce por cor
    // continua sabendo o que ficou marcado.
    expect(screen.getByText('Marcada como útil.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Marcar resposta como não útil' }),
    ).toHaveAttribute('aria-pressed', 'false');

    await user.click(useful);
    expect(onFeedback).toHaveBeenLastCalledWith(null);
    expect(useful).toHaveAttribute('aria-pressed', 'false');
  });

  it('sem consumidor de feedback, os botões de voto não aparecem', () => {
    renderWithProviders(<MessageActions content={MARKDOWN} />);

    expect(
      screen.queryByRole('button', { name: 'Marcar resposta como útil' }),
    ).not.toBeInTheDocument();
  });

  it('horário sai como <time> com o instante em ISO', () => {
    const { container } = renderWithProviders(
      <MessageActions content={MARKDOWN} createdAt={CREATED_AT} />,
    );

    expect(container.querySelector('time')).toHaveAttribute('datetime', CREATED_AT);
  });

  it('consumo do turno entra como rodapé — e só quando existe', () => {
    const { rerender } = renderWithProviders(
      <MessageActions
        content={MARKDOWN}
        usage={{ inputTokens: 400, outputTokens: 240, elapsedMs: 2500, steps: 4 }}
      />,
    );

    expect(screen.getByText('640 tokens · 2,5 s · 4 passos')).toBeInTheDocument();

    rerender(<MessageActions content={MARKDOWN} />);
    expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
  });
});
