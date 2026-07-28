/**
 * Regressão do ANEL DE PROGRESSO na camada de UI — o que o bloco do catálogo
 * não tem como provar sozinho.
 *
 * O defeito que este arquivo tranca é o relatado como "o gráfico não muda
 * quando a variante é alterada": o arco de valor era um `<Pie>` do recharts com
 * a animação de entrada do motor, e o motor interpola os ÂNGULOS a partir do
 * zero — no primeiro quadro NÃO EXISTE caminho nenhum no DOM. Quem lê o HTML
 * inicial (SSR, impressão, captura de tela, a auditoria de props do catálogo)
 * via só a trilha cinza, e as duas props de cor do bloco apareciam como
 * inertes: percorrer os cinco `variant` e os seis `accent` dava o mesmo HTML.
 *
 * O que se afirma aqui:
 *  1. o arco existe JÁ no primeiro render, com a cor certa;
 *  2. a precedência é a publicada em `chart-accent.ts` — cor de série vence tom
 *     semântico;
 *  3. a geometria da trilha e a do arco são a MESMA (a trilha só muda de cor);
 *  4. o movimento continua existindo, com a duração do tema, e some quando o
 *     sistema pede menos movimento — coisa que a animação do motor ignorava.
 */
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CHART_MOTION } from '../chart-theme';
import { ProgressCircle } from '../progress-circle';
import type { ProgressCircleTone } from '../progress-circle';

/**
 * `prefers-reduced-motion` é lido pelo `useReducedMotion` do motion, que faz a
 * assinatura da media query UMA VEZ por processo — trocar `matchMedia` no meio
 * da suíte não muda mais a resposta dele. Como o que se quer afirmar é a REGRA
 * do componente ("com menos movimento, sem transição"), a preferência entra
 * por aqui, controlada pelo teste.
 */
const motion = vi.hoisted(() => ({ prefersReduced: false }));
vi.mock('motion/react', () => ({
  useReducedMotion: () => motion.prefersReduced,
}));

/** O traço que carrega o valor. */
const arc = (container: HTMLElement) =>
  container.querySelector('[data-slot="progress-circle-value"]');

/** O anel apagado atrás dele. */
const track = (container: HTMLElement) =>
  container.querySelector('[data-slot="progress-circle-track"]');

/** Cor do arco desenhada por um tom semântico. */
function toneColor(tone: ProgressCircleTone): string {
  const view = renderWithProviders(<ProgressCircle value={73} label="x" tone={tone} />);
  const color = arc(view.container)?.getAttribute('stroke') ?? '';
  view.unmount();
  return color;
}

describe('anel de progresso — o arco existe no primeiro quadro', () => {
  it('desenha o traço de valor sem esperar animação nenhuma', () => {
    const { container } = renderWithProviders(
      <ProgressCircle value={73} label="Cobertura" />,
    );
    // Sem `waitFor`: é justamente a ausência dele que prova a correção.
    expect(arc(container)).toBeInTheDocument();
    expect(arc(container)?.getAttribute('stroke')).toBeTruthy();
  });

  it('cada tom semântico pinta uma cor diferente', () => {
    const tones: ProgressCircleTone[] = [
      'accent',
      'positive',
      'warning',
      'negative',
      'neutral',
    ];
    const colors = tones.map(toneColor);
    expect(colors.every(Boolean)).toBe(true);
    expect(new Set(colors).size).toBe(tones.length);
  });

  it('a cor de série vence o tom semântico', () => {
    const { container } = renderWithProviders(
      <ProgressCircle value={73} label="x" tone="negative" color="cyan" />,
    );
    // Vermelho é o tom pedido; ciano é a cor pedida — a mais específica manda.
    expect(arc(container)?.getAttribute('stroke')).not.toBe(toneColor('negative'));
  });
});

describe('anel de progresso — trilha e valor não podem divergir', () => {
  it('compartilham raio e espessura; muda só a cor', () => {
    const { container } = renderWithProviders(
      <ProgressCircle value={40} label="x" tone="warning" />,
    );
    const geometry = (node: Element | null) => ({
      r: node?.getAttribute('r'),
      width: node?.getAttribute('stroke-width'),
    });

    expect(geometry(track(container))).toEqual(geometry(arc(container)));
    expect(track(container)?.getAttribute('stroke')).not.toBe(
      arc(container)?.getAttribute('stroke'),
    );
  });

  it('sem valor, desenha só a trilha — nunca um arco de comprimento zero', () => {
    const { container } = renderWithProviders(<ProgressCircle value={0} label="x" />);
    expect(track(container)).toBeInTheDocument();
    expect(arc(container)).toBeNull();
  });

  it('anel fechado perde a ponta arredondada (as duas se sobreporiam)', () => {
    const cheio = renderWithProviders(<ProgressCircle value={100} label="x" />);
    expect(arc(cheio.container)).toHaveAttribute('stroke-linecap', 'butt');
    cheio.unmount();

    const parcial = renderWithProviders(<ProgressCircle value={40} label="x" />);
    expect(arc(parcial.container)).toHaveAttribute('stroke-linecap', 'round');
  });
});

describe('anel de progresso — movimento', () => {
  it('anima a chegada do valor com a duração do tema', () => {
    const { container } = renderWithProviders(<ProgressCircle value={40} label="x" />);
    expect(arc(container)?.getAttribute('style')).toContain(
      `stroke-dashoffset ${CHART_MOTION.duration}ms`,
    );
  });

  it('não anima quando o sistema pede menos movimento', () => {
    // A animação do motor ignorava `prefers-reduced-motion`; a transição de
    // CSS não — é a mesma regra das barras do catálogo (`ChartBarTrack`).
    motion.prefersReduced = true;
    try {
      const { container } = renderWithProviders(<ProgressCircle value={40} label="x" />);
      expect(arc(container)?.getAttribute('style') ?? '').not.toContain('transition');
      // E o desenho continua lá, na posição final: menos movimento nunca pode
      // virar menos informação.
      expect(arc(container)?.getAttribute('stroke')).toBeTruthy();
    } finally {
      motion.prefersReduced = false;
    }
  });
});
