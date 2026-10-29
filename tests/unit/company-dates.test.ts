import { describe, expect, it } from 'vitest';
import { companyTimeZone, companyDateRange, formatCompanyInstant } from '../../packages/domain/src/company-dates.js';
describe('U-VAL/fechas-empresa', () => {
  it('usa Lima por defecto y admite zonas IANA', () => {
    expect(companyTimeZone()).toBe('America/Lima');
    expect(companyTimeZone('America/New_York')).toBe('America/New_York');
    expect(companyTimeZone('UTC')).toBe('UTC');
  });
  it.each(['', 'Inventada/Zona', '+05:00', 'GMT+5', null, 123])('rechaza zona inválida %s', zone => {
    expect(() => companyTimeZone(zone)).toThrow();
  });
  it('incluye ambos días en Lima mediante un extremo final exclusivo', () => {
    const range = companyDateRange('2026-10-28', '2026-10-29');
    expect(range).toEqual({ fromInclusive: '2026-10-28T05:00:00.000Z', toExclusive: '2026-10-30T05:00:00.000Z', timeZone: 'America/Lima' });
    for (const instant of ['2026-10-28T05:00:00.000Z', '2026-10-30T04:59:59.999Z']) {
      expect(instant >= range.fromInclusive && instant < range.toExclusive).toBe(true);
    }
    expect('2026-10-28T04:59:59.999Z' >= range.fromInclusive).toBe(false);
    expect('2026-10-30T05:00:00.000Z' < range.toExclusive).toBe(false);
    expect(formatCompanyInstant('2026-10-30T04:59:59Z')).toBe('2026-10-29 23:59:59');
  });
  it.each([
    ['2026-03-08', '2026-03-08T05:00:00.000Z', '2026-03-09T04:00:00.000Z'],
    ['2026-11-01', '2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z'],
  ])('respeta el cambio horario de %s', (day, start, end) => {
    expect(companyDateRange(day, day, 'America/New_York')).toMatchObject({ fromInclusive: start, toExclusive: end });
  });
  it('resuelve medianoche inexistente por cambio horario', () => {
    expect(companyDateRange('2018-11-04', '2018-11-04', 'America/Sao_Paulo')).toMatchObject({
      fromInclusive: '2018-11-04T03:00:00.000Z', toExclusive: '2018-11-05T02:00:00.000Z',
    });
  });
  it('no depende de la zona del dispositivo y valida calendario/año bisiesto', () => {
    expect(formatCompanyInstant('2026-10-30T04:59:59Z', 'Asia/Tokyo')).toBe('2026-10-30 13:59:59');
    expect(companyDateRange('2024-02-29', '2024-02-29', 'UTC').toExclusive).toBe('2024-03-01T00:00:00.000Z');
  });
  it.each([['2026-10-30', '2026-10-29'], ['2026-02-29', '2026-03-01'], ['2026-04-31', '2026-05-01'], ['29/10/2026', '2026-10-30'], ['', '2026-10-30']])('rechaza rango inválido %s/%s', (from, to) => {
    expect(() => companyDateRange(from, to)).toThrow();
  });
  it.each(['2026-10-29T00:00:00', '2026-02-30T00:00:00Z', '2026-10-29'])('rechaza instantes ambiguos o calendarios inválidos %s', instant => {
    expect(() => formatCompanyInstant(instant)).toThrow();
  });
  it('rechaza instantes no válidos al presentar', () => expect(() => formatCompanyInstant('no-es-fecha')).toThrow());
});
