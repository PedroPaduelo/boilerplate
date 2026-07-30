/**
 * Tempo relativo em português, curto — "há 42 min", "há 3 h", "ontem".
 *
 * Existe porque o carimbo da última carga da base é uma informação de
 * CONFIANÇA: o auditor precisa saber se o que está vendo é de agora ou de
 * ontem antes de mandar fiscalizar duzentos CNPJs. Data absoluta obriga a
 * fazer a conta de cabeça; o relativo responde na hora.
 */
const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

export function tempoRelativo(iso: string | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';

  if (ms < MINUTO) return 'agora há pouco';
  if (ms < HORA) return `há ${Math.floor(ms / MINUTO)} min`;
  if (ms < DIA) {
    const horas = Math.floor(ms / HORA);
    return `há ${horas} h`;
  }
  const dias = Math.floor(ms / DIA);
  return dias === 1 ? 'ontem' : `há ${dias} dias`;
}
