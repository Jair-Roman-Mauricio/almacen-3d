import { AsyncLocalStorage } from 'node:async_hooks';
import { DomainError } from '@almacen/domain';
import type { Pool, PoolClient } from 'pg';

const transactions = new AsyncLocalStorage<{active: boolean}>();

export async function withTransaction<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  if (transactions.getStore()?.active) {
    throw new DomainError('NESTED_TRANSACTION', 'No se admite una transacción independiente dentro de otra.');
  }
  const client = await pool.connect();
  const scope = {active: true};
  return transactions.run(scope, async () => {
    let discard = false;
    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        discard = true;
      }
      if (error && typeof error === 'object' && 'code' in error && ['40P01', '40001', '55P03'].includes(String(error.code))) {
        throw new DomainError('TEMPORARY_FAILURE', 'La operación debe consultarse y reintentarse con su misma referencia.');
      }
      throw error;
    } finally {
      scope.active = false;
      client.release(discard);
    }
  });
}
