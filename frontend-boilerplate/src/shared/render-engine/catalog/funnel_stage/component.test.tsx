/**
 * Regressão do bloco `funnel_stage` depois da reescrita sobre tokens.
 *
 * O que este arquivo trava:
 * 1. ZERO COR CRAVADA — a etapa tinha uma paleta em hex e um `rgba()` no
 *    trilho da barra. Nenhum dos dois pode voltar.
 * 2. ABRE E FECHA DE VERDADE — o gatilho é um botão com `aria-expanded`; o
 *    resumo e a barra continuam visíveis com a etapa fechada.
 * 3. LEITURA DOS DADOS — a consulta chega como tabela genérica com a coluna
 *    `tipo`; papéis desconhecidos são descartados sem derrubar o bloco.
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import type { TableData } from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { definition } from './component';
import { fixture } from './fixture';

const Block = definition.Component;
const PROPS = { stageLabel: 'N1 · MOMENTO LANÇAMENTO' };

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
    expect(container.innerHTML).toMatch(/--color-data-shamrock-\d/);
    expect(container.innerHTML).toContain('--color-track');
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
});
