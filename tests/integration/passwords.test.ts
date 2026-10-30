import { describe, it, expect } from 'vitest';
import { PasswordService } from '../../apps/api/dist/identity/password-service.js';
describe('I-ACC/credenciales', () => {
  it('usa Argon2id con sal aleatoria y conserva la contraseña exacta', async () => {
    const service = new PasswordService();
    const password = '  Contraseña exacta  ';
    const hash = await service.hash(password);
    const other = await service.hash(password);
    expect(hash).not.toBe(other);
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(password);
    expect(await service.verify(password, hash)).toBe(true);
    expect(await service.verify(password.trim(), hash)).toBe(false);
    expect(await service.verify('incorrecta', hash)).toBe(false);
  });
  it('normaliza correo, rechaza ausencia/formato inválido y no impone complejidad comercial', async () => {
    const service = new PasswordService();
    expect(service.validate(' USER@EXAMPLE.TEST ', ' ')).toEqual({ email: 'user@example.test', password: ' ' });
    for (const email of ['', undefined, 'sin-arroba', 'x@', 'x y@example.test'])
      expect(() => service.validate(email, 'x')).toThrow();
    for (const password of ['', undefined, null, 123])
      expect(() => service.validate('x@example.test', password)).toThrow();
    expect(await service.verify('x', await service.hash('x'))).toBe(true);
  });
});
