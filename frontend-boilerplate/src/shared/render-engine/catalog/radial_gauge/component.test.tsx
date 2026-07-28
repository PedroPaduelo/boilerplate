/**
 * Regressão do bloco `radial_gauge` depois da repaginação para os TRÊS
 * medidores da referência (`03-tipos-de-grafico.md` §12 semicircular, §11 barra
 * radial e §13 tracejado).
 *
 * O que este arquivo trava:
 * 1. VALOR DE VERDADE — o medidor se anuncia como `meter` com valor, mínimo e
 *    máximo; a leitura não existe só como desenho.
 * 2. LAYOUT DA REFERÊNCIA — gradiente roxo #8E33FF → #C684FF no semicircular,
 *    vermelho #FF5630 → #FFAC82 no tracejado, trilha de 16% (semicircular) e de
 *    8% (barra radial e tracejado), traço `dashArray: 4` com ponta reta SÓ na
 *    barra de valor do §13 e legenda própria embaixo na barra radial.
 * 3. TIPOGRAFIA — valor central 17,5px/700 e "Total" 10,5px/400 (§12) ou
 *    12,25px/600 na cor de erro (§13).
 * 4. PARÂMETROS — `max`, `min`, `unit`, `accent` e `variant` continuam com
 *    efeito; `thresholds` (prop do componente) continua escolhendo a faixa.
 * 5. CONTRATO COMUM — rótulo e leitura aceitam `{{variavel}}`; carregando,
 *    sem dados e erro nunca viram área em branco.
 *
 * Consultas por PAPEL e por atributo de dado — nunca por classe (os nomes são
 * hashes do StyleX).
 */
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { RadialGauge } from '@/shared/ui';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/**
 * Cores das paradas do gradiente do arco, na ordem em que saem no SVG.
 * (O seletor é `stop` e não `linearGradient stop` porque o jsdom não casa
 * seletor de tipo com nome de elemento SVG em camelCase.)
 */
function gradientStops(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('stop')].map((stop) =>
    stop.getAttribute('stop-color'),
  );
}

/** Preenchimentos usados no desenho (trilha, arco, gradiente). */
function fills(container: HTMLElement): string[] {
  return [...container.querySelectorAll('path[fill]')].map(
    (path) => path.getAttribute('fill') ?? '',
  );
}

describe('bloco radial_gauge — leitura e acessibilidade', () => {
  it('anuncia o medidor como meter, com valor e escala', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const meter = screen.getByRole('meter', { name: 'Cobertura da meta' });

    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '72% — Cobertura da meta');
  });

  it('escreve a leitura e o rótulo "Total" no centro', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('Cobertura da meta')).toBeInTheDocument();
  });

  it('usa "Total" quando o dado não traz rótulo', () => {
    renderWithProviders(<Block props={{}} data={{ value: 40 }} state="success" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('respeita min, max e unidade na leitura', () => {
    renderWithProviders(
      <Block
        props={{ min: 0, max: 200, unit: 'km' }}
        data={{ value: 50, label: 'Distância' }}
        state="success"
      />,
    );
    const meter = screen.getByRole('meter', { name: 'Distância' });

    expect(meter).toHaveAttribute('aria-valuemax', '200');
    expect(screen.getByText('50 km')).toBeInTheDocument();
  });
});

describe('bloco radial_gauge — layout §12 (medidor semicircular)', () => {
  it('pinta o arco com o par roxo #8E33FF → #C684FF', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    expect(gradientStops(container)).toEqual(['#8E33FF', '#C684FF']);
  });

  it('usa a trilha de 16% da referência', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    expect(fills(container)).toContain('rgba(145 158 171 / 0.16)');
  });

  // O arco de valor entra ANIMADO (360ms), então só existe no DOM depois que a
  // entrada roda — esperar por ele também prova que a animação acontece.
  it('preenche a BARRA DE VALOR com o gradiente, não a trilha', async () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={fixture} state="success" />,
    );
    await waitFor(() =>
      expect(fills(container).some((fill) => fill.startsWith('url(#'))).toBe(true),
    );
  });

  it('escreve o valor em 17,5px/700 e o "Total" em 10,5px/400 na cor de eixo', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);

    const value = screen.getByText('72%');
    expect(value).toHaveAttribute('font-size', '17.5');
    expect(value).toHaveAttribute('font-weight', '700');

    const total = screen.getByText('Cobertura da meta');
    expect(total).toHaveAttribute('font-size', '10.5px');
    expect(total).toHaveAttribute('font-weight', '400');
    expect(total).toHaveAttribute('fill', '#919EAB');
  });

  it('deixa o acento escolhido vencer o par de cores do layout', () => {
    const { container } = renderWithProviders(
      <Block props={{ accent: 'chart-2' }} data={fixture} state="success" />,
    );
    // `chart-2` é a 2ª cor da paleta da referência: âmbar (#FFAB00/#FFD666).
    expect(gradientStops(container)).toEqual(['#FFAB00', '#FFD666']);
  });
});

describe('bloco radial_gauge — layout §13 (medidor tracejado)', () => {
  it('pontilha a BARRA DE VALOR (dashArray 4, ponta reta) e não a trilha', () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'dashed' }} data={fixture} state="success" />,
    );
    const bar = container.querySelector('[data-slot="chart-gauge-dashed"]');

    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('stroke-dasharray', '4');
    expect(bar).toHaveAttribute('stroke-linecap', 'butt');
    // A trilha continua sólida: nenhum outro traço pontilhado no desenho.
    expect(container.querySelectorAll('[stroke-dasharray]')).toHaveLength(1);
  });

  it('usa o par vermelho, a trilha de 8% e o "Total" na cor de erro', () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'dashed' }} data={fixture} state="success" />,
    );
    expect(gradientStops(container)).toEqual(['#FF5630', '#FFAC82']);
    expect(fills(container)).toContain('rgba(145 158 171 / 0.08)');

    const total = screen.getByText('Cobertura da meta');
    expect(total).toHaveAttribute('font-size', '12.25');
    expect(total).toHaveAttribute('font-weight', '600');
    expect(total).toHaveAttribute('fill', '#FF5630');
  });
});

describe('bloco radial_gauge — layout §11 (barra radial)', () => {
  it('desenha a legenda PRÓPRIA embaixo, com rótulo e valor', () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'radial' }} data={fixture} state="success" />,
    );
    const legend = container.querySelector('[data-slot="chart-legends"]');

    expect(legend).toBeInTheDocument();
    expect(legend).toHaveTextContent('Cobertura da meta');
    expect(legend).toHaveTextContent('72%');
    // A legenda nativa (dos cartesianos) não entra em medidor.
    expect(container.querySelector('[data-slot="chart-legend"]')).toBeNull();
  });

  it('usa a trilha de 8% e o gradiente do claro para o escuro', () => {
    const { container } = renderWithProviders(
      <Block props={{ variant: 'radial' }} data={fixture} state="success" />,
    );
    expect(fills(container)).toContain('rgba(145 158 171 / 0.08)');
    expect(gradientStops(container)).toEqual(['#C684FF', '#8E33FF']);
  });
});

describe('bloco radial_gauge — contrato comum', () => {
  it('resolve {{variavel}} no rótulo e no nome acessível', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={{ value: 72, label: 'Meta de {{valor}}%', unit: '%' }}
        state="success"
      />,
    );
    expect(screen.getByRole('meter', { name: 'Meta de 72%' })).toBeInTheDocument();
    expect(screen.getByText('Meta de 72%')).toBeInTheDocument();
  });

  it('cobre carregando, sem dados e erro', () => {
    const carregando = renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    carregando.unmount();

    const vazio = renderWithProviders(
      <Block props={{}} data={{ value: null }} state="success" />,
    );
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    vazio.unmount();

    renderWithProviders(<Block props={{}} state="error" error="Consulta expirou" />);
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

/**
 * `thresholds` é prop do COMPONENTE (o bloco não a expõe no manifesto), então o
 * teste vai direto no `RadialGauge` — a faixa em que o valor cai escolhe a cor
 * do arco, e ela continua saindo da paleta do tema.
 */
describe('RadialGauge — faixas de cor (prop `thresholds`)', () => {
  const FAIXAS = [
    { upTo: 50, color: 'red' },
    { upTo: 80, color: 'amber' },
    { upTo: 100, color: 'emerald' },
  ] as const;

  it('pinta o arco com a cor da faixa em que o valor cai', () => {
    const { container } = renderWithProviders(
      <RadialGauge value={30} label="Risco" thresholds={[...FAIXAS]} />,
    );
    // 30 ≤ 50 → vermelho (#FF5630), com o tom claro da mesma família.
    expect(gradientStops(container)).toEqual(['#FF5630', '#FFAC82']);
  });

  it('sobe de faixa conforme o valor cresce', () => {
    const { container } = renderWithProviders(
      <RadialGauge value={95} label="Risco" thresholds={[...FAIXAS]} />,
    );
    // 95 → última faixa: verde do produto (#00A76F/#5BE49B).
    expect(gradientStops(container)).toEqual(['#00A76F', '#5BE49B']);
  });

  it('deixa a cor fixa vencer as faixas', () => {
    const { container } = renderWithProviders(
      <RadialGauge value={30} label="Risco" color="cyan" thresholds={[...FAIXAS]} />,
    );
    expect(gradientStops(container)).toEqual(['#00B8D9', '#61F3F3']);
  });
});
