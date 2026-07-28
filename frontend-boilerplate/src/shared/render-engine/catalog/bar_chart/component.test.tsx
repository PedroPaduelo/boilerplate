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
 *
 * Onde ficam as marcas de cor: o `ResponsiveContainer` do recharts mede zero no
 * jsdom, então o SVG não é desenhado — a LEGENDA é a única marca de cor que
 * existe fora dele, e é por ela que a cor é verificada.
 *
 * Consultas por papel acessível — nunca por classe (o StyleX gera nomes novos
 * a cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

const MULTI_SERIES = [
  { x: 'Jan', y: 120, series: 'Receita' },
  { x: 'Jan', y: 90, series: 'Despesa' },
  { x: 'Fev', y: 138, series: 'Receita' },
  { x: 'Fev', y: 110, series: 'Despesa' },
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

/**
 * VERDE80 — `--ds-color-primary-dark` (#007867) a 80%, a cor das colunas em
 * §4, §5 e §6 da referência e a mais recorrente do catálogo.
 */
const VERDE80 = 'rgba(0, 120, 103, 0.8)';

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
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByRole('img', { name: /barras/i })).toBeInTheDocument();
  });

  it('publica as categorias e os valores como tabela', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Jan' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Mai' })).toBeInTheDocument();
    // Uma coluna por série, além da coluna de categoria.
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
  });

  it('abre uma coluna por série quando o dado é multi-série', () => {
    renderWithProviders(<Block props={{}} data={MULTI_SERIES} state="success" />);
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
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: 'chart-3' }}
        data={MULTI_SERIES}
        state="success"
      />,
    );
    // `chart-3` é a 3ª cor da paleta da referência: ciano.
    expect(container.innerHTML).toContain(`var(${TOKEN.cyan})`);
  });

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: '#40E0D0' }}
        data={MULTI_SERIES}
        state="success"
      />,
    );
    // Cor que o sistema não reconhece cai na paleta — e nunca é repassada.
    expect(container.innerHTML).not.toContain('#40E0D0');
    expect(container.innerHTML).toContain('--ds-color-');
  });

  it('pinta a 1ª série com o VERDE80 da referência, não com o verde puro', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={MULTI_SERIES} state="success" />,
    );
    expect(container.innerHTML).toContain(VERDE80);
    expect(container.innerHTML).not.toContain(`var(${TOKEN.emerald})`);
  });

  it('dá âmbar à 2ª série da coluna múltipla (§5)', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={MULTI_SERIES} state="success" />,
    );
    expect(container.innerHTML).toContain(`var(${TOKEN.amber})`);
  });

  it('mantém o VERDE80 quando o autor escolhe o acento padrão do catálogo', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: 'chart-1' }}
        data={MULTI_SERIES}
        state="success"
      />,
    );
    expect(container.innerHTML).toContain(VERDE80);
  });
});

describe('bloco bar_chart — legenda', () => {
  it('lista uma entrada por série quando o dado é multi-série (§5)', () => {
    renderWithProviders(<Block props={{}} data={MULTI_SERIES} state="success" />);
    const legend = screen.getByRole('list');
    expect(within(legend).getAllByRole('listitem')).toHaveLength(2);
    expect(within(legend).getByText('Receita')).toBeInTheDocument();
    expect(within(legend).getByText('Despesa')).toBeInTheDocument();
  });

  it('não desenha legenda para uma série só (§4)', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
