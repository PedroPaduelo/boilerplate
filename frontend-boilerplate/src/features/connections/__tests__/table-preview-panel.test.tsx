import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { TablePreviewPanel } from '../components/table-preview-panel';
import type { QueryResult } from '../types';

/**
 * Aba "Dados" — split view (editor em cima, resultado embaixo) que substituiu
 * o modal de consulta. Protege o contrato dos dois públicos: o resultado
 * aparece SEM ninguém digitar (a página semeia o SQL), e o técnico consegue
 * editar e rodar ali mesmo, com a árvore de schema ainda visível.
 */
function makeResult(rowCount: number): QueryResult {
  return {
    columns: [
      { name: 'id', dataTypeID: 23 },
      { name: 'nome', dataTypeID: 25 },
    ],
    rows: Array.from({ length: rowCount }, (_, index) => ({
      id: index + 1,
      nome: `Pessoa ${index + 1}`,
    })),
    rowCount,
    truncated: false,
    durationMs: 12,
  };
}

const baseProps = {
  sql: 'SELECT * FROM public.clientes LIMIT 50;',
  onSqlChange: () => {},
  onRun: () => {},
  isPending: false,
  result: null,
  errorMessage: null,
};

describe('TablePreviewPanel — split view de consulta', () => {
  it('mostra o editor com o SQL e o resultado na MESMA tela (sem modal)', () => {
    renderWithProviders(<TablePreviewPanel {...baseProps} result={makeResult(3)} />);

    // Editor visível...
    expect(screen.getByRole('textbox', { name: /consulta sql/i })).toHaveValue(
      'SELECT * FROM public.clientes LIMIT 50;',
    );
    // ...e resultado junto, na mesma tela. Nada de dialog cobrindo a árvore.
    expect(screen.getByText('Pessoa 1')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Executar e Ctrl+Enter disparam a consulta', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    renderWithProviders(<TablePreviewPanel {...baseProps} onRun={onRun} />);

    await user.click(screen.getByRole('button', { name: /executar/i }));
    expect(onRun).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('textbox', { name: /consulta sql/i }));
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onRun).toHaveBeenCalledTimes(2);
  });

  it('não executa com o editor vazio', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    renderWithProviders(<TablePreviewPanel {...baseProps} sql="   " onRun={onRun} />);

    const button = screen.getByRole('button', { name: /executar/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);
    expect(onRun).not.toHaveBeenCalled();
  });

  it('erro fica INLINE com retry (o toast some, o banner não)', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    renderWithProviders(
      <TablePreviewPanel
        {...baseProps}
        onRun={onRun}
        errorMessage='syntax error at or near "SELCT"'
      />,
    );

    expect(screen.getByText('A consulta falhou')).toBeInTheDocument();
    expect(screen.getByText(/syntax error/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('pagina o resultado — 50 linhas não viram 50 linhas na tela', () => {
    renderWithProviders(<TablePreviewPanel {...baseProps} result={makeResult(50)} />);

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    // 25 linhas da página + 1 de cabeçalho.
    expect(rows).toHaveLength(26);
    expect(screen.getByText('Pessoa 1')).toBeInTheDocument();
    expect(screen.queryByText('Pessoa 26')).not.toBeInTheDocument();
  });

  it('ordena ao clicar no cabeçalho da coluna', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TablePreviewPanel {...baseProps} result={makeResult(30)} />);

    // Cabeçalho clicável = coluna ordenável.
    const header = screen.getByRole('button', { name: /id/i });
    await user.click(header);

    const firstDataRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(within(firstDataRow).getByText('1')).toBeInTheDocument();

    await user.click(header); // descendente
    const afterDesc = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(within(afterDesc).getByText('30')).toBeInTheDocument();
  });

  it('conexão inativa: não mostra editor nem consulta', () => {
    renderWithProviders(
      <TablePreviewPanel
        {...baseProps}
        isDisabled
        disabledReason="Conexão inativa — reative para consultar."
      />,
    );

    expect(
      screen.getByText('Conexão inativa — reative para consultar.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /consulta sql/i })).toBeNull();
  });
});
