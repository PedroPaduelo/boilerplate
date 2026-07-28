/**
 * Renomear a conversa no lugar.
 *
 * O título que o servidor gera é um resumo da primeira pergunta; quem precisa
 * reencontrar a conversa (ou projetá-la numa apresentação) tem de poder trocá-lo.
 *
 * O que se trava aqui é o CONTRATO DE TECLADO, que é onde esse tipo de campo
 * costuma trair o usuário: `Enter` confirma, `Esc` desiste sem salvar e sair do
 * campo salva (quem digitou e clicou fora quis renomear, não descartar).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationTitle } from '../components/conversation-title';

async function abrirEdicao(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /renomear conversa/i }));
  return screen.getByRole('textbox', { name: /título da conversa/i });
}

describe('ConversationTitle', () => {
  it('mostra o título e só oferece edição quando há como renomear', () => {
    const { rerender } = render(<ConversationTitle title="Vendas por mês" />);

    expect(screen.getByText('Vendas por mês')).toBeInTheDocument();
    // Sem conversa aberta não há alvo: o lápis não aparece.
    expect(screen.queryByRole('button', { name: /renomear/i })).not.toBeInTheDocument();

    rerender(<ConversationTitle title="Vendas por mês" onRename={vi.fn()} />);
    expect(screen.getByRole('button', { name: /renomear/i })).toBeInTheDocument();
  });

  it('Enter confirma o nome novo', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<ConversationTitle title="Conversa 1" onRename={onRename} />);

    const input = await abrirEdicao(user);
    await user.clear(input);
    await user.type(input, 'Auditoria de mensagens{Enter}');

    expect(onRename).toHaveBeenCalledWith('Auditoria de mensagens');
  });

  it('Esc desiste e mantém o título anterior', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<ConversationTitle title="Conversa 1" onRename={onRename} />);

    const input = await abrirEdicao(user);
    await user.clear(input);
    await user.type(input, 'nome descartado{Escape}');

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Conversa 1')).toBeInTheDocument();
  });

  it('sair do campo salva — digitar e clicar fora não joga o trabalho fora', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(
      <>
        <ConversationTitle title="Conversa 1" onRename={onRename} />
        <button type="button">outro lugar</button>
      </>,
    );

    const input = await abrirEdicao(user);
    await user.clear(input);
    await user.type(input, 'Salvo no blur');
    await user.click(screen.getByRole('button', { name: 'outro lugar' }));

    expect(onRename).toHaveBeenCalledWith('Salvo no blur');
  });

  it('não salva título vazio nem o mesmo nome de novo', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<ConversationTitle title="Conversa 1" onRename={onRename} />);

    // Só espaços: não é um nome.
    const input = await abrirEdicao(user);
    await user.clear(input);
    await user.type(input, '   {Enter}');
    expect(onRename).not.toHaveBeenCalled();

    // Reabriu e confirmou sem mexer: nada a persistir.
    const denovo = await abrirEdicao(user);
    await user.type(denovo, '{Enter}');
    expect(onRename).not.toHaveBeenCalled();
  });
});
