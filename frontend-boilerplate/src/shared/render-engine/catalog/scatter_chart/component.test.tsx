/**
 * Regressão do bloco `scatter_chart` depois da repaginação para o layout §15
 * da referência (Dispersão).
 *
 * O que este arquivo trava:
 * 1. OS QUATRO ESTADOS — carregando, sem dados, erro e com dados. Uma nuvem de
 *    pontos vazia em silêncio é indistinguível de "deu ruim".
 * 2. LEITURA SEM VER — os pontos vivem dentro do SVG; quem conta a história
 *    para o leitor de tela é o equivalente textual (quantos pontos, quantas
 *    categorias) e a legenda.
 * 3. COR É IDENTIDADE DO GRUPO — cada categoria pega a próxima cor da paleta
 *    base, NA ORDEM, e sempre como token do design system (nunca hex).
 * 4. CONTRATO COMUM DE TEXTO — rótulo de eixo e mensagem de vazio aceitam
 *    Markdown e `{{variavel}}`, com o escopo derivado dos dados.
 *
 * Consultas por papel acessível — nunca por classe (o StyleX gera nomes novos
 * a cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CHART_HEIGHT, ScatterChart } from '@/shared/ui';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Duas categorias → duas cores da paleta, na ordem. */
const DATA = [
  { x: 12, y: 40, series: 'Zona A' },
  { x: 28, y: 55, series: 'Zona B' },
];

describe('bloco scatter_chart — estados', () => {
  it('mostra esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={{}} state="skeleton" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando a consulta não devolveu pontos', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });

  it('mostra a causa do erro no lugar do gráfico', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
  });
});

describe('bloco scatter_chart — leitura sem ver', () => {
  it('anuncia a dispersão como imagem de dados', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByRole('img', { name: /dispersão/i })).toBeInTheDocument();
  });

  it('publica quantos pontos e quantas categorias como equivalente textual', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByText(/8 pontos em 2 categoria\(s\)/)).toBeInTheDocument();
  });

  it('reserva a altura de 350px da referência (§15)', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByRole('img', { name: /dispersão/i })).toHaveStyle({
      height: `${CHART_HEIGHT.scatter}px`,
    });
  });
});

describe('bloco scatter_chart — legenda e cor', () => {
  it('lista uma entrada por categoria', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(screen.getByText('Zona A')).toBeInTheDocument();
    expect(screen.getByText('Zona B')).toBeInTheDocument();
  });

  it('pinta as categorias com a paleta base NA ORDEM, sempre por token', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    const legend = screen.getByRole('list');
    // 1ª cor da referência (#00A76F) e 2ª (#FFAB00), como token do DS.
    expect(legend.innerHTML).toContain('var(--ds-color-primary-main)');
    expect(legend.innerHTML).toContain('var(--ds-color-warning-main)');
    expect(legend.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('`palette: "single"` junta todos os pontos numa série só', () => {
    renderWithProviders(
      <Block props={{ palette: 'single' }} data={DATA} state="success" />,
    );
    expect(screen.queryByText('Zona A')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    renderWithProviders(
      <Block props={{ accent: '#40E0D0' }} data={DATA} state="success" />,
    );
    const legend = screen.getByRole('list');
    expect(legend.innerHTML).not.toContain('#40E0D0');
    expect(legend.innerHTML).toContain('var(--ds-color-');
  });

  /**
   * REGRESSÃO: `accent` estava declarado no manifesto (e na interface do
   * bloco), aparecia no contrato que o agente de IA lê — e o componente NUNCA
   * lia o valor. Percorrer os seis acentos desenhava exatamente a mesma coisa.
   */
  it('aplica o accent declarado, fixando a cor de todos os grupos', () => {
    const { container } = renderWithProviders(
      <Block props={{ accent: 'chart-3' }} data={DATA} state="success" />,
    );
    // Duas categorias, uma cor: a pedida (ciano = chart-3).
    const dots = [...container.querySelectorAll('.recharts-symbols')].map((node) =>
      node.getAttribute('fill'),
    );
    expect(dots.length).toBeGreaterThan(0);
    expect(new Set(dots)).toEqual(new Set(['#00B8D9']));
    // E a legenda acompanha o desenho, sempre por token.
    expect(screen.getByRole('list').innerHTML).toContain('var(--ds-color-info-main)');
  });

  it('sem accent, cada categoria pega a próxima cor do ciclo', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={DATA} state="success" />,
    );
    const dots = [...container.querySelectorAll('.recharts-symbols')].map((node) =>
      node.getAttribute('fill'),
    );
    expect(new Set(dots)).toEqual(new Set(['#00A76F', '#FFAB00']));
  });

  it('esconde a legenda quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ showLegend: false }} data={DATA} state="success" />,
    );
    expect(screen.queryByText('Zona A')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('bloco scatter_chart — grade', () => {
  /**
   * `showGridLines` só age DENTRO do SVG. Enquanto o `ResponsiveContainer` não
   * media nada em teste, ela aparecia como inerte na auditoria — não porque
   * estivesse quebrada, mas porque o gráfico não era desenhado.
   */
  it('showGridLines liga e desliga as guias da grade', () => {
    const { container: withGrid, unmount } = renderWithProviders(
      <Block props={{ showGridLines: true }} data={fixture} state="success" />,
    );
    const lines = withGrid.querySelectorAll('.recharts-cartesian-grid line');
    expect(lines.length).toBeGreaterThan(0);
    // A grade herda o tracejado 3 da configuração base.
    expect(lines[0].getAttribute('stroke-dasharray')).toBe('3 3');
    unmount();

    const { container: bare } = renderWithProviders(
      <Block props={{ showGridLines: false }} data={fixture} state="success" />,
    );
    expect(bare.querySelector('.recharts-cartesian-grid')).toBeNull();
    // O desenho continua: a grade é chrome, não dado.
    expect(bare.querySelectorAll('.recharts-symbols').length).toBeGreaterThan(0);
  });
});

/**
 * Contrato comum de texto — implementado no `ScatterChart` (mesmo lote), por
 * isso a montagem direta: o bloco não expõe rótulo de eixo no `propsSchema`.
 */
describe('ScatterChart — Markdown e {{interpolação}}', () => {
  it('resolve markdown e variáveis nos rótulos dos eixos', () => {
    renderWithProviders(
      <ScatterChart
        data={[{ x: 1, y: 2, category: 'A' }]}
        label="Correlação"
        xLabel="**Preço**"
        yLabel="{{contagem}} vendas"
      />,
    );
    // Os rótulos resolvidos entram no equivalente textual do gráfico.
    expect(screen.getByText(/eixos Preço e 1 vendas/)).toBeInTheDocument();
  });

  it('resolve markdown e variáveis na mensagem de vazio', () => {
    renderWithProviders(
      <ScatterChart data={[]} emptyMessage="*Nada* para {{contagem}} ponto(s)" />,
    );
    expect(screen.getByText('Nada para 0 ponto(s)')).toBeInTheDocument();
  });
});
