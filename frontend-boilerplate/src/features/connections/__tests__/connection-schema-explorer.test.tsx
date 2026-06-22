import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SchemaExplorerView } from '../components/connection-schema-explorer';
import type { Connection, ConnectionSchema } from '../types';

const connection: Pick<
  Connection,
  'id' | 'name' | 'database' | 'host' | 'port'
> = {
  id: 'conn-1',
  name: 'Data Warehouse',
  database: 'analytics',
  host: 'db.example.com',
  port: 5432,
};

const schema: ConnectionSchema = {
  connectionId: 'conn-1',
  cached: false,
  tableCount: 2,
  fetchedAt: '2024-01-01T00:00:00.000Z',
  tables: [
    {
      schema: 'public',
      name: 'customers',
      columns: [
        { name: 'id', dataType: 'integer', nullable: false },
        { name: 'email', dataType: 'text', nullable: false },
      ],
    },
    {
      schema: 'public',
      name: 'orders',
      columns: [{ name: 'total', dataType: 'numeric', nullable: true }],
    },
  ],
};

describe('SchemaExplorerView', () => {
  it('renderiza as tabelas e colunas do schema (dados mock)', () => {
    render(<SchemaExplorerView schema={schema} connection={connection} />);

    // Tabelas aparecem na lista do explorer.
    expect(screen.getAllByText('customers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('orders').length).toBeGreaterThan(0);

    // Colunas da primeira tabela selecionada (customers) aparecem no detalhe.
    expect(screen.getAllByText('email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('id').length).toBeGreaterThan(0);
  });

  it('mostra estado vazio quando não há tabelas', () => {
    render(
      <SchemaExplorerView
        schema={{ ...schema, tables: [], tableCount: 0 }}
        connection={connection}
      />,
    );
    expect(screen.getByText('Nenhuma tabela encontrada')).toBeInTheDocument();
  });
});
