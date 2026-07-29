/**
 * Tempo relativo em pt-BR.
 *
 * Estes testes existem porque esta linha substituiu um componente do design
 * system que renderizava em INGLÊS ("Atualizado now") — o defeito só apareceu
 * na tela, não em teste. Agora ele tem guarda.
 *
 * `now` é sempre injetado: um teste que compara com `Date.now()` real é um
 * teste que falha sozinho numa madrugada qualquer.
 */
import { describe, it, expect } from 'vitest';
import {
  formatExactTime,
  formatRelativeTime,
  relativeTickInterval,
} from './relative-time';

const NOW = new Date('2026-07-29T15:00:00Z').getTime();
const min = (n: number) => NOW - n * 60_000;
const hour = (n: number) => NOW - n * 3_600_000;

describe('formatRelativeTime', () => {
  it('fala PORTUGUÊS (era o defeito que motivou o componente próprio)', () => {
    expect(formatRelativeTime(min(5), NOW)).toBe('há 5 min');
    expect(formatRelativeTime(hour(3), NOW)).toBe('há 3 h');
    expect(formatRelativeTime(NOW, NOW)).toBe('agora mesmo');
  });

  it('folga de relógio não vira "em 3 segundos"', () => {
    // O dado pode chegar carimbado alguns segundos à frente do relógio do
    // navegador; "no futuro" seria uma confusão gratuita.
    expect(formatRelativeTime(NOW + 8_000, NOW)).toBe('agora mesmo');
    expect(formatRelativeTime(NOW - 20_000, NOW)).toBe('agora mesmo');
  });

  it('a precisão CAI conforme o dado envelhece', () => {
    // Em segundos importa "acabou de chegar"; em horas ninguém liga para o
    // minuto. É a pergunta que muda, não a conta.
    expect(formatRelativeTime(min(59), NOW)).toBe('há 59 min');
    expect(formatRelativeTime(min(61), NOW)).toBe('há 1 h');
  });

  it('acima de um dia mostra a DATA, não a contagem', () => {
    // "há 9 dias" obriga o leitor a fazer a conta que ele queria evitar.
    const texto = formatRelativeTime(hour(30), NOW);
    expect(texto).toMatch(/^em \d{2}\/\d{2}\/\d{4}/);
  });

  it('valor ausente/inválido não renderiza nada (não inventa data)', () => {
    expect(formatRelativeTime(0, NOW)).toBe('');
    expect(formatRelativeTime(Number.NaN, NOW)).toBe('');
  });
});

describe('formatExactTime', () => {
  it('data e hora em formato brasileiro', () => {
    expect(formatExactTime(NOW)).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('relativeTickInterval', () => {
  it('acompanha a granularidade exibida, em vez de bater a cada segundo', () => {
    // Atualizar de segundo em segundo re-renderizaria o cabeçalho 3.600 vezes
    // por hora para trocar "há 2 h" por "há 2 h".
    expect(relativeTickInterval(min(2), NOW)).toBe(30_000);
    expect(relativeTickInterval(hour(3), NOW)).toBe(30 * 60_000);
  });

  it('para de atualizar quando o texto virou data fixa', () => {
    expect(relativeTickInterval(hour(30), NOW)).toBeNull();
    expect(relativeTickInterval(0, NOW)).toBeNull();
  });
});
