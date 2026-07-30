import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversationStream } from '../use-conversation-stream';

/**
 * Parar a resposta e voltar a conversar.
 *
 * O bug: "parar" só desligava o cursor na tela. O turno continuava marcado como
 * em andamento no servidor e a próxima pergunta era recusada com 409 — a
 * conversa ficava travada por 30 minutos, sem saída pela interface. Estes
 * testes travam as duas metades do conserto: parar encerra no SERVIDOR, e uma
 * conversa que ainda apareça ocupada se destrava sozinha em vez de travar.
 */

const { startRunMock, stopRunMock, fetchRunStateMock, attachMock } = vi.hoisted(() => ({
  startRunMock: vi.fn(),
  stopRunMock: vi.fn(),
  fetchRunStateMock: vi.fn(),
  attachMock: vi.fn(),
}));

vi.mock('../transport/socket-transport', () => ({
  startRun: startRunMock,
  stopRun: stopRunMock,
  fetchRunState: fetchRunStateMock,
  attachToConversation: attachMock,
}));

vi.mock('../api', () => ({
  agentApi: { getConversation: vi.fn().mockResolvedValue({ messages: [] }) },
}));

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({ getSocket: () => null, connected: false }),
}));

/** Erro de axios com status — a forma que o hook inspeciona. */
function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status } });
}

describe('useConversationStream — parar e retomar a conversa', () => {
  beforeEach(() => {
    startRunMock.mockReset().mockResolvedValue({ runId: 'run_1' });
    stopRunMock.mockReset().mockResolvedValue(undefined);
    fetchRunStateMock.mockReset().mockResolvedValue(null);
    attachMock.mockReset().mockReturnValue(() => {});
  });

  it('parar ENCERRA o turno no servidor (não só na tela)', async () => {
    const { result } = renderHook(() => useConversationStream('conv-1'));

    act(() => result.current.send('oi'));
    await waitFor(() => expect(startRunMock).toHaveBeenCalled());

    act(() => result.current.stop());

    // Sem esta chamada, o servidor segue achando que a conversa está ocupada.
    await waitFor(() => expect(stopRunMock).toHaveBeenCalledWith('conv-1'));
    expect(result.current.isStreaming).toBe(false);
  });

  it('depois de parar, dá para enviar outra mensagem', async () => {
    const { result } = renderHook(() => useConversationStream('conv-1'));

    act(() => result.current.send('primeira'));
    await waitFor(() => expect(startRunMock).toHaveBeenCalledTimes(1));
    act(() => result.current.stop());
    await waitFor(() => expect(stopRunMock).toHaveBeenCalled());

    act(() => result.current.send('segunda'));

    await waitFor(() => expect(startRunMock).toHaveBeenCalledTimes(2));
    expect(startRunMock).toHaveBeenLastCalledWith('conv-1', 'segunda');
    expect(result.current.error).toBeNull();
  });

  it('conversa marcada como OCUPADA (409) se destrava sozinha e envia', async () => {
    // Turno pendurado no servidor: antes isto travava a conversa por 30 min.
    startRunMock
      .mockRejectedValueOnce(httpError(409))
      .mockResolvedValueOnce({ runId: 'run_2' });

    const { result } = renderHook(() => useConversationStream('conv-1'));

    act(() => result.current.send('quero falar'));

    await waitFor(() => expect(stopRunMock).toHaveBeenCalledWith('conv-1'));
    await waitFor(() => expect(startRunMock).toHaveBeenCalledTimes(2));
    // O usuário não vê erro nenhum: a mensagem dele passou.
    expect(result.current.error).toBeNull();
  });

  it('erro que NÃO é 409 vira mensagem na tela (sem destravar à toa)', async () => {
    startRunMock.mockRejectedValue(httpError(500));

    const { result } = renderHook(() => useConversationStream('conv-1'));

    act(() => result.current.send('oi'));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    // 500 não é conversa ocupada — parar o turno alheio aqui seria dano gratuito.
    expect(stopRunMock).not.toHaveBeenCalled();
    expect(startRunMock).toHaveBeenCalledTimes(1);
  });

  it('se o segundo envio também falhar, o erro aparece (não vira laço)', async () => {
    startRunMock.mockRejectedValue(httpError(409));

    const { result } = renderHook(() => useConversationStream('conv-1'));

    act(() => result.current.send('oi'));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(startRunMock).toHaveBeenCalledTimes(2);
    expect(stopRunMock).toHaveBeenCalledTimes(1);
  });
});
