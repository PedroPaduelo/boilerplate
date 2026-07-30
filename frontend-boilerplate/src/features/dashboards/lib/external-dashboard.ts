/**
 * Relatórios EXTERNOS (legado) — regras PURAS.
 *
 * Um relatório externo é um dashboard que não tem layout: ele só aponta para um
 * endereço mantido fora desta plataforma (um BI antigo, um painel de terceiro).
 * Ele aparece na MESMA listagem dos dashboards feitos aqui — o que muda é o
 * destino do clique. Estas funções concentram as três decisões que essa mistura
 * exige: reconhecer o item, completar o endereço digitado e recusar o que não é
 * seguro abrir.
 */

/** Forma mínima para reconhecer um relatório externo (serve a qualquer DTO). */
export interface MaybeExternal {
  externalUrl?: string | null;
}

/** `true` quando o dashboard é só um ATALHO para um relatório de fora. */
export function isExternalDashboard(dashboard: MaybeExternal): boolean {
  return typeof dashboard.externalUrl === 'string' && dashboard.externalUrl.length > 0;
}

/**
 * Completa o endereço digitado quando falta o esquema.
 *
 * Quem cadastra um relatório legado costuma colar só o domínio
 * (`analytics.bi.fiscaliza.cloud/relatorio`). Um href sem esquema é lido pelo
 * navegador como caminho RELATIVO — o clique levaria para dentro do próprio
 * app, e o item pareceria "quebrado" sem nenhum erro visível. Assumir `https://`
 * é o padrão da web hoje; quem precisa de `http://` continua podendo digitá-lo.
 *
 * Um esquema QUALQUER já presente (inclusive `javascript:`) é devolvido intacto,
 * de propósito: consertar o que é perigoso esconderia a intenção de quem digitou
 * — quem recusa é a validação (`isSafeExternalUrl`), com a mensagem certa.
 */
export function normalizeExternalUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

/**
 * `true` só para `http`/`https`. A listagem abre este endereço direto no
 * navegador, então aceitar `javascript:`/`data:` seria XSS armazenado — não
 * comodidade.
 */
export function isSafeExternalUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

/**
 * Domínio do relatório, para a interface dizer PARA ONDE o clique leva antes de
 * ele acontecer (um link que sai do app sem avisar é o oposto de previsível).
 */
export function externalUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
