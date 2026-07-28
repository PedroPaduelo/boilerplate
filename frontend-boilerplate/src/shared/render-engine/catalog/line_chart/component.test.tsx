/**
 * Regressão do bloco `line_chart` depois da repaginação para o layout §1
 * (Linha) da referência de gráficos.
 *
 * O que este arquivo trava:
 * 1. OS QUATRO ESTADOS — carregando, sem dados, erro e com dados. Eixo vazio em
 *    silêncio (ou um erro de consulta disfarçado de "sem dados") era o defeito
 *    clássico do bloco antigo.
 * 2. LEITURA SEM VER — os rótulos do eixo vivem dentro do SVG; o bloco publica
 *    os mesmos números como tabela para leitor de tela.
 * 3. LAYOUT DA §1 — a 1ª série usa o verde escuro a 80% (`rgba(0,120,103,.8)`,
 *    a cor mais recorrente do catálogo) e a 2ª o âmbar; a legenda fica ligada.
 * 4. CONTRATO COMUM — mensagem de vazio com Markdown e `{{variavel}}` resolvida
 *    a partir dos dados.
 * 5. COR DE TOKEN — o acento vira token do design system, e uma cor crua legada
 *    NÃO atravessa para o desenho.
 *
 * Consultas por papel acessível — nunca por classe (o StyleX gera nomes novos a
 * cada build). A única exceção é ler o `style` de um item da legenda já achado
 * por papel: a cor da série é justamente o que a §1 especifica.
 */
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition, toLineSeries } from './component';
import { fixture } from './fixture';

const Block = definition.Component;

/** Série única SEM nome próprio — o caso mais comum de uma consulta simples. */
const SINGLE = [
  { x: '2026-01', y: 12 },
  { x: '2026-02', y: 18 },
];

/** Verde escuro a 80% da §1 — o valor da referência, resolvido do tema. */
const REFERENCE_GREEN_80 = 'rgba(0, 120, 103, 0.8)';

describe('bloco line_chart — estados', () => {
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

  it('mostra o erro como erro — e não como "sem dados"', () => {
    renderWithProviders(
      <Block props={{}} data={[]} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    expect(screen.queryByText(/sem dados para exibir/i)).not.toBeInTheDocument();
  });
});

describe('bloco line_chart — leitura sem ver', () => {
  it('anuncia o gráfico como imagem de dados', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByRole('img', { name: /linhas/i })).toBeInTheDocument();
  });

  it('publica os períodos e os valores como tabela', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: '2026-01' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: '2026-06' })).toBeInTheDocument();
    // Uma coluna por série, além da coluna de período.
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3);
  });

  it('resume as séries em texto para quem não vê o desenho', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    expect(screen.getByText(/2 série\(s\): Arrecadado, Previsto/)).toBeInTheDocument();
  });
});

describe('bloco line_chart — layout §1 (Linha)', () => {
  it('pinta a 1ª série com o verde a 80% e a 2ª com o âmbar do ciclo', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Arrecadado');
    expect(items[0]).toHaveStyle({ color: REFERENCE_GREEN_80 });
    expect(items[1]).toHaveTextContent('Previsto');
    expect(items[1]).toHaveStyle({ color: 'var(--ds-color-warning-main)' });
  });

  it('mantém a legenda ligada, com um item por série', () => {
    renderWithProviders(<Block props={{}} data={fixture} state="success" />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Arrecadado', 'Previsto']);
  });

  it('não desenha legenda de um item só para série sem nome', () => {
    renderWithProviders(<Block props={{}} data={SINGLE} state="success" />);
    // O rótulo genérico ("Série") repetiria o título do card — vira ruído.
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('bloco line_chart — contrato comum', () => {
  it('interpola {{variavel}} e markdown na mensagem de vazio', () => {
    renderWithProviders(
      <Block
        props={{ emptyMessage: '**Nenhum** lançamento em {{contagem}} linhas' }}
        data={[]}
        state="success"
      />,
    );
    expect(screen.getByText('Nenhum lançamento em 0 linhas')).toBeInTheDocument();
  });

  it('deriva pico e vale como insights do rodapé', () => {
    expect(definition.deriveTakeaway?.(fixture)).toEqual([
      'Pico: 2026-05 (30)',
      'Vale: 2026-01 (9)',
    ]);
  });
});

describe('bloco line_chart — cor', () => {
  it('resolve o acento antigo para um token de dado do DS', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: 'chart-3' }}
        data={fixture}
        state="success"
      />,
    );
    // A legenda é a única marca de cor que existe fora do SVG.
    expect(container.innerHTML).toContain('--ds-color-info-main');
  });

  it('não deixa uma cor crua legada chegar ao desenho', () => {
    const { container } = renderWithProviders(
      <Block
        props={{ palette: 'single', accent: '#40E0D0' }}
        data={fixture}
        state="success"
      />,
    );
    expect(container.innerHTML).not.toContain('#40E0D0');
    expect(container.innerHTML).toContain(REFERENCE_GREEN_80);
  });
});

describe('bloco line_chart — adaptação dos dados', () => {
  it('agrupa os pontos por série mantendo a ordem do eixo X', () => {
    const { series, labels, isNamed } = toLineSeries(fixture);
    expect(labels).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    expect(series.map((item) => item.label)).toEqual(['Arrecadado', 'Previsto']);
    expect(series[0].data).toEqual([12, 18, 15, 24, 30, 28]);
    expect(isNamed).toBe(true);
  });

  it('marca como sem nome a série que a consulta não nomeou', () => {
    expect(toLineSeries(SINGLE).isNamed).toBe(false);
  });
});
