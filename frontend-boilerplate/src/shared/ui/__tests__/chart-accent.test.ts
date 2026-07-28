/**
 * Regressão da tradução de COR do vocabulário antigo do catálogo para os
 * tokens de dado do design system.
 *
 * O que este arquivo trava:
 * 1. COMPATIBILIDADE — um painel salvo com `chart-3` ou `bg-emerald-500`
 *    continua abrindo com a mesma leitura de cor; o contrato dos manifests não
 *    quebra.
 * 2. ZERO COR CRUA — hex, rgb e gradiente NÃO viram cor de gráfico: caem na
 *    paleta. É a garantia de que nenhum valor legado atravessa o desenho.
 */
import { describe, expect, it } from 'vitest';
import { chartAccentCardVariant, chartAccentColor } from '../chart-accent';
import { CHART_SERIES_COLORS } from '../charts';

describe('acento legado → cor de dado do DS', () => {
  it('traduz o enum antigo preservando a ordem da paleta', () => {
    expect(chartAccentColor('chart-1')).toBe(CHART_SERIES_COLORS[0]);
    expect(chartAccentColor('chart-2')).toBe(CHART_SERIES_COLORS[1]);
    expect(chartAccentColor('chart-3')).toBe(CHART_SERIES_COLORS[2]);
    expect(chartAccentColor('chart-5')).toBe(CHART_SERIES_COLORS[4]);
    expect(chartAccentColor('primary')).toBe(CHART_SERIES_COLORS[0]);
  });

  it('reconhece o matiz de uma classe utilitária antiga', () => {
    expect(chartAccentColor('bg-purple-500')).toBe('purple');
    expect(chartAccentColor('stroke-emerald-400')).toBe('green');
    expect(chartAccentColor('text-rose-600')).toBe('red');
    expect(chartAccentColor('var(--chart-4)')).toBe(CHART_SERIES_COLORS[3]);
  });

  it('aceita o nome de uma cor do próprio sistema', () => {
    expect(chartAccentColor('teal')).toBe('teal');
    expect(chartAccentColor('  Blue ')).toBe('blue');
  });

  it('devolve indefinido para cor crua — a paleta assume', () => {
    expect(chartAccentColor('#40E0D0')).toBeUndefined();
    expect(chartAccentColor('rgb(64, 224, 208)')).toBeUndefined();
    expect(chartAccentColor('linear-gradient(90deg, red, blue)')).toBeUndefined();
    expect(chartAccentColor('')).toBeUndefined();
    expect(chartAccentColor(undefined)).toBeUndefined();
  });
});

describe('acento legado → variante de card do DS', () => {
  it('usa a variante de cor quando ela existe', () => {
    // `chart-1` é a 1ª cor da referência (#00A76F). No tema, a família `teal`
    // do Astryx aponta para a `primary` do DS — que é exatamente esse verde.
    expect(chartAccentCardVariant('chart-1')).toBe('teal');
    expect(chartAccentCardVariant('bg-emerald-500')).toBe('green');
  });

  it('fica no visual padrão quando não há variante equivalente', () => {
    // `brown` e `indigo` existem como cor de série, não como variante de card.
    expect(chartAccentColor('brown')).toBe('brown');
    expect(chartAccentCardVariant('brown')).toBeUndefined();
    expect(chartAccentCardVariant('#40E0D0')).toBeUndefined();
  });
});
