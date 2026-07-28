/**
 * MOVIMENTO REDUZIDO — o gráfico respeita `prefers-reduced-motion`?
 *
 * A referência manda animar a entrada em 360ms (`02-configuracao-base.md` §3),
 * e os gráficos animavam SEMPRE. Para quem tem sensibilidade vestibular ou
 * enxaqueca com aura, um painel em que dez barras crescem ao mesmo tempo é um
 * problema de acessibilidade real (WCAG 2.3.3) — e o sistema operacional já
 * publica essa preferência, que o CSS do app respeita há tempo.
 *
 * O que este arquivo trava:
 *  1. com `(prefers-reduced-motion: no-preference)` VERDADEIRO (o usuário não
 *     pediu redução), a animação continua ligada — nada muda para a maioria;
 *  2. com a consulta FALSA (usuário pediu redução, ou ambiente que não sabe
 *     responder), o desenho nasce completo, sem animação de entrada.
 *
 * O segundo caso é também o que torna qualquer leitura SÍNCRONA do desenho
 * confiável: o recharts anima barra pela geometria, e no quadro 0 a barra tem
 * lado zero — ou seja, não existe no DOM. Era por isso que a auditoria de
 * inércia do catálogo lia "nenhuma cor mudou" num gráfico de barras.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { BarChart } from '../bar-chart';
import { HBarChart } from '../h-bar-chart';

const SERIES = [{ label: 'Receita', data: [10, 20, 15] }];
const LABELS = ['Jan', 'Fev', 'Mar'];
const POINTS = [
  { label: 'Centro', value: 30 },
  { label: 'Norte', value: 20 },
];

const originalMatchMedia = window.matchMedia;

/** Faz `(prefers-reduced-motion: no-preference)` responder `matches`. */
function setMotionAllowed(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('no-preference') ? matches : !matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('gráficos do catálogo — prefers-reduced-motion', () => {
  it('sem preferência declarada, mantém a animação de entrada da referência', () => {
    setMotionAllowed(true);
    const { container } = renderWithProviders(
      <BarChart series={SERIES} labels={LABELS} />,
    );
    // Enquanto anima, a coluna tem lado zero e o recharts não desenha o
    // retângulo — é essa ausência que prova que a animação está ativa.
    expect(container.querySelectorAll('.recharts-rectangle')).toHaveLength(0);
  });

  it('com movimento reduzido, a coluna nasce desenhada (sem animar)', () => {
    setMotionAllowed(false);
    const { container } = renderWithProviders(
      <BarChart series={SERIES} labels={LABELS} />,
    );
    expect(container.querySelectorAll('.recharts-rectangle')).toHaveLength(3);
  });

  it('vale também para a barra horizontal', () => {
    setMotionAllowed(false);
    const { container } = renderWithProviders(<HBarChart data={POINTS} />);
    expect(container.querySelectorAll('.recharts-rectangle')).toHaveLength(2);
  });

  /**
   * O ambiente de teste não implementa `matchMedia` de verdade (o polyfill do
   * setup responde `false` a tudo), então ele cai no lado SEM movimento — que
   * é a escolha segura da consulta afirmativa: ambiente que não sabe responder
   * não recebe animação, e o desenho está lá desde o primeiro quadro.
   */
  it('ambiente sem matchMedia confiável cai no lado sem movimento', () => {
    const { container } = renderWithProviders(<HBarChart data={POINTS} />);
    expect(container.querySelectorAll('.recharts-rectangle')).toHaveLength(2);
  });
});
