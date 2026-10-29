import { describe, expect, it } from 'vitest';
import { assertTestDatabaseTarget } from '../../packages/database/src/test-target.js';

describe('O-OPS/destino-pruebas', () => {
  const development = 'postgresql://alm_app:dev@127.0.0.1:55432/almacen_dev';
  it('acepta un destino de prueba separado', () => {
    expect(() => assertTestDatabaseTarget('postgresql://alm_app:test@127.0.0.1:55433/almacen_test', development)).not.toThrow();
  });
  it.each([
    development,
    'postgresql://otro:clave@localhost:55432/almacen_dev',
    'postgresql://alm_app:test@127.0.0.1:55433/produccion',
    'https://localhost/almacen_test',
    '',
  ])('rechaza un destino incorrecto sin exponer la URL', url => {
    expect(() => assertTestDatabaseTarget(url, development)).toThrow('pruebas');
  });
  it('detecta alias de host y credenciales distintas de la misma base', () => {
    expect(() => assertTestDatabaseTarget('postgresql://x:y@localhost:55433/almacen_test', 'postgresql://z:w@127.0.0.1:55433/almacen_test')).toThrow('pruebas');
  });
});
