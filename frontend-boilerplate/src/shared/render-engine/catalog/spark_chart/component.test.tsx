/**
 * Regressão do bloco `spark_chart` depois da repaginação sobre o mini-gráfico
 * do card de resumo (`04-widgets-prontos.md` §2.3/§2.4).
 *
 * O que este arquivo trava:
 * 1. AS TRÊS VARIANTES — `area`, `bar` e `line` continuam existindo. A
 *    referência tem uma dimensão e um ajuste para cada uma; perder uma delas
 *    quebra um painel salvo sem erro nenhum.
 * 2. ACESSIBILIDADE — um spark não tem eixo nem legenda: o rótulo e a tabela
 *    equivalente são a ÚNICA leitura para quem não vê o desenho.
 * 3. OS ESTADOS — carregando, sem dados e erro nunca viram área em branco.
 * 4. CONTRATO COMUM — o resumo aceita `{{variavel}}` resolvida a partir dos
 *    dados do próprio bloco.
 *
 * Consultas por papel acessível e `data-slot` — nunca por classe (os nomes são
 * hashes do StyleX, novos a cada build).
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';

const Block = definition.Component;

const DATA = [
  { x: '1', y: 8 },
  { x: '2', y: 12 },
  { x: '3', y: 9 },
  { x: '4', y: 28 },
];

describe('bloco spark_chart', () => {
  it('anuncia o desenho como imagem de dados', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(
      screen.getByRole('img', { name: 'Minigráfico de tendência' }),
    ).toBeInTheDocument();
  });

  it('mantém as três formas do parâmetro `type`', () => {
    for (const type of ['area', 'bar', 'line'] as const) {
      const { unmount } = renderWithProviders(
        <Block props={{ type }} data={DATA} state="success" />,
      );
      expect(
        screen.getByRole('img', { name: 'Minigráfico de tendência' }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('publica a série como tabela para leitor de tela', () => {
    const { container } = renderWithProviders(
      <Block props={{}} data={DATA} state="success" />,
    );
    const table = container.querySelector('[data-slot="chart-data-table"]');
    expect(table).toBeInTheDocument();
    expect(table).toHaveTextContent('28');
  });

  it('resolve {{variaveis}} no resumo, a partir dos dados', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="success" />);
    expect(
      screen.getByText('4 pontos. Menor 8, maior 28, último 28.'),
    ).toBeInTheDocument();
  });

  it('avisa quando não há dados em vez de desenhar uma caixa vazia', () => {
    renderWithProviders(<Block props={{}} data={[]} state="success" />);
    expect(screen.getByText('Sem dados para desenhar a tendência')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('troca o desenho pelo esqueleto enquanto carrega', () => {
    renderWithProviders(<Block props={{}} data={DATA} state="loading" />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mostra o erro no lugar do desenho', () => {
    renderWithProviders(
      <Block props={{}} data={DATA} state="error" error="Consulta expirou" />,
    );
    expect(screen.getByText('Consulta expirou')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('deriva insight de tendência e faixa a partir da série', () => {
    expect(definition.deriveTakeaway?.(DATA)).toEqual([
      'Tendência: alta (+250.0%)',
      'Faixa: 8–28',
    ]);
  });
});
