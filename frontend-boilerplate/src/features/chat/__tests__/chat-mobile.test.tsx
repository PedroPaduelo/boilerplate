/**
 * Regressão de mobile no chat.
 *
 * Medido num iPhone de 390px de largura, antes:
 *   - a lista de conversas era `w-64` FIXA: 256px, 66% da tela;
 *   - sobrava tão pouco espaço que o campo de digitar ficava com 8px;
 *   - 5 elementos do cabeçalho estouravam a largura (o badge ia até 510px).
 *
 * Depois: lista vira drawer, campo de texto com 264px (68% da tela), zero
 * elementos estourando.
 *
 * jsdom não calcula layout, então o que se trava aqui é o CONTRATO: a lista
 * fixa não pode aparecer no mobile, o acesso a ela precisa existir, e o
 * cabeçalho precisa poder encolher.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPage } from '../components/chat-page';

vi.mock('../api', () => ({
  agentApi: {
    listConversations: vi
      .fn()
      .mockResolvedValue([
        { id: 'c1', title: 'Vendas por mês', createdAt: '', updatedAt: '' },
      ]),
    createConversation: vi.fn().mockResolvedValue({ id: 'c2', title: 'Nova conversa' }),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    getConversation: vi.fn().mockResolvedValue({ id: 'c1', messages: [] }),
    checkHealth: vi.fn().mockResolvedValue({ configured: true, model: 'x' }),
  },
}));

vi.mock('../transport/http-transport', () => ({
  HttpChatTransport: class {
    async *sendMessage() {}
  },
}));

beforeEach(() => vi.clearAllMocks());

/** A lista fixa (desktop) — deve estar oculta abaixo de `md`. */
const listaFixa = (c: HTMLElement) => c.querySelector('.w-64');

describe('ChatPage no mobile', () => {
  it('esconde a lista fixa de conversas abaixo de md (ela comia 66% da tela)', async () => {
    const { container } = render(<ChatPage />);
    await waitFor(() => expect(listaFixa(container)).toBeTruthy());

    const cls = listaFixa(container)!.className;
    expect(cls).toContain('hidden');
    expect(cls).toContain('md:flex');
  });

  it('oferece o botão que abre a lista no mobile', async () => {
    render(<ChatPage />);
    const botao = await screen.findByLabelText('Ver conversas');

    expect(botao).toBeInTheDocument();
    // Só no mobile: no desktop a lista já está à vista.
    expect(botao.className).toContain('md:hidden');
  });

  it('abre o drawer com a lista ao tocar no botão', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.click(await screen.findByLabelText('Ver conversas'));

    const drawer = await screen.findByRole('dialog');
    expect(drawer).toBeInTheDocument();
    expect(drawer.textContent).toMatch(/Nova conversa/);
  });

  it('usa dvh e desconto responsivo na altura (vh some atrás da barra do navegador)', async () => {
    const { container } = render(<ChatPage />);
    await waitFor(() => expect(listaFixa(container)).toBeTruthy());

    const raiz = container.querySelector('[class*="100dvh"]');
    expect(raiz).toBeTruthy();
    // py-6 no mobile (6.5rem) e py-8 a partir de lg (7.5rem).
    expect(raiz!.className).toContain('h-[calc(100dvh-6.5rem)]');
    expect(raiz!.className).toContain('lg:h-[calc(100dvh-7.5rem)]');
  });
});
