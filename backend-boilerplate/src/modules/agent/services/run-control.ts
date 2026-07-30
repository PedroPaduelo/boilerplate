/**
 * Registro dos turnos VIVOS neste processo, para poder interrompê-los.
 *
 * O estado do turno (texto, passos) vive no Redis — isso o torna retomável e
 * compartilhável entre instâncias. Já a EXECUÇÃO é local: quem está falando com
 * o provider é este processo, e só ele pode abortar a chamada. Então o
 * `AbortController` fica aqui, em memória, ao lado de quem consegue usá-lo.
 *
 * Consequência assumida: se houver mais de uma instância, o "parar" só
 * interrompe de verdade quando cai na instância que está rodando o turno. Por
 * isso a rota de parada NÃO depende disto para destravar a conversa — ela
 * também encerra o run no Redis, que é o que libera o usuário a falar de novo.
 * Abortar é o bônus (economiza tokens); destravar é o essencial.
 */

const controllers = new Map<string, AbortController>();

/** Registra o turno em execução, substituindo qualquer registro anterior. */
export function registerRun(conversationId: string): AbortController {
  controllers.get(conversationId)?.abort();
  const controller = new AbortController();
  controllers.set(conversationId, controller);
  return controller;
}

/**
 * Interrompe o turno desta conversa, se ele estiver rodando AQUI.
 * Devolve `true` quando havia o que abortar.
 */
export function abortRun(conversationId: string): boolean {
  const controller = controllers.get(conversationId);
  if (!controller) return false;
  controller.abort();
  controllers.delete(conversationId);
  return true;
}

/** Tira o turno do registro (fim normal). Idempotente. */
export function unregisterRun(conversationId: string, controller?: AbortController): void {
  // Só remove se ainda for o MESMO controller: um turno que termina tarde não
  // pode desregistrar o turno seguinte, que já começou.
  const atual = controllers.get(conversationId);
  if (!atual) return;
  if (controller && atual !== controller) return;
  controllers.delete(conversationId);
}

/** O erro veio de um cancelamento (e não de uma falha de verdade)? */
export function isAbortError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string };
  return (
    e.name === 'AbortError' ||
    e.name === 'TimeoutError' ||
    /abort/i.test(e.message ?? '')
  );
}
