import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { z } from 'zod';
import { DomainError, normalizeEmail } from '@almacen/domain';
function passwordValue(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0)
    throw new DomainError('REQUIRED_FIELD', 'La contraseña es obligatoria.', { field: 'password' });
  return value;
}
export class PasswordService {
  private dummy: Promise<string> | undefined;
  validate(email: unknown, password: unknown): {
    email: string;
    password: string;
  } {
    if (typeof email !== 'string' || !email.trim())
      throw new DomainError('REQUIRED_FIELD', 'El correo es obligatorio.', { field: 'email' });
    const normalized = normalizeEmail(email);
    if (!z.email().safeParse(normalized).success)
      throw new DomainError('INVALID_EMAIL', 'El correo no tiene un formato válido.', { field: 'email' });
    return { email: normalized, password: passwordValue(password) };
  }
  async hash(password: unknown): Promise<string> { return argon2.hash(passwordValue(password), { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 }); }
  async verify(password: unknown, hash: string | null): Promise<boolean> {
    if (typeof password !== 'string' || password.length === 0)
      return false;
    if (!hash || !hash.startsWith('$argon2id$')) {
      this.dummy ??= this.hash(randomBytes(32).toString('base64url'));
      await argon2.verify(await this.dummy, password);
      return false;
    }
    try {
      return await argon2.verify(hash, password);
    }
    catch {
      return false;
    }
  }
}
