/**
 * i18n do design system — o que o shell injeta no `InternationalizationProvider`.
 *
 * O app é 100% pt-BR (atende prefeituras brasileiras) e não tem seletor de
 * idioma: o locale é constante. Se um dia houver troca em runtime, é aqui que
 * ela entra — `providers.tsx` só consome.
 *
 * `dsMessages` mora em constante de módulo, e não em objeto literal dentro do
 * JSX, de propósito: o provider memoiza o value pela IDENTIDADE de `messages`.
 * Literal no JSX cria objeto novo a cada render e refaz o contexto de i18n da
 * árvore inteira — invalidando o cache de formatadores ICU do DS por nada.
 */
import type { Locale, MessagesByLocale } from '@astryxdesign/core/i18n';
import { ptBR } from './pt-br';

/**
 * Tag BCP 47. Regional de propósito: o `resolve()` do DS caminha
 * `pt-BR` → `pt` → `en`, então um catálogo `pt` genérico (se um dia existir)
 * cobre o que o `pt-BR` não tiver.
 */
export const APP_LOCALE: Locale = 'pt-BR';

/** Catálogos por locale entregues ao DS. O `en` já vem embarcado no pacote. */
export const dsMessages: MessagesByLocale = { [APP_LOCALE]: ptBR };

export { ptBR };
