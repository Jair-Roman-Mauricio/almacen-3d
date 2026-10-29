import { describe, expect, it } from 'vitest';
import { validateLayout, type LayoutElement, type ElementType } from '../../packages/domain/src/geometry.js';
import { findFirstOverlap } from '../../packages/domain/src/collisions.js';
const dimensions = { width: '100', height: '100', depth: '100' };
const el = (id: string, type: ElementType, parentId: string | null, x = '0', y = '0', z = '0', size = '1'): LayoutElement => ({ id, type, parentId, position: { x, y, z }, dimensions: { width: size, height: size, depth: size } });
const zone = el('zone', 'zone', null, '0', '0', '0', '50');
const check = (elements: LayoutElement[]) => findFirstOverlap(validateLayout(dimensions, elements));
describe('U-GEO/colisiones', () => {
  it('detecta interiores de zonas', () => {
    expect(check([el('a', 'zone', null, '0', '0', '0', '10'), el('b', 'zone', null, '9', '0', '0', '10')])).toEqual({ code: 'OVERLAP', elementIds: ['a', 'b'] });
  });
  it.each([['rack', 'rack'], ['rack', 'aisle'], ['aisle', 'rack']] as const)('rechaza %s contra %s', (a, b) => {
    expect(check([zone, el('a', a, 'zone'), el('b', b, 'zone', '0.5')])?.elementIds).toEqual(['a', 'b']);
  });
  it('rechaza ubicaciones hermanas de nivel o zona directa', () => {
    expect(check([zone, el('a', 'location', 'zone'), el('b', 'location', 'zone', '0.5')])).not.toBeNull();
    const rack = el('rack', 'rack', 'zone', '0', '0', '0', '10');
    const level = el('level', 'level', 'rack', '0', '0', '0', '5');
    expect(check([zone, rack, level, el('a', 'location', 'level'), el('b', 'location', 'level', '0.5')])).not.toBeNull();
  });
  it.each(['x', 'y', 'z'] as const)('permite contacto de bordes en %s y separación', axis => {
    const b = el('b', 'rack', 'zone');
    expect(check([zone, el('a', 'rack', 'zone'), { ...b, position: { ...b.position, [axis]: '1' } }])).toBeNull();
    expect(check([zone, el('a', 'rack', 'zone'), { ...b, position: { ...b.position, [axis]: '1.0000000000000000000000001' } }])).toBeNull();
  });
  it('no inventa colisiones padre-hijo, nivel-nivel, pasillo-pasillo ni ubicación-rack', () => {
    expect(check([zone, el('rack', 'rack', 'zone', '0', '0', '0', '10'), el('n1', 'level', 'rack'), el('n2', 'level', 'rack'), el('u1', 'location', 'n1'), el('u2', 'location', 'n2')])).toBeNull();
    expect(check([zone, el('a', 'aisle', 'zone'), el('b', 'aisle', 'zone')])).toBeNull();
    expect(check([zone, el('r', 'rack', 'zone'), el('u', 'location', 'zone')])).toBeNull();
  });
  it('detecta invasiones diminutas sin epsilon ni redondeo', () => {
    const a = { ...el('a', 'rack', 'zone'), dimensions: { width: '0.00000000000000000000000000002', height: '1', depth: '1' } };
    expect(check([zone, a, el('b', 'rack', 'zone', '0.00000000000000000000000000001')])).not.toBeNull();
    expect(check([zone, a, el('b', 'rack', 'zone', '0.00000000000000000000000000002')])).toBeNull();
  });
  it('valida grupos extensos de vecinos sin confundir bordes con interiores', () => {
    const wide = { ...zone, dimensions: { width: '501', height: '50', depth: '50' } };
    const elements = Array.from({ length: 500 }, (_, i) => el('u' + i, 'location', 'zone', String(i)));
    expect(findFirstOverlap(validateLayout({ ...dimensions, width: '501' }, [wide, ...elements]))).toBeNull();
  });
});
