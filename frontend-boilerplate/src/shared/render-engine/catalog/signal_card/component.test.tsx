/**
 * Regressão do bloco `signal_card` depois da repaginação sobre o card de
 * resumo da referência (`04-widgets-prontos.md` §2).
 *
 * O que este arquivo trava:
 * 1. A COR DA VARIAÇÃO É LEITURA DE NEGÓCIO — subir 4% é bom para arrecadação
 *    e ruim para latência. Quem decide é `trendPolarity`, não o sinal do
 *    número (era exatamente o que o verde/vermelho cravados erravam).
 * 2. BASE DA TENDÊNCIA — `prev-vs-last` (default) compara com o ponto
 *    anterior; `first-vs-last`, com o começo do período.
 * 3. TENDÊNCIA COM RÓTULO — o minigráfico não tem eixo, então precisa se
 *    anunciar por texto.
 * 4. ANATOMIA DO CARD DE RESUMO — o bloco de variação FLUTUA no topo-direito
 *    e o card não tem sombra (§2.1/§2.2). São as duas medidas que separam
 *    este widget de um card comum, e ambas somem sem ninguém notar.
 * 5. CONTRATO COMUM — rótulo com Markdown e `{{variavel}}` resolvida a partir
 *    dos dados do próprio bloco.
 *
 * Consultas por papel acessível e `data-slot` — nunca por classe (os nomes são
 * hashes do StyleX, novos a cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import type { ValueFormat } from '@/shared/lib/format';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** 100 → 110 no período; 105 → 110 no último passo. */
const DATA = [
  { x: '1', y: 100 },
  { x: '2', y: 105 },
  { x: '3', y: 110 },
];

describe('bloco signal_card', () => {
  it('destaca o último valor da série, formatado', () => {
    renderWithProviders(
      <Block props={{ label: 'Latência p95' }} data={DATA} state="success" />,
    );
    expect(screen.getByText('Latência p95')).toBeInTheDocument();
    expect(screen.getByText('110')).toBeInTheDocument();
  });

  it('calcula a variação contra o ponto anterior por padrão', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByText('+4,8%')).toBeInTheDocument();
  });

  it('calcula a variação do período quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ trendBasis: 'first-vs-last' }} data={DATA} state="success" />,
    );
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('marca a alta como piora quando subir é ruim', () => {
    const { container } = renderWithProviders(
      <Block props={{ trendPolarity: 'up-bad' }} data={DATA} state="success" />,
    );
    const trend = container.querySelector('[data-slot="signal-card-trend"]');
    expect(trend).toHaveAttribute('data-variant', 'error');
  });

  it('anuncia a tendência desenhada e sabe escondê-la', () => {
    const { unmount } = renderWithProviders(
      <Block props={{ label: 'Sessões' }} data={DATA} state="success" />,
    );
    expect(screen.getByRole('img', { name: 'Sessões: tendência' })).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <Block
        props={{ label: 'Sessões', showSparkline: false }}
        data={DATA}
        state="success"
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('flutua a variação no topo-direito, sobre um card sem sombra (§2.1/§2.2)', () => {
    const { container } = renderWithProviders(
      <Block props={{ label: 'Sessões' }} data={DATA} state="success" />,
    );

    const card = container.querySelector('[data-slot="signal-card"]');
    expect(card).toHaveStyle({ position: 'relative', boxShadow: 'none' });

    const trend = container.querySelector('[data-slot="signal-card-trend"]');
    expect(trend).toHaveStyle({ position: 'absolute' });
  });

  it('resolve Markdown e {{variaveis}} no rótulo, a partir dos dados', () => {
    renderWithProviders(
      <Block
        props={{ label: 'Sessões em **{{contagem}}** pontos' }}
        data={DATA}
        state="success"
      />,
    );
    // O rótulo acessível do desenho recebe o MESMO texto, já sem marcação.
    expect(
      screen.getByRole('img', { name: 'Sessões em 3 pontos: tendência' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('bloco signal_card — cor e formato', () => {
  /** Cor do traço da tendência desenhada. */
  const stroke = (container: HTMLElement) =>
    container.querySelector('path.recharts-area-curve')?.getAttribute('stroke');

  /**
   * REGRESSÃO de `accent`. O bloco já aplicava a cor sem condicionar a nada —
   * o que faltava era um teste que ENXERGASSE o desenho: como o
   * `ResponsiveContainer` não media nada em jsdom, a auditoria de inércia
   * media a prop como "6 valores → 1 render".
   */
  it('pinta a tendência com o tom escuro da cor pedida', () => {
    const { container } = renderWithProviders(
      <Block props={{ accent: 'chart-3' }} data={fixture} state="success" />,
    );
    // §2.3: o mini-gráfico usa o tom `dark` da família, não a `main`.
    expect(stroke(container)).toBe('#006C9C');
  });

  it('sem cor reconhecível, cai no verde escuro padrão (nenhum hex atravessa)', () => {
    const { container } = renderWithProviders(
      <Block props={{ accent: '#40E0D0' }} data={fixture} state="success" />,
    );
    expect(container.innerHTML).not.toContain('#40E0D0');
    expect(stroke(container)).toBe('#007867');
  });

  it('separa a forma CHEIA da COMPACTA no valor em destaque', () => {
    const plain = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ');
    const highlighted = (valueFormat: ValueFormat) => {
      const { container, unmount } = renderWithProviders(
        <Block props={{ valueFormat }} data={fixture} state="success" />,
      );
      // O valor em destaque é o único texto com algarismos tabulares.
      const text = plain(container.textContent ?? '');
      unmount();
      return text;
    };

    expect(highlighted('number')).toContain('66.500');
    expect(highlighted('compactNumber')).toContain('66,5 mil');
    expect(highlighted('BRL')).toContain('R$ 66.500,00');
    expect(highlighted('compactBRL')).toContain('R$ 66,50 mil');
  });
});
