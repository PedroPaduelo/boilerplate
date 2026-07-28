import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { TablePreviewPanel } from '../components/table-preview-panel';
import type { QueryResult } from '../types';

/**
 * Aba "Dados" do workbench — o caminho SEM SQL para ver o conteúdo de uma
 * tabela. Protege o contrato central da feature: seleciona → a amostra carrega
 * SOZINHA (usuário não técnico não digita SELECT), erro fica inline com retry
 * e conexão inativa nem dispara consulta.
 */
const { runQueryMock } = vi.hoisted(() => ({ runQueryMock: vi.fn() }));

vi.mock('../api', () => ({
  connectionsApi: { runQuery: runQueryMock },
}));

const result: QueryResult = {
  columns: [
    { name: 'id', dataTypeID: 23 },
    { name: 'nome', dataTypeID: 25 },
  ],
  rows: [
    { id: 1, nome: 'Ana' },
    { id: 2, nome: 'Bia' },
  ],
  rowCount: 2,
  truncated: false,
  durationMs: 12,
};

describe('TablePreviewPanel', () => {
  beforeEach(() => {
    runQueryMock.mockReset();
  });

  it('carrega a amostra automaticamente e mostra as linhas', async () => {
    runQueryMock.mockResolvedValue(result);

    renderWithProviders(
      <TablePreviewPanel
        connectionId="conn-1"
        schema="public"
        table="clientes"
        onOpenSql={() => {}}
      />,
    );

    // Disparou sozinho, com o SELECT da tabela certa e o cap da amostra.
    await waitFor(() => expect(runQueryMock).toHaveBeenCalledTimes(1));
    expect(runQueryMock.mock.calls[0][0]).toMatchObject({
      id: 'conn-1',
      maxRows: 50,
    });
    expect(runQueryMock.mock.calls[0][0].sql).toContain('public.clientes');

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bia')).toBeInTheDocument();
  });

  it('conexão inativa: NÃO consulta e explica o motivo', () => {
    renderWithProviders(
      <TablePreviewPanel
        connectionId="conn-1"
        schema="public"
        table="clientes"
        isDisabled
        disabledReason="Conexão inativa — reative para consultar."
        onOpenSql={() => {}}
      />,
    );

    expect(runQueryMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Conexão inativa — reative para consultar.'),
    ).toBeInTheDocument();
  });

  it('erro fica INLINE com retry — e o retry reconsulta', async () => {
    const user = userEvent.setup();
    runQueryMock.mockRejectedValueOnce(new Error('timeout'));
    runQueryMock.mockResolvedValueOnce(result);

    renderWithProviders(
      <TablePreviewPanel
        connectionId="conn-1"
        schema="public"
        table="clientes"
        onOpenSql={() => {}}
      />,
    );

    expect(
      await screen.findByText('Não foi possível carregar a amostra'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(runQueryMock).toHaveBeenCalledTimes(2);
  });

  it('tabela vazia é um achado, não um erro', async () => {
    runQueryMock.mockResolvedValue({ ...result, rows: [], rowCount: 0 });

    renderWithProviders(
      <TablePreviewPanel
        connectionId="conn-1"
        schema="public"
        table="clientes"
        onOpenSql={() => {}}
      />,
    );

    expect(await screen.findByText('Tabela sem registros')).toBeInTheDocument();
  });
});
