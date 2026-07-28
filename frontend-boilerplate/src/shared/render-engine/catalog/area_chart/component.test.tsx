/**
 * Regressão do bloco `area_chart` depois da repaginação visual (lote SUB-02).
 *
 * O que este arquivo trava:
 * 1. OS TRÊS ESTADOS — carregando, sem dados e erro. Área vazia em silêncio era
 *    o defeito clássico do bloco antigo.
 * 2. LEITURA SEM VER — os números do eixo vivem dentro do SVG; o bloco precisa
 *    publicá-los como tabela para leitor de tela.
 * 3. O LAYOUT DA REFERÊNCIA (`03-tipos-de-grafico.md` §2 — Área): gradiente
 *    vertical 0.4 → 0 com paradas 0 e 100, cores 1ª/2ª do ciclo, linha 2,5px
 *    curva e sem pontos, grade só horizontal tracejada 3, eixos sem linha nem
 *    marcações, altura 320px. É o que faz "parecer igual" — e o que uma
 *    refatoração distraída desfaz primeiro.
 * 4. AS PROPS PÚBLICAS — `fill`, `type`, `showLegend`, `showGridLines`,
 *    `palette`, `accent` e `valueFormat` continuam com efeito.
 *
 * Consultas por papel acessível — nunca por classe do StyleX (são hashes novos
 * a cada build). As poucas classes usadas aqui são do RECHARTS (`recharts-*`),
 * que são estáveis e a única forma de inspecionar o desenho dentro do SVG.
 */
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_HEIGHT } from '@/shared/ui';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Cores 1ª e 2ª do ciclo da referência (`01-fundamentos.md` §2). */
const CYCLE_1 = '#00A76F';
const CYCLE_2 = '#FFAB00';

/** Duas séries com participação redonda — facilita afirmar o modo percentual. */
const HALVES = [
  { x: 'Jan', y: 75, series: 'Receita' },
  { x: 'Jan', y: 25, series: 'Despesa' },
];

/*
 * O `ResponsiveContainer` do recharts só desenha depois de MEDIR o container.
 * Este arquivo trazia um `ResizeObserver` próprio no `beforeAll` porque o
 * polyfill global nunca chamava o callback; o polyfill (`src/test/setup.ts`)
 * agora MEDE, então a cópia local saiu. Não é detalhe de arrumação: enquanto a
 * medida era local, todo teste que não a copiasse — inclusive a auditoria de
 * inércia — via o gráfico como uma caixa vazia e acusava como "inerte"
 * qualquer prop cujo efeito é dentro do SVG.
 */

/** Atalho: renderiza o bloco com a fixture e devolve o container. */
function renderBlock(props: Record<string, unknown> = {}, data = fixture) {
  return renderWithProviders(<Block props={props} data={data} state="success" />);
}

describe('bloco area_chart — estados', () => {
  it('mostra esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando a consulta não devolveu linhas', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mostra o erro no lugar do gráfico, com o detalhe da falha', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

describe('bloco area_chart — leitura sem ver', () => {
  it('anuncia o gráfico como imagem de dados com equivalente textual', () => {
    renderBlock();
    expect(screen.getByRole('img', { name: /área/i })).toBeInTheDocument();
    expect(screen.getByText(/2 série\(s\): Receita, Despesa/)).toBeInTheDocument();
  });

  it('publica os períodos e os valores como tabela', () => {
    renderBlock();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: '2026-01' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: '2026-06' })).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Receita' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Despesa' }),
    ).toBeInTheDocument();
  });

  it('lista as séries na legenda, na ordem em que foram desenhadas', () => {
    renderBlock();
    // A legenda é a única lista do bloco; a tabela equivalente repete os mesmos
    // rótulos como cabeçalho de coluna, então a consulta precisa ser por papel.
    const items = screen.getAllByRole('listitem').map((node) => node.textContent);
    expect(items).toEqual(['Receita', 'Despesa']);
  });
});

describe('bloco area_chart — layout da referência (§2 Área)', () => {
  it('preenche com gradiente VERTICAL de 0.4 no topo a 0 na base, paradas 0 e 100', () => {
    const { container } = renderBlock();
    const gradients = container.querySelectorAll('linearGradient');
    // Um gradiente por série: a cor da série entra nos `stop`s.
    expect(gradients).toHaveLength(2);

    for (const gradient of gradients) {
      // Vertical: mesma coordenada em x, do topo (y1=0) à base (y2=1).
      expect(gradient.getAttribute('x1')).toBe('0');
      expect(gradient.getAttribute('x2')).toBe('0');
      expect(gradient.getAttribute('y1')).toBe('0');
      expect(gradient.getAttribute('y2')).toBe('1');

      const stops = gradient.querySelectorAll('stop');
      expect(stops).toHaveLength(2);
      expect(stops[0].getAttribute('offset')).toBe('0%');
      expect(stops[0].getAttribute('stop-opacity')).toBe('0.4');
      expect(stops[1].getAttribute('offset')).toBe('100%');
      expect(stops[1].getAttribute('stop-opacity')).toBe('0');
    }
  });

  it('pega as cores na ORDEM do ciclo: 1ª verde do produto, 2ª âmbar', () => {
    const { container } = renderBlock();
    const gradients = container.querySelectorAll('linearGradient');
    expect(gradients[0].querySelector('stop')?.getAttribute('stop-color')).toBe(CYCLE_1);
    expect(gradients[1].querySelector('stop')?.getAttribute('stop-color')).toBe(CYCLE_2);
  });

  it('liga cada área ao gradiente da PRÓPRIA série', () => {
    const { container } = renderBlock();
    const ids = [...container.querySelectorAll('linearGradient')].map((node) => node.id);
    const fills = [...container.querySelectorAll('path.recharts-area-area')].map((node) =>
      node.getAttribute('fill'),
    );
    expect(fills).toEqual(ids.map((id) => `url(#${id})`));
  });

  it('desenha a linha de topo com 2,5px, curva suave e sem pontos', () => {
    const { container } = renderBlock();
    const curve = container.querySelector<SVGPathElement>('path.recharts-area-curve');
    expect(curve?.getAttribute('stroke-width')).toBe('2.5');
    expect(curve?.getAttribute('stroke')).toBe(CYCLE_1);
    // Ponta arredondada (§6) e curva suave — `C` é o comando de Bézier que só
    // aparece quando a curva é `monotone`; um traçado reto teria apenas `L`.
    expect(curve?.getAttribute('stroke-linecap')).toBe('round');
    expect(curve?.getAttribute('d')).toContain('C');
    // Marcadores invisíveis: nenhum ponto desenhado sobre a linha.
    expect(container.querySelectorAll('svg circle')).toHaveLength(0);
  });

  it('mantém a grade só horizontal e tracejada 3', () => {
    const { container } = renderBlock();
    const horizontal = container.querySelector('.recharts-cartesian-grid-horizontal');
    expect(horizontal).not.toBeNull();
    expect(container.querySelector('.recharts-cartesian-grid-vertical')).toBeNull();
    for (const line of horizontal!.querySelectorAll('line')) {
      expect(line.getAttribute('stroke-dasharray')).toBe('3 3');
    }
    // 5 divisões no eixo Y = 6 guias (o recharts conta os limites).
    expect(horizontal!.querySelectorAll('line')).toHaveLength(6);
  });

  it('deixa os eixos sem linha e sem marcações, com texto de 12px', () => {
    const { container } = renderBlock();
    expect(container.querySelector('.recharts-cartesian-axis-line')).toBeNull();
    expect(container.querySelector('.recharts-cartesian-axis-tick-line')).toBeNull();

    const tick = container.querySelector('.recharts-cartesian-axis-tick-value');
    expect(tick?.getAttribute('font-size')).toBe('12');
    expect(tick?.getAttribute('font-weight')).toBe('400');
    // Cor do texto de eixo da referência (`#919EAB` = texto desabilitado).
    expect(tick?.getAttribute('fill')).toBe('#919EAB');
  });

  it('usa a altura padrão do catálogo, seja ela qual for', () => {
    // Do TOKEN, não de um `320px` cravado: o número é decisão de composição e já
    // mudou uma vez (320 → 280, para o card parar de sair com 536px). Um teste
    // que repete a constante trava a recalibragem em vez de proteger o contrato
    // — o que importa aqui é que o bloco use o degrau padrão, não qual é ele.
    renderBlock();
    expect(screen.getByRole('img', { name: /área/i })).toHaveStyle({
      height: `${CHART_HEIGHT.default}px`,
    });
  });
});

describe('bloco area_chart — parâmetros continuam funcionando', () => {
  it('fill="solid" troca o gradiente por cor chapada translúcida', () => {
    const { container } = renderBlock({ fill: 'solid' });
    expect(container.querySelectorAll('linearGradient')).toHaveLength(0);
    const area = container.querySelector('path.recharts-area-area');
    expect(area?.getAttribute('fill')).toBe(CYCLE_1);
    expect(area?.getAttribute('fill-opacity')).toBe('0.4');
  });

  it('fill="none" deixa só a linha de topo', () => {
    const { container } = renderBlock({ fill: 'none' });
    expect(container.querySelectorAll('linearGradient')).toHaveLength(0);
    expect(
      container.querySelector('path.recharts-area-area')?.getAttribute('fill-opacity'),
    ).toBe('0');
    // A linha continua lá, com a espessura da referência.
    expect(
      container.querySelector('path.recharts-area-curve')?.getAttribute('stroke-width'),
    ).toBe('2.5');
  });

  it('showGridLines=false remove a grade', () => {
    const { container } = renderBlock({ showGridLines: false });
    expect(container.querySelector('.recharts-cartesian-grid')).toBeNull();
  });

  it('showLegend=false esconde a legenda, e o desenho continua', () => {
    renderBlock({ showLegend: false });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByRole('img', { name: /área/i })).toBeInTheDocument();
  });

  it('type="percent" normaliza os valores em participação', () => {
    renderWithProviders(
      <Block props={{ type: 'percent' }} data={HALVES} state="success" />,
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('75%')).toBeInTheDocument();
    expect(within(table).getByText('25%')).toBeInTheDocument();
  });

  it('sem valueFormat o valor é NÚMERO; moeda continua sendo escolha explícita', () => {
    const { unmount } = renderBlock();
    expect(screen.getByRole('table').textContent).not.toContain('R$');
    unmount();

    renderBlock({ valueFormat: 'BRL' });
    expect(
      within(screen.getByRole('table')).getByText('R$ 1.240,00'),
    ).toBeInTheDocument();
  });

  /**
   * A fixture vive na casa dos milhares justamente para separar o par
   * cheio/compacto de cada formato: abaixo de mil os dois imprimem o mesmo
   * texto e metade do enum de `valueFormat` fica indistinguível.
   */
  it('separa a forma CHEIA da COMPACTA em cada formato', () => {
    const cell = (props: Record<string, unknown>) => {
      const { unmount } = renderBlock(props);
      const text = within(screen.getByRole('table')).getAllByRole('cell')[0].textContent;
      unmount();
      return text;
    };

    // O `Intl` separa símbolo e sufixo com espaço FINO/NÃO-QUEBRÁVEL: sem
    // normalizar, a comparação falha por um byte invisível.
    const plain = (value: string | null) => (value ?? '').replace(/[\u00a0\u202f]/g, ' ');

    expect(plain(cell({ valueFormat: 'number' }))).toBe('1.240');
    expect(plain(cell({ valueFormat: 'compactNumber' }))).toBe('1,24 mil');
    expect(plain(cell({ valueFormat: 'BRL' }))).toBe('R$ 1.240,00');
    expect(plain(cell({ valueFormat: 'compactBRL' }))).toBe('R$ 1,24 mil');
  });

  it('type="stacked" empilha as áreas; "default" as sobrepõe', () => {
    const { container: overlaid, unmount } = renderBlock({ type: 'default' });
    // Sobreposta: cada área vai da BASE ao seu valor, então as duas terminam na
    // mesma linha de base e os caminhos têm alturas independentes.
    const overlaidPaths = [...overlaid.querySelectorAll('path.recharts-area-area')].map(
      (node) => node.getAttribute('d'),
    );
    unmount();

    const { container: stacked } = renderBlock({ type: 'stacked' });
    const stackedPaths = [...stacked.querySelectorAll('path.recharts-area-area')].map(
      (node) => node.getAttribute('d'),
    );

    expect(overlaidPaths).toHaveLength(2);
    expect(stackedPaths).toHaveLength(2);
    // Empilhar muda o traçado das DUAS: a 2ª série passa a começar no topo da
    // 1ª, e o eixo Y tem de acomodar a SOMA — o que reposiciona a 1ª também.
    expect(stackedPaths[0]).not.toBe(overlaidPaths[0]);
    expect(stackedPaths[1]).not.toBe(overlaidPaths[1]);
  });
});

describe('bloco area_chart — cor', () => {
  it('resolve o acento antigo para um token de dado do design system', () => {
    const { container } = renderBlock({ palette: 'single', accent: 'chart-3' });
    // A legenda é a única marca de cor fora do SVG — e usa `var(--token)`.
    expect(container.innerHTML).toContain('--ds-color-info-main');
    // Dentro do SVG o mesmo token entra RESOLVIDO (atributo não aceita `var()`).
    expect(
      container.querySelector('linearGradient stop')?.getAttribute('stop-color'),
    ).toBe('#00B8D9');
  });

  /**
   * REGRESSÃO da causa raiz: `accent` só valia se o autor TAMBÉM escolhesse
   * `palette: "single"` — e como o default deste bloco é `multi`, pedir a cor
   * pelo manifesto não mudava um pixel. Agora o pedido explícito vence o modo
   * de paleta, que é o que qualquer um deduz lendo o contrato.
   */
  it('aplica o accent mesmo com palette="multi" (o pedido explícito vence)', () => {
    const { container } = renderBlock({ palette: 'multi', accent: 'chart-3' });
    const stops = [...container.querySelectorAll('linearGradient')].map((node) =>
      node.querySelector('stop')?.getAttribute('stop-color'),
    );
    // Duas séries, UMA cor: foi ela que o autor pediu.
    expect(stops).toEqual(['#00B8D9', '#00B8D9']);
  });

  it('sem accent, "multi" cicla a paleta e "single" usa uma cor só', () => {
    const { container: multi, unmount } = renderBlock({ palette: 'multi' });
    expect(
      [...multi.querySelectorAll('linearGradient')].map((node) =>
        node.querySelector('stop')?.getAttribute('stop-color'),
      ),
    ).toEqual([CYCLE_1, CYCLE_2]);
    unmount();

    const { container: single } = renderBlock({ palette: 'single' });
    expect(
      [...single.querySelectorAll('linearGradient')].map((node) =>
        node.querySelector('stop')?.getAttribute('stop-color'),
      ),
    ).toEqual([CYCLE_1, CYCLE_1]);
  });

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    const { container } = renderBlock({ palette: 'single', accent: '#40E0D0' });
    expect(container.innerHTML).not.toContain('#40E0D0');
    // Sem cor reconhecível, o gráfico cai na paleta — que é sempre do tema.
    expect(
      container.querySelector('linearGradient stop')?.getAttribute('stop-color'),
    ).toBe(CYCLE_1);
  });
});

describe('bloco area_chart — dados fora do feliz caminho', () => {
  it('desenha uma série só, sem legenda (não há o que distinguir)', () => {
    const { container } = renderWithProviders(
      <Block
        props={{}}
        data={[
          { x: 'Jan', y: 10 },
          { x: 'Fev', y: 14 },
        ]}
        state="success"
      />,
    );
    expect(container.querySelectorAll('path.recharts-area-area')).toHaveLength(1);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('aguenta MUITAS séries: cada uma ganha a próxima cor da paleta', () => {
    const many = Array.from({ length: 6 }, (_, index) => index).flatMap((index) => [
      { x: 'Jan', y: 10 * (index + 1), series: `S${index}` },
      { x: 'Fev', y: 12 * (index + 1), series: `S${index}` },
    ]);
    const { container } = renderWithProviders(
      <Block props={{}} data={many} state="success" />,
    );
    const colors = [...container.querySelectorAll('linearGradient')].map((node) =>
      node.querySelector('stop')?.getAttribute('stop-color'),
    );
    expect(colors).toHaveLength(6);
    // Vizinhos distinguíveis é o serviço da paleta: nenhuma cor se repete.
    expect(new Set(colors).size).toBe(6);
  });

  it('trata ponto nulo como zero em vez de quebrar o traçado', () => {
    renderWithProviders(
      <Block
        props={{}}
        data={[
          { x: 'Jan', y: 10 },
          { x: 'Fev', y: null },
          { x: 'Mar', y: 30 },
        ]}
        state="success"
      />,
    );
    const table = screen.getByRole('table');
    expect(
      within(table)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['10', '0', '30']);
  });
});
