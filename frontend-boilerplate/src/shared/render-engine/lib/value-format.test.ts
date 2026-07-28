/**
 * A política de default de formato do catálogo.
 *
 * O que este arquivo trava é uma regra de produto, não uma preferência de
 * escrita: quando o autor do bloco NÃO diz a natureza da medida, a tela não
 * pode escolher dinheiro por ele. Foi assim que uma contagem de eventos de
 * webhook chegou ao usuário como "R$ 11,19 mil".
 */
import { describe, expect, it } from 'vitest';
import {
  CATALOG_VALUE_FORMAT_DEFAULT,
  describeValueFormat,
  formatCatalogValue,
  isCurrencyFormat,
  resolveValueFormat,
} from './value-format';

/**
 * `Intl.NumberFormat` separa o símbolo da moeda com espaço NÃO-QUEBRÁVEL
 * (U+00A0) — correto na tela, invisível no diff de um teste. Normalizamos para
 * comparar o que interessa (o texto) e não o caractere de espaço.
 */
const plain = (value: string) => value.replace(/\u00a0/g, ' ');

describe('política de formato de valor do catálogo', () => {
  it('sem formato declarado, o default é número — nunca moeda', () => {
    expect(CATALOG_VALUE_FORMAT_DEFAULT).toBe('number');
    expect(resolveValueFormat(undefined)).toBe('number');
    expect(formatCatalogValue(11190, undefined)).toBe('11.190');
    expect(formatCatalogValue(11190, undefined)).not.toContain('R$');
  });

  it('formato inválido degrada para número em vez de reintroduzir moeda', () => {
    // Vem do payload do agente: a AJV valida na borda, mas um bloco antigo
    // pode mandar qualquer coisa — e o degradê seguro é o neutro.
    for (const bogus of [null, 42, 'compactBRLL', '', {}]) {
      expect(resolveValueFormat(bogus)).toBe('number');
      expect(formatCatalogValue(1234, bogus)).toBe('1.234');
    }
  });

  it('moeda continua disponível — como escolha explícita', () => {
    expect(formatCatalogValue(11190, 'compactBRL')).toContain('R$');
    expect(plain(formatCatalogValue(1234.5, 'BRL'))).toBe('R$ 1.234,50');
    expect(isCurrencyFormat('BRL')).toBe(true);
    expect(isCurrencyFormat('compactBRL')).toBe(true);
    expect(isCurrencyFormat(undefined)).toBe(false);
  });

  it('honra os demais formatos canônicos do design system', () => {
    expect(plain(formatCatalogValue(2_610_000_000, 'compactNumber'))).toBe('2,61 bi');
    expect(formatCatalogValue(0.125, 'percent')).toBe('12,5%');
  });

  it('descreve a unidade só quando ela informa algo', () => {
    expect(describeValueFormat('BRL')).toBe('valores em R$');
    expect(describeValueFormat('percent')).toBe('valores em %');
    // "valores em números" não diz nada e ocuparia a linha do recorte.
    expect(describeValueFormat('number')).toBeUndefined();
    expect(describeValueFormat(undefined)).toBeUndefined();
  });
});
