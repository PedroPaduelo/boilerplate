/**
 * Regressão do bloco `funnel_stage` depois da repaginação sobre a base de
 * gráficos.
 *
 * O que este arquivo trava:
 * 1. ZERO COR CRAVADA — a etapa tinha uma paleta em hex e um `rgba()` no
 *    trilho da barra. Nenhum dos dois pode voltar: cor de segmento sai da
 *    RAMPA sequencial (`chartRampToken`) e a trilha, do chrome do tema.
 * 2. RAMPA CLARO → ESCURO E HOVER QUE ESCURECE — cada segmento declara o
 *    próprio passo e o passo seguinte (o do hover), na ordem da referência.
 * 3. ABRE E FECHA DE VERDADE — o gatilho é um botão com `aria-expanded`; o
 *    resumo e a barra continuam visíveis com a etapa fechada.
 * 4. CONTRATO COMUM — Markdown + `{{variavel}}` nos textos e os quatro estados
 *    sem desenho (carregando, vazio, erro, sem permissão).
 * 5. LEITURA DOS DADOS — a consulta chega como tabela genérica com a coluna
 *    `tipo`; papéis desconhecidos são descartados sem derrubar o bloco.
 *
 * Consulta por papel acessível e por `data-slot`, nunca por classe — os nomes
 * de classe são hashes do StyleX.
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import type { TableData } from '@dashboards/contracts';
import { CHART_CHROME_TOKENS, chartRampToken } from '@/shared/ui';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;
const PROPS = { stageLabel: 'N1 · MOMENTO LANÇAMENTO' };

/** Os `style` de cada segmento da barra, na ordem em que foram desenhados. */
function segmentStyles(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-slot="funnel-segment"]')].map(
    (segment) => segment.getAttribute('style') ?? '',
  );
}

describe('bloco funnel_stage — cor', () => {
  it('não pinta nada com hex, rgb ou rgba', () => {
    const { container } = renderWithProviders(
      <Block props={PROPS} data={fixture} state="success" />,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(html).not.toMatch(/rgba?\(/i);
  });

  it('usa a rampa sequencial do design system na barra', () => {
    const { container } = renderWithProviders(
      <Block props={{ ...PROPS, accent: 'green' }} data={fixture} state="success" />,
    );
    // Cada segmento referencia um passo da rampa; trocar o tema repinta a
    // barra sem re-render, porque a cor é `var(--token)` e não valor resolvido.
    const styles = segmentStyles(container);
    expect(styles).toHaveLength(3); // o fixture traz três desfechos

    styles.forEach((style, index) => {
      // Claro → escuro: o passo acompanha a posição do desfecho na barra.
      expect(style).toContain(chartRampToken('shamrock', index + 1));
      // Hover ESCURECE: a cor de hover é o passo SEGUINTE da mesma rampa.
      expect(style).toContain(chartRampToken('shamrock', index + 2));
    });
  });

  it('tira a trilha da barra de um token de chrome do tema', () => {
    const { container } = renderWithProviders(
      <Block props={PROPS} data={fixture} state="success" />,
    );
    const track = container.querySelector('[data-slot="funnel-bar"]');
    expect(track?.getAttribute('style')).toContain(CHART_CHROME_TOKENS.trackLight);
  });
});

describe('bloco funnel_stage — painel', () => {
  it('mostra resumo e barra mesmo fechado, e só então abre o detalhamento', () => {
    renderWithProviders(<Block props={PROPS} data={fixture} state="success" />);

    expect(screen.getByText('N1 · MOMENTO LANÇAMENTO')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /N1 · MOMENTO LANÇAMENTO/ }),
    ).toBeInTheDocument();

    const trigger = screen.getByRole('button');
    // O valor da etapa fica no gatilho — visível mesmo com a etapa fechada.
    expect(trigger).toHaveTextContent('R$ 3.745.086.826,03');
    // ... e a taxa de conversão ao lado dele.
    expect(trigger).toHaveTextContent('100% dos lançamentos');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('abre já expandido quando o bloco pede', () => {
    renderWithProviders(
      <Block props={{ ...PROPS, defaultOpen: true }} data={fixture} state="success" />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('detalha os desfechos numa tabela com total no rodapé', () => {
    renderWithProviders(
      <Block props={{ ...PROPS, defaultOpen: true }} data={fixture} state="success" />,
    );
    expect(screen.getByRole('columnheader', { name: 'Desfecho' })).toBeInTheDocument();
    expect(screen.getByText('Pago como lançamento')).toBeInTheDocument();
    expect(
      screen.getByText('Total lançado (universo, exclui cancelado)'),
    ).toBeInTheDocument();
  });
});

describe('bloco funnel_stage — contrato comum', () => {
  it('interpola variáveis e aplica markdown nos textos do bloco', () => {
    renderWithProviders(
      <Block
        props={{
          ...PROPS,
          stageLabel: '**N1** · {{contagem}} linhas',
          barLabel: 'universo de {{quantidade}} lançamentos',
        }}
        data={fixture}
        state="success"
      />,
    );
    // O markdown vira ênfase de verdade (o `<strong>` é um nó próprio).
    expect(screen.getByText('N1')).toBeInTheDocument();
    expect(screen.getByText(/· 5 linhas/)).toBeInTheDocument();
    expect(screen.getByText(/universo de 10.835.362 lançamentos/)).toBeInTheDocument();
  });

  it('mostra o esqueleto enquanto os dados não chegam', () => {
    renderWithProviders(<Block props={PROPS} state="skeleton" />);
    expect(
      screen.getByRole('status', { name: /Carregando N1 · MOMENTO LANÇAMENTO/ }),
    ).toBeInTheDocument();
  });

  it('avisa quando a consulta falha', () => {
    renderWithProviders(
      <Block props={PROPS} state="error" error="timeout na consulta" />,
    );
    expect(screen.getByText(/erro ao carregar os dados/i)).toBeInTheDocument();
    expect(screen.getByText('timeout na consulta')).toBeInTheDocument();
  });

  it('separa falta de permissão de erro de consulta', () => {
    renderWithProviders(
      <Block props={PROPS} state="error" error="403: sem permissão no schema" />,
    );
    expect(screen.getByText(/sem permissão para ver estes dados/i)).toBeInTheDocument();
  });
});

describe('bloco funnel_stage — dados', () => {
  it('encolhe os valores quando o bloco pede formato compacto', () => {
    renderWithProviders(
      <Block
        props={{ ...PROPS, valueFormat: 'compactBRL' }}
        data={fixture}
        state="success"
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('R$ 3,75 bi');
  });

  it('avisa quando nenhuma linha tem papel reconhecido', () => {
    const semPapel: TableData = {
      columns: [{ key: 'tipo', label: 'tipo', type: 'string' }],
      rows: [{ tipo: 'outra-coisa', valor: 10 }],
    };
    renderWithProviders(<Block props={PROPS} data={semPapel} state="success" />);
    expect(screen.getByText(/sem dados para esta etapa/i)).toBeInTheDocument();
  });

  it('deixa o bloco trocar a mensagem de vazio, com interpolação', () => {
    const semPapel: TableData = {
      columns: [{ key: 'tipo', label: 'tipo', type: 'string' }],
      rows: [{ tipo: 'outra-coisa', valor: 10 }],
    };
    renderWithProviders(
      <Block
        props={{ ...PROPS, emptyMessage: 'Nada em {{etapa}}' }}
        data={semPapel}
        state="success"
      />,
    );
    expect(screen.getByText('Nada em N1 · MOMENTO LANÇAMENTO')).toBeInTheDocument();
  });
});
