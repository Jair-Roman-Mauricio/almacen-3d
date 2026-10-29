import { describe, expect, it } from 'vitest';
import { normalizeName, normalizeCode, normalizeEmail } from '../../packages/domain/src/identifiers.js';
describe('U-VAL/nombres-codigos', () => {
  it('recorta nombres y cuenta caracteres Unicode, no unidades UTF-16', () => {
    expect(normalizeName('  Almacén central\n')).toBe('Almacén central');
    expect(normalizeName('😀'.repeat(160))).toHaveLength(320);
    expect(() => normalizeName('😀'.repeat(161))).toThrow();
    expect(() => normalizeName(' '.repeat(10))).toThrow();
    expect(() => normalizeName(null)).toThrow();
  });
  it('acepta nombres de 160 y rechaza 161 caracteres', () => {
    expect(normalizeName('a'.repeat(160))).toHaveLength(160);
    expect(() => normalizeName('a'.repeat(161))).toThrow();
  });
  it('normaliza NFC y claves equivalentes por espacios y mayúsculas', () => {
    expect(normalizeCode('  a/e\u0301_部.١-2 ')).toEqual({ value: 'a/é_部.١-2', key: 'A/É_部.١-2' });
    expect(normalizeCode(' ÁREA/1 ').key).toBe(normalizeCode('a\u0301rea/1').key);
    expect(normalizeCode('ß').key).toBe(normalizeCode('SS').key);
  });
  it('acepta 64 caracteres Unicode y rechaza exceso', () => {
    expect(normalizeCode('𐐀'.repeat(64)).value).toHaveLength(128);
    expect(() => normalizeCode('a'.repeat(65))).toThrow();
    expect(() => normalizeCode('𐐀'.repeat(65))).toThrow();
  });
  it.each(['', ' ', 'a b', 'a\tb', 'a\nb', 'a@b', 'a:b', 'a\\b', '😀', '\u0301'])('rechaza código inválido %s', value => {
    expect(() => normalizeCode(value)).toThrow();
  });
  it('normaliza correo por separado y conserva símbolos de correo', () => {
    expect(normalizeEmail('  User+parte@EXAMPLE.COM  ')).toBe('user+parte@example.com');
    expect(() => normalizeCode('User+parte@EXAMPLE.COM')).toThrow();
    expect(() => normalizeEmail('user example.com')).toThrow();
  });
});
