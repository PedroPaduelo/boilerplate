import { describe, it, expect } from 'vitest';
import { toDatabaseSchema } from '../lib/schema-mapper';
import type { ConnectionSchema } from '../types';

const connection = {
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
      name: 'orders',
      columns: [
        { name: 'id', dataType: 'integer', nullable: false },
        { name: 'total', dataType: 'numeric', nullable: true },
      ],
    },
    {
      schema: 'public',
      name: 'customers',
      columns: [{ name: 'email', dataType: 'text', nullable: false }],
    },
    {
      schema: 'analytics',
      name: 'events',
      columns: [{ name: 'ts', dataType: 'timestamp', nullable: false }],
    },
  ],
};

describe('toDatabaseSchema', () => {
  it('mapeia para o shape DatabaseSchema do DbSchemaExplorer', () => {
    const db = toDatabaseSchema(schema, connection);
    expect(db.id).toBe('conn-1');
    expect(db.engine).toBe('postgresql');
    expect(db.host).toBe('db.example.com');
    expect(db.port).toBe(5432);
    expect(db.tables).toBe(2);
    expect(db.name).toBe('analytics');
  });

  it('agrupa tabelas por schema (ordenado) e converte colunas', () => {
    const db = toDatabaseSchema(schema, connection);
    // 'analytics' antes de 'public' (ordem alfabética).
    expect(db.schemas.map((s) => s.name)).toEqual(['analytics', 'public']);

    const publicSchema = db.schemas.find((s) => s.name === 'public')!;
    // Tabelas ordenadas: customers antes de orders.
    expect(publicSchema.tables.map((t) => t.name)).toEqual([
      'customers',
      'orders',
    ]);

    const orders = publicSchema.tables.find((t) => t.name === 'orders')!;
    expect(orders.columns).toEqual([
      { name: 'id', type: 'integer', nullable: false, isPrimary: false },
      { name: 'total', type: 'numeric', nullable: true, isPrimary: false },
    ]);
    expect(orders.primaryKey).toEqual([]);
    expect(orders.foreignKeys).toEqual([]);
  });
});
