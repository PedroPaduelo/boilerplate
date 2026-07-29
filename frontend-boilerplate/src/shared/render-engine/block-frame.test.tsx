import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { BlockFrame } from './block-frame';

describe('BlockFrame (moldura padrão dos blocos de gráfico)', () => {
  it('dá ao bloco um cabeçalho com título e tipo', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação por mês" chartType="Barras">
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(
      screen.getByRole('heading', { name: 'Arrecadação por mês' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Barras')).toBeInTheDocument();
    expect(screen.getByText('gráfico')).toBeInTheDocument();
  });

  it('carregando: troca o corpo pelo esqueleto', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação" isLoading>
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(screen.queryByText('gráfico')).not.toBeInTheDocument();
  });

  it('mostra apenas os insights ligados e não vazios', () => {
    renderWithProviders(
      <BlockFrame
        title="Arrecadação"
        takeaways={[
          { enabled: true, text: 'Maior valor em maio' },
          { enabled: false, text: 'Insight desligado' },
          { enabled: true, text: '   ' },
        ]}
      />,
    );

    expect(screen.getByText('Maior valor em maio')).toBeInTheDocument();
    expect(screen.queryByText('Insight desligado')).not.toBeInTheDocument();
  });

  it('rodapé técnico mostra a query e a duração formatada', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação" query="SELECT 1" durationMs={1400} />,
    );

    expect(screen.getByText('SELECT 1')).toBeInTheDocument();
    expect(screen.getByText('1,4s')).toBeInTheDocument();
  });

  it('showQuery=false esconde o rodapé técnico mesmo com query', () => {
    renderWithProviders(
      <BlockFrame
        title="Arrecadação"
        query="SELECT 1"
        durationMs={1400}
        showQuery={false}
      />,
    );

    expect(screen.queryByText('SELECT 1')).not.toBeInTheDocument();
  });
});

describe('BlockFrame — esqueleto com a silhueta do tipo', () => {
  it('desenha a forma do que está chegando, não um retângulo genérico', () => {
    /*
     * Um retângulo cinza resolve o pulo de layout — o problema mecânico — e
     * deixa o de leitura de pé: carregando, o dashboard vira uma parede de
     * retângulos idênticos e o primeiro olhar não diz nada. Com a silhueta, dá
     * para achar o gráfico que se veio ver ANTES de o dado chegar.
     */
    const { container } = renderWithProviders(
      <BlockFrame title="Arrecadação" state="loading" skeletonShape="bars" />,
    );

    expect(container.querySelector('[data-skeleton-shape="bars"]')).toBeInTheDocument();
  });

  it('o esqueleto continua se anunciando para leitor de tela', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação" state="loading" skeletonShape="line" />,
    );

    expect(
      screen.getByRole('status', { name: 'Carregando Arrecadação' }),
    ).toBeInTheDocument();
  });

  it('sem silhueta declarada, degrada para o retângulo de antes', () => {
    const { container } = renderWithProviders(
      <BlockFrame title="Arrecadação" state="loading" />,
    );

    expect(container.querySelector('[data-skeleton-shape="plain"]')).toBeInTheDocument();
  });
});

describe('BlockFrame — unidade da métrica', () => {
  it('mostra a unidade ao lado do título, sem embuti-la nele', () => {
    /*
     * A unidade fica FORA do título de propósito: "Arrecadação (R$)" mistura o
     * assunto com a escala e — pior — some junto quando o título é truncado,
     * que é exatamente quando mais se precisa dela. Este caso guarda os dois
     * lados: a unidade aparece, e o título continua sendo só o assunto.
     */
    renderWithProviders(
      <BlockFrame title="Arrecadação por mês" unit="R$">
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(
      screen.getByRole('heading', { name: 'Arrecadação por mês' }),
    ).toBeInTheDocument();
    expect(screen.getByText('R$')).toBeInTheDocument();
  });

  it('sem unidade declarada, nada é desenhado (não inventa "un.")', () => {
    const { container } = renderWithProviders(
      <BlockFrame title="Arrecadação">
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(container.querySelector('[data-slot="block-frame-unit"]')).toBeNull();
  });
});

describe('BlockFrame — expandir', () => {
  it('oferece ver em tela cheia e mostra o mesmo gráfico ampliado', async () => {
    /*
     * Por que a ação existe: a altura do card é decidida pela LINHA, o que é
     * ótimo para o alinhamento e ruim para quem quer OLHAR um gráfico
     * específico. Expandir resolve sem quebrar a grade.
     */
    renderWithProviders(
      <BlockFrame title="Arrecadação por mês" unit="R$">
        <div>gráfico</div>
      </BlockFrame>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Arrecadação por mês' }));

    // O diálogo repete título e UNIDADE: ampliado, o gráfico continua dizendo
    // em que escala ele fala.
    await waitFor(() =>
      expect(screen.getByText('Arrecadação por mês · R$')).toBeInTheDocument(),
    );
    // E o conteúdo ampliado é o MESMO nó de gráfico (dois na tela: o do card e
    // o do diálogo) — nenhuma segunda consulta escondida.
    expect(screen.getAllByText('gráfico').length).toBeGreaterThan(1);
  });

  it('NÃO oferece expandir quando não há desenho para ampliar', () => {
    // No esqueleto/erro/vazio o botão abriria um diálogo com a mesma mensagem
    // em corpo maior — uma ação que promete algo e não entrega.
    renderWithProviders(<BlockFrame title="Arrecadação" state="empty" />);

    expect(screen.queryByRole('button', { name: /Expandir/ })).toBeNull();
  });

  it('`isExpandable=false` remove a ação (contextos sem diálogo)', () => {
    renderWithProviders(
      <BlockFrame title="Arrecadação" isExpandable={false}>
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(screen.queryByRole('button', { name: /Expandir/ })).toBeNull();
  });
});

describe('BlockFrame — ênfase (hierarquia entre cards)', () => {
  it('marca o card em destaque de forma inspecionável', () => {
    const { container } = renderWithProviders(
      <BlockFrame title="Arrecadado" emphasis="featured">
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(
      container.querySelector('[data-block-emphasis="featured"]'),
    ).toBeInTheDocument();
  });

  it('bloco sem ênfase declarada continua no visual padrão', () => {
    const { container } = renderWithProviders(
      <BlockFrame title="Arrecadado">
        <div>gráfico</div>
      </BlockFrame>,
    );

    expect(
      container.querySelector('[data-block-emphasis="default"]'),
    ).toBeInTheDocument();
  });
});
