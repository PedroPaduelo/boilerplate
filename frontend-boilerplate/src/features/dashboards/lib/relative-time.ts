/**
 * "Atualizado há X" — tempo relativo em PORTUGUÊS.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO O `Timestamp` DO DESIGN SYSTEM
 * ---------------------------------------------------------------------------
 * A primeira versão desta linha usava `<Timestamp format="relative">` do
 * Astryx, que é exatamente o componente para isto. Na tela, ele renderizou
 * **"now"** — e a dica de hora exata, **"July 29, 2026 at 3:02:35 PM UTC"**.
 *
 * Não é configuração faltando: as frases de tempo relativo estão CRAVADAS em
 * inglês no componente (`return 'now'`, `` `in ${mins} minutes` ``, `…ago`),
 * fora do catálogo de i18n. Nenhum `locale` no provider muda isso.
 *
 * Num produto inteiramente em português, a informação mais lida do cabeçalho de
 * um painel não pode estar em outro idioma — e "está atualizado?" é a pergunta
 * que se faz antes de levar o número para uma reunião. Então esta parte é
 * própria: umas poucas linhas puras, testáveis, no idioma do produto.
 *
 * ---------------------------------------------------------------------------
 * ESCALA: PRECISÃO CAINDO COM A IDADE
 * ---------------------------------------------------------------------------
 * A precisão diminui conforme o dado envelhece, porque a pergunta muda junto:
 * em segundos importa "acabou de chegar"; em horas, ninguém liga para o minuto.
 * Acima de um dia paramos de contar e mostramos a DATA — "há 9 dias" obriga o
 * leitor a fazer a conta que ele queria evitar.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Janela em que tudo é "agora mesmo". Existe pelo mesmo motivo que no DS: o
 * relógio do servidor e o do navegador não batem, e um dado que chegou neste
 * instante pode cair alguns segundos no futuro — "em 3 segundos" seria uma
 * confusão gratuita.
 */
const NOW_WINDOW = 45_000;

/** Data e hora exatas, para a dica (quem precisa registrar em ata). */
export function formatExactTime(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Tempo relativo em pt-BR. `now` é injetável para o teste não depender do
 * relógio da máquina (um teste que compara com `Date.now()` real é um teste que
 * falha sozinho numa madrugada de virada de horário).
 */
export function formatRelativeTime(
  value: number | Date,
  now: number = Date.now(),
): string {
  const time = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(time) || time <= 0) return '';

  const diff = now - time;

  // Futuro (ou presente com folga de relógio) → "agora mesmo".
  if (diff < NOW_WINDOW) return 'agora mesmo';

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `há ${minutes} min`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `há ${hours} h`;
  }

  // A partir de um dia, a DATA responde melhor que a contagem.
  return `em ${formatExactTime(time)}`;
}

/**
 * De quanto em quanto tempo vale recalcular o texto, dada a idade do dado.
 *
 * Um `setInterval` de 1s manteria a tela sempre certa e re-renderizaria o
 * cabeçalho 3.600 vezes por hora para trocar "há 2 h" por "há 2 h". O passo
 * acompanha a granularidade que está sendo exibida: enquanto o texto conta
 * minutos, atualiza a cada meio minuto; quando passa a contar horas, a cada
 * meia hora; virou data, para de atualizar.
 */
export function relativeTickInterval(
  value: number | Date,
  now: number = Date.now(),
): number | null {
  const time = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(time) || time <= 0) return null;
  const diff = now - time;
  if (diff < HOUR) return 30_000;
  if (diff < DAY) return 30 * MINUTE;
  return null;
}
