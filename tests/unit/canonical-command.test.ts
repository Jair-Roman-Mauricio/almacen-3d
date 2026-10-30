import { describe, it, expect } from 'vitest';
import { canonicalCommand } from '../../packages/domain/src/canonical-command.js';
const base = { tenantId: '00000000-0000-0000-0000-000000000001', type: 'receipt', data: { warehouseId: '00000000-0000-0000-0000-000000000002', lines: [{ productId: '00000000-0000-0000-0000-000000000003', quantity: '1.000' }] } };
describe('I-CMD/huella-canonica', () => {
  it('ignora orden de propiedades, líneas y metadatos de transporte con cantidades canónicas', () => {
    const a = { ...base, data: { ...base.data, lines: [...base.data.lines, { productId: '00000000-0000-0000-0000-000000000004', quantity: '2' }] } };
    const b = { type: base.type, tenantId: base.tenantId, data: { lines: [{ quantity: '2.0', productId: '00000000-0000-0000-0000-000000000004' }, { quantity: '01', productId: base.data.lines[0]!.productId }], warehouseId: base.data.warehouseId }, csrfToken: 'transporte' };
    expect(canonicalCommand(a)).toBe(canonicalCommand(b));
  });
  it('distingue empresa, tipo, ubicación, cantidad y contenido validado', () => {
    for (const changed of [{ ...base, tenantId: '00000000-0000-0000-0000-000000000009' }, { ...base, type: 'move' }, { ...base, data: { ...base.data, targetLocationId: base.tenantId } }, { ...base, data: { ...base.data, lines: [{ ...base.data.lines[0], quantity: '2' }] } }, { ...base, data: { kind: 'catalogue', contentHash: 'otro' } }])
      expect(canonicalCommand(changed)).not.toBe(canonicalCommand(base));
  });
  it('conserva texto significativo y rechaza números inexactos, no finitos y secretos', () => {
    expect(() => canonicalCommand({ ...base, data: { quantity: 0.1 } })).toThrow();
    expect(() => canonicalCommand({ ...base, data: { quantity: 'Infinity' } })).toThrow();
    expect(() => canonicalCommand({ ...base, data: { password: 'secreto' } })).toThrow();
    expect(canonicalCommand({ ...base, data: { name: 'A B' } })).not.toBe(canonicalCommand({ ...base, data: { name: 'AB' } }));
  });
});
