import { describe, it, expect } from 'vitest';
import { toDatabaseSchema, shortServerVersion } from '../lib/schema-mapper';
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
      { name: 'id', type: 'integer', nullable: false, isPrimary: false, isForeign: false },
      { name: 'total', type: 'numeric', nullable: true, isPrimary: false, isForeign: false },
    ]);
    expect(orders.primaryKey).toEqual([]);
    expect(orders.foreignKeys).toEqual([]);
    expect(orders.indexes).toEqual([]);
  });

  it('mapeia os metadados ricos (PK/FK/índices/tamanho/versão) quando presentes', () => {
    const rich: ConnectionSchema = {
      connectionId: 'conn-2',
      cached: false,
      tableCount: 1,
      totalTables: 1,
      truncated: false,
      fetchedAt: '2024-01-01T00:00:00.000Z',
      database: {
        name: 'shop',
        version: 'PostgreSQL 17.10 (Debian 17.10-1.pgdg13+1) on x86_64',
        sizeBytes: 524288, // 0.5 MB
      },
      tables: [
        {
          schema: 'public',
          name: 'orders',
          kind: 'table',
          rowCount: 1500,
          sizeBytes: 2097152, // 2 MB
          comment: 'Pedidos',
          primaryKey: ['id'],
          columns: [
            {
              name: 'id',
              dataType: 'uuid',
              nullable: false,
              defaultValue: 'gen_random_uuid()',
              isPrimary: true,
              isForeign: false,
            },
            {
              name: 'customer_id',
              dataType: 'uuid',
              nullable: false,
              isPrimary: false,
              isForeign: true,
              references: { schema: 'public', table: 'customers', column: 'id' },
            },
          ],
          indexes: [
            {
              name: 'orders_pkey',
              columns: ['id'],
              unique: true,
              primary: true,
              method: 'btree',
            },
            {
              name: 'orders_search_idx',
              columns: ['note'],
              unique: false,
              primary: false,
              method: 'gin',
            },
          ],
          foreignKeys: [
            {
              name: 'orders_customer_fk',
              columns: ['customer_id'],
              references: { schema: 'public', table: 'customers', column: 'id' },
              onDelete: 'CASCADE',
              onUpdate: 'NO ACTION',
            },
          ],
        },
      ],
    };

    const db = toDatabaseSchema(rich, connection);
    expect(db.name).toBe('shop');
    expect(db.version).toBe('17.10');
    expect(db.sizeMB).toBe(0.5);

    const orders = db.schemas[0].tables[0];
    expect(orders.rowCount).toBe(1500);
    expect(orders.sizeMB).toBe(2);
    expect(orders.description).toBe('Pedidos');
    expect(orders.primaryKey).toEqual(['id']);

    const id = orders.columns.find((c) => c.name === 'id')!;
    expect(id.isPrimary).toBe(true);
    expect(id.defaultValue).toBe('gen_random_uuid()');

    const fkCol = orders.columns.find((c) => c.name === 'customer_id')!;
    expect(fkCol.isForeign).toBe(true);
    expect(fkCol.references).toEqual({
      schema: 'public',
      table: 'customers',
      column: 'id',
    });

    expect(orders.indexes.map((i) => i.type)).toEqual(['btree', 'gin']);
    expect(orders.foreignKeys[0].onDelete).toBe('CASCADE');
  });
});

describe('shortServerVersion', () => {
  it('extrai a versão curta do banner do Postgres', () => {
    expect(shortServerVersion('PostgreSQL 17.10 (Debian…)')).toBe('17.10');
    expect(shortServerVersion('PostgreSQL 10.4 on x86_64')).toBe('10.4');
    expect(shortServerVersion(null)).toBe('');
    expect(shortServerVersion(undefined)).toBe('');
  });
});
