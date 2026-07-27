/**
 * Mensagem de validação do react-hook-form → `status` dos inputs do DS.
 *
 * Existe para o erro aparecer SEMPRE inline, no campo que falhou (e não em
 * toast), com o mesmo formato em todos os campos.
 */
export function errorStatus(
  message?: string,
): { type: 'error'; message: string } | undefined {
  return message ? { type: 'error', message } : undefined;
}
