/**
 * Regressão do bloco `bar_chart` depois da repaginação visual (§4/§5/§6/§7 da
 * referência).
 *
 * O que este arquivo trava:
 * 1. OS TRÊS ESTADOS — carregando, sem dados e com dados. Barra vazia em
 *    silêncio era o defeito clássico do bloco antigo.
 * 2. LEITURA SEM VER — as categorias do eixo vivem dentro do SVG; o bloco
 *    precisa publicá-las como tabela para leitor de tela.
 * 3. COR DE TOKEN — o acento vira token do design system, e uma cor crua
 *    legada NÃO atravessa para o desenho.
 * 4. A COR DAS COLUNAS — a 1ª série sai no VERDE ESCURO A 80% da referência
 *    (`rgba(0,120,103,.8)`), não no verde puro, e as seguintes seguem a paleta
 *    na ordem (2ª = âmbar).
 * 5. AS PROPS PÚBLICAS — `stacked`, `orientation`, `palette`, `accent`,
 *    `seriesColors`, `showLegend` e `valueFormat` continuam com efeito. Este
 *    bloco é o que mais sofreu com fixture pobre: sem série nomeada, três
 *    dessas props não tinham o que fazer.
 *
 * Consultas por papel acessível — nunca por classe do StyleX (são hashes novos
 * a cada build). As poucas classes usadas aqui são do RECHARTS
 * (`recharts-rectangle`), estáveis e a única forma de inspecionar o SVG.
 */
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Série única SEM nome — o ranking simples da §4. */
const SINGLE_SERIES = [
  { x: 'Jan', y: 1240 },
  { x: 'Fev', y: 980 },
  { x: 'Mar', y: 1510 },
];

/** Token de dado do DS de cada cor citada aqui (ver `chart-theme.ts`). */
const TOKEN = {
  /** 1ª cor do ciclo — nas colunas ela aparece como VERDE80 (ver abaixo). */
  emerald: '--ds-color-primary-main',
  /** 2ª cor do ciclo — a âmbar da coluna múltipla (§5). */
  amber: '--ds-color-warning-main',
  /** 3ª cor do ciclo — para onde `accent: 'chart-3'` traduz. */
  cyan: '--ds-color-info-main',
} as const;

/** Os mesmos tokens já RESOLVIDOS — a forma que entra no SVG. */
const HEX = { emerald: '#00A76F', amber: '#FFAB00', cyan: '#00B8D9' } as const;

/**
 * VERDE80 — `--ds-color-primary-dark` (#007867) a 80%, a cor das colunas em
 * §4, §5 e §6 da referência e a mais recorrente do catálogo.
 */
const VERDE80 = 'rgba(0, 120, 103, 0.8)';

/** Atalho: renderiza o bloco com a fixture (multi-série) e devolve o container. */
function renderBlock(props: Record<string, unknown> = {}, data = fixture) {
  return renderWithProviders(<Block props={props} data={data} state="success" />);
}

/**
 * Renderiza e ESPERA as colunas existirem.
 *
 * A coluna nasce com altura zero e cresce na animação de entrada (360ms, §3);
 * até o primeiro quadro o `<Rectangle>` não desenha nada, então consultar o
 * SVG logo após o `render()` acha `<g>`s vazios. Área e linha não têm esse
 * problema (a curva é desenhada de uma vez), por isso só as barras esperam.
 *
 * `bars` existe por causa da CASCATA: a série `n` entra 120ms depois da
 * anterior (§3), então esperar "pelo menos uma coluna" devolve o desenho com
 * só a primeira série pronta — e um teste de cor leria uma paleta pela metade.
 */
async function plotBars(props: Record<string, unknown> = {}, data = fixture, bars = 1) {
  const view = renderBlock(props, data);
  await waitFor(() =>
    expect(view.container.querySelectorAll('.recharts-rectangle').length).toBe(bars),
  );
  return view;
}

/** Cores de preenchimento das barras desenhadas, na ordem do SVG. */
function barFills(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('.recharts-rectangle')].map((node) =>
    node.getAttribute('fill'),
  );
}

describe('bloco bar_chart — estados', () => {
  it('mostra esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando a consulta não devolveu linhas', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });

  it('mostra a mensagem do erro no lugar do gráfico', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

describe('bloco bar_chart — leitura sem ver', () => {
  it('anuncia o gráfico como imagem de dados', () => {
    renderBlock();
    expect(screen.getByRole('img', { name: /barras/i })).toBeInTheDocument();
  });

  it('publica as categorias e os valores como tabela', () => {
    renderBlock({}, SINGLE_SERIES);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Jan' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Mar' })).toBeInTheDocument();
    // Uma coluna por série, além da coluna de categoria.
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
  });

  it('abre uma coluna por série quando o dado é multi-série', () => {
    renderBlock();
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Receita' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Despesa' }),
    ).toBeInTheDocument();
  });
});

describe('bloco bar_chart — cor', () => {
  it('resolve o acento antigo para um token de dado do DS', () => {
    const { container } = renderBlock({ palette: 'single', accent: 'chart-3' });
    // `chart-3` é a 3ª cor da paleta da referência: ciano.
    expect(container.innerHTML).toContain(`var(${TOKEN.cyan})`);
  });

  /**
   * REGRESSÃO da causa raiz: `accent` só valia com `palette: "single"` — e como
   * o default de `accent` era `chart-1`, ele ainda por cima desligava o modo
   * `multi` de fábrica. Agora o pedido explícito vence a paleta, e a paleta só
   * cicla quando ninguém pediu cor.
   */
  it('aplica o accent mesmo com palette="multi" (o pedido explícito vence)', async () => {
    const { container } = await plotBars(
      { palette: 'multi', accent: 'chart-3' },
      fixture,
      10,
    );
    // Duas séries, UMA cor: foi ela que o autor pediu.
    expect(new Set(barFills(container))).toEqual(new Set([HEX.cyan]));
  });

  it('sem accent, "single" usa uma cor só e "multi" cicla a paleta', async () => {
    const { container: single, unmount } = await plotBars(
      { palette: 'single' },
      fixture,
      10,
    );
    expect(new Set(barFills(single))).toEqual(new Set([VERDE80]));
    unmount();

    const { container: multi } = await plotBars({ palette: 'multi' }, fixture, 10);
    expect(new Set(barFills(multi))).toEqual(new Set([VERDE80, HEX.amber]));
  });

  it('seriesColors fixa a cor de CADA série, vencendo accent e paleta', async () => {
    const { container } = await plotBars(
      { palette: 'multi', accent: 'chart-1', seriesColors: ['chart-3', 'chart-4'] },
      fixture,
      10,
    );
    expect(new Set(barFills(container))).toEqual(new Set([HEX.cyan, '#FF5630']));
  });

  it('não deixa uma cor crua legada chegar ao desenho', async () => {
    const { container } = await plotBars(
      { palette: 'single', accent: '#40E0D0' },
      fixture,
      10,
    );
    // Cor que o sistema não reconhece cai na paleta — e nunca é repassada.
    expect(container.innerHTML).not.toContain('#40E0D0');
    // Sobra o VERDE80 da §4, que é cor do TEMA (token + opacidade), não um hex
    // digitado no bloco.
    expect(new Set(barFills(container))).toEqual(new Set([VERDE80]));
  });

  it('pinta a 1ª série com o VERDE80 da referência, não com o verde puro', () => {
    const { container } = renderBlock();
    expect(container.innerHTML).toContain(VERDE80);
    expect(container.innerHTML).not.toContain(`var(${TOKEN.emerald})`);
  });

  it('dá âmbar à 2ª série da coluna múltipla (§5)', () => {
    const { container } = renderBlock();
    expect(container.innerHTML).toContain(`var(${TOKEN.amber})`);
  });

  it('mantém o VERDE80 quando o autor escolhe o acento padrão do catálogo', () => {
    const { container } = renderBlock({ palette: 'single', accent: 'chart-1' });
    expect(container.innerHTML).toContain(VERDE80);
  });

  it('com série única, "multi" pinta uma cor por CATEGORIA', async () => {
    const { container } = await plotBars({ palette: 'multi' }, SINGLE_SERIES, 3);
    expect(barFills(container)).toEqual([VERDE80, HEX.amber, HEX.cyan]);
  });
});

describe('bloco bar_chart — legenda', () => {
  it('lista uma entrada por série quando o dado é multi-série (§5)', () => {
    renderBlock();
    const legend = screen.getByRole('list');
    expect(within(legend).getAllByRole('listitem')).toHaveLength(2);
    expect(within(legend).getByText('Receita')).toBeInTheDocument();
    expect(within(legend).getByText('Despesa')).toBeInTheDocument();
  });

  it('não desenha legenda para uma série só (§4)', () => {
    renderBlock({}, SINGLE_SERIES);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('showLegend=false esconde a legenda, e o desenho continua', async () => {
    const { container } = await plotBars({ showLegend: false }, fixture, 10);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(barFills(container).length).toBeGreaterThan(0);
  });
});

describe('bloco bar_chart — empilhamento e orientação', () => {
  /**
   * `stacked` só tem efeito com dado multi-série — e era exatamente isso que a
   * fixture antiga (sem o campo `series`) não tinha. Empilhado, as colunas de
   * uma categoria compartilham o mesmo X e se sobrepõem em Y; agrupado, elas
   * ficam lado a lado.
   */
  it('stacked=true empilha as séries na mesma coluna', async () => {
    const { container: grouped, unmount } = await plotBars(
      { stacked: false },
      fixture,
      10,
    );
    const groupedX = [...grouped.querySelectorAll('.recharts-rectangle')].map((node) =>
      node.getAttribute('x'),
    );
    unmount();

    const { container: stacked } = await plotBars({ stacked: true }, fixture, 10);
    const stackedX = [...stacked.querySelectorAll('.recharts-rectangle')].map((node) =>
      node.getAttribute('x'),
    );

    // Agrupado: 10 posições X distintas (5 categorias × 2 séries lado a lado).
    expect(new Set(groupedX).size).toBe(10);
    // Empilhado: 5 posições X — as duas séries dividem a mesma coluna.
    expect(new Set(stackedX).size).toBe(5);
  });

  it('sem série nomeada, stacked degrada para barras planas (não quebra)', async () => {
    const { container } = await plotBars({ stacked: true }, SINGLE_SERIES, 3);
    expect(barFills(container)).toHaveLength(3);
  });

  it('orientation="horizontal" deita as barras e nomeia categoria · série', () => {
    renderBlock({ orientation: 'horizontal' });
    const table = screen.getByRole('table');
    // Sem o nome da série, o eixo repetiria "Jan", "Jan", "Fev", "Fev"…
    expect(
      within(table).getByRole('rowheader', { name: 'Jan · Receita' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('rowheader', { name: 'Jan · Despesa' }),
    ).toBeInTheDocument();
  });

  it('na horizontal, a cor acompanha a SÉRIE e não a linha', async () => {
    const { container } = await plotBars(
      { orientation: 'horizontal', palette: 'multi' },
      fixture,
      10,
    );
    const fills = barFills(container);
    // 10 barras alternando entre as duas cores de série, e não 10 cores.
    expect(fills).toHaveLength(10);
    expect(new Set(fills).size).toBe(2);
    expect(fills[0]).toBe(fills[2]);
    expect(fills[0]).not.toBe(fills[1]);
  });
});

describe('bloco bar_chart — formato do valor', () => {
  it('separa a forma CHEIA da COMPACTA em cada formato', () => {
    const plain = (value: string | null) => (value ?? '').replace(/[\u00a0\u202f]/g, ' ');
    const cell = (valueFormat: string) => {
      const { unmount } = renderBlock({ valueFormat });
      const text = within(screen.getByRole('table')).getAllByRole('cell')[0].textContent;
      unmount();
      return plain(text);
    };

    expect(cell('number')).toBe('1.240');
    expect(cell('compactNumber')).toBe('1,24 mil');
    expect(cell('BRL')).toBe('R$ 1.240,00');
    expect(cell('compactBRL')).toBe('R$ 1,24 mil');
  });

  it('usa contagem PT-BR por padrão (não inventa moeda)', () => {
    renderBlock();
    expect(screen.getByRole('table').textContent).not.toContain('R$');
  });
});
