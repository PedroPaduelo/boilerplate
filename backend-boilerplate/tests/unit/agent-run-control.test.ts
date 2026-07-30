/**
 * Controle de execução do turno do agente — parar e destravar.
 *
 * O bug que originou estes testes: o botão "parar" só desligava a exibição na
 * tela. O turno seguia marcado como `running` no servidor e, a partir dali,
 * TODA nova mensagem naquela conversa era recusada com 409 — a conversa ficava
 * inutilizável por 30 minutos (o TTL do estado), sem nenhum caminho de volta
 * pela interface.
 */
import {
  abortRun,
  isAbortError,
  registerRun,
  unregisterRun,
} from '@/modules/agent/services/run-control';

describe('run-control — parar o turno', () => {
  it('aborta o turno registrado e sinaliza que havia o que parar', () => {
    const controller = registerRun('conv-1');
    expect(controller.signal.aborted).toBe(false);

    expect(abortRun('conv-1')).toBe(true);
    expect(controller.signal.aborted).toBe(true);
  });

  it('parar uma conversa SEM turno não quebra nada (devolve false)', () => {
    // Acontece o tempo todo: o turno terminou entre o clique e a chamada.
    expect(abortRun('conv-inexistente')).toBe(false);
  });

  it('registrar de novo aborta o turno anterior — nunca dois na mesma conversa', () => {
    const primeiro = registerRun('conv-2');
    const segundo = registerRun('conv-2');

    expect(primeiro.signal.aborted).toBe(true);
    expect(segundo.signal.aborted).toBe(false);
    abortRun('conv-2');
  });

  it('turno que termina tarde NÃO desregistra o turno seguinte', () => {
    // Sem esta proteção, o fim do turno antigo tirava o novo do registro e o
    // botão "parar" deixava de alcançá-lo.
    const antigo = registerRun('conv-3');
    const novo = registerRun('conv-3');

    unregisterRun('conv-3', antigo);

    expect(abortRun('conv-3')).toBe(true);
    expect(novo.signal.aborted).toBe(true);
  });

  it('reconhece o erro de cancelamento (para não virar "a IA falhou")', () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    expect(isAbortError(abortError)).toBe(true);
    expect(isAbortError(new Error('Request aborted by user'))).toBe(true);
    expect(isAbortError(new Error('Invalid JSON response'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
