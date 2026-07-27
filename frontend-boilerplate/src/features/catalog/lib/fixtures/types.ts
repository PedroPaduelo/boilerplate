/**
 * Tipos das FIXTURES do playground do catálogo.
 *
 * Ficam num módulo próprio para que os arquivos de dados
 * (`series-fixtures` / `categorical-fixtures`) e o mapa público
 * (`../block-fixtures`) compartilhem o contrato sem import circular.
 */

/**
 * Variação de fixture: chave única, rótulo do botão, JSON no shape do bloco,
 * descrição opcional (tooltip).
 */
export interface FixtureVariant {
  /** Chave única dentro do bloco, ex.: `'default'`, `'multi-series'`. */
  id: string;
  /** Rótulo exibido no seletor (PT-BR curto). */
  label: string;
  /** Tooltip opcional explicando o cenário. */
  description?: string;
  /**
   * JSON pronto, validado contra o `dataContract.shape` do bloco. Tipado como
   * `unknown` aqui; quem consome valida via `validateBlockDataByShape`.
   */
  data: unknown;
}

/**
 * Mapa `catalogType → variantes`. Nem todo bloco precisa ter — só os que fazem
 * sentido demonstrar com variações.
 */
export type BlockFixtures = Record<string, FixtureVariant[]>;
