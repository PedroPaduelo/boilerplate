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
import { definition } from './component';

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
