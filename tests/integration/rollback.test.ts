import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { withTransaction } from '../../packages/database/dist/transaction.js';

describe('I-INV/rollback-inyectado', () => {
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  const table = `"${schema}".positions`;
  const owner = new pg.Pool({ connectionString: process.env.TEST_MIGRATION_URL, max: 1, connectionTimeoutMillis: 3000 });
  const app = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1, connectionTimeoutMillis: 3000 });
  beforeAll(async () => {
    await owner.query(`CREATE SCHEMA "${schema}"`);
    await owner.query(`CREATE TABLE ${table} (id integer PRIMARY KEY, quantity numeric NOT NULL CHECK (quantity >= 0))`);
    await owner.query(`GRANT USAGE ON SCHEMA "${schema}" TO alm_app`);
    await owner.query(`GRANT SELECT, UPDATE ON ${table} TO alm_app`);
  });
  beforeEach(async () => {
    await owner.query(`DELETE FROM ${table}`);
    await owner.query(`INSERT INTO ${table} VALUES (1, 100), (2, 0)`);
  });
  afterAll(async () => {
    try { await owner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
    finally { await app.end(); await owner.end(); }
  });
  it('confirma todos los cambios cuando la operación termina', async () => {
    const result = await withTransaction(app, async client => {
      await client.query(`UPDATE ${table} SET quantity = quantity - $1 WHERE id = 1`, ['10']);
      await client.query(`UPDATE ${table} SET quantity = quantity + $1 WHERE id = 2`, ['10']);
      return 'confirmed';
    });
    expect(result).toBe('confirmed');
    expect((await app.query(`SELECT quantity::text FROM ${table} ORDER BY id`)).rows).toEqual([{ quantity: '90' }, { quantity: '10' }]);
  });
  it('conserva ambos saldos si falla después del primer cambio', async () => {
    await expect(withTransaction(app, async client => {
      await client.query(`UPDATE ${table} SET quantity = quantity - $1 WHERE id = 1`, ['10']);
      throw new Error('Fallo de prueba después del primer cambio');
    })).rejects.toThrow('Fallo de prueba');
    expect((await app.query(`SELECT quantity::text FROM ${table} ORDER BY id`)).rows).toEqual([{ quantity: '100' }, { quantity: '0' }]);
  });
});
