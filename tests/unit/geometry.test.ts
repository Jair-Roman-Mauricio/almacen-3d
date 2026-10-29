import { describe, expect, it } from 'vitest';
import { validateLayout, type Dimensions, type LayoutElement, type ElementType } from '../../packages/domain/src/geometry.js';
const dims: Dimensions = { width: '100', height: '100', depth: '100' };
function element(id: string, type: ElementType, parentId: string | null, position = { x: '0', y: '0', z: '0' }, dimensions: Dimensions = { width: '1', height: '1', depth: '1' }): LayoutElement {
  return { id, type, parentId, position, dimensions };
}
const zone = () => element('z', 'zone', null, { x: '1', y: '2', z: '3' }, { width: '50', height: '50', depth: '50' });
describe('U-GEO/jerarquia-contencion', () => {
  it('valida jerarquía anidada sin depender del orden y transforma coordenadas relativas', () => {
    const rack = element('r', 'rack', 'z', { x: '2', y: '3', z: '4' }, { width: '10', height: '10', depth: '10' });
    const level = element('n', 'level', 'r', { x: '1', y: '1', z: '1' }, { width: '5', height: '5', depth: '5' });
    const location = element('u', 'location', 'n', { x: '1', y: '1', z: '1' });
    const boxes = validateLayout(dims, [location, level, rack, zone(), element('direct', 'location', 'z')]);
    const min = boxes.get('u')!.min;
    expect([min.x.toFixed(), min.y.toFixed(), min.z.toFixed()]).toEqual(['5', '7', '9']);
    expect(validateLayout(dims, []).size).toBe(0);
  });
  it.each(['0', '-1', 'NaN', 'Infinity', '', '1e3', '0xff'])('rechaza dimensión inválida %s', width => {
    expect(() => validateLayout({ ...dims, width }, [])).toThrow();
    expect(() => validateLayout(dims, [{ ...zone(), dimensions: { ...dims, width } }])).toThrow();
  });
  it('valida los tres ejes y posiciones finitas no negativas', () => {
    for (const axis of ['x', 'y', 'z'] as const) {
      expect(() => validateLayout(dims, [{ ...zone(), position: { ...zone().position, [axis]: '-0.001' } }])).toThrow();
      expect(() => validateLayout(dims, [{ ...zone(), position: { ...zone().position, [axis]: 'Infinity' } }])).toThrow();
    }
  });
  it.each([
    element('bad', 'rack', null), element('bad', 'zone', 'z'), element('bad', 'level', 'z'),
    element('bad', 'aisle', 'missing'), element('bad', 'location', 'r'),
    element('bad', 'rack', 'bad'),
  ])('rechaza padre o jerarquía incorrectos %#', bad => {
    expect(() => validateLayout(dims, [zone(), element('r', 'rack', 'z'), bad])).toThrow();
  });
  it('rechaza IDs duplicados, tipo desconocido y ciclo', () => {
    expect(() => validateLayout(dims, [zone(), zone()])).toThrow();
    expect(() => validateLayout(dims, [{ ...zone(), type: 'other' } as unknown as LayoutElement])).toThrow();
    expect(() => validateLayout(dims, [element('z', 'zone', 'r'), element('r', 'rack', 'z')])).toThrow();
  });
  it('comprueba contención en cualquier contenedor y permite coincidir con el límite', () => {
    expect(validateLayout(dims, [element('z', 'zone', null, { x: '0', y: '0', z: '0' }, dims)]).size).toBe(1);
    for (const axis of ['x', 'y', 'z'] as const) {
      expect(() => validateLayout(dims, [zone(), element('u', 'location', 'z', { x: '0', y: '0', z: '0', [axis]: '49.0000000000000000000000001' })])).toThrow();
    }
  });
  it('conserva muchos dígitos y detecta excesos mínimos sin usar la precisión por defecto', () => {
    const huge = '1000000000000000000000000000000000';
    const tiny = '0.00000000000000000000000000001';
    const large = { ...dims, width: huge + '.00000000000000000000000000001' };
    const parent = element('z', 'zone', null, { x: huge, y: '0', z: '0' }, { width: tiny, height: '2', depth: '2' });
    const child = element('u', 'location', 'z', { x: '0', y: '0', z: '0' }, { width: tiny, height: '1', depth: '1' });
    expect(validateLayout(large, [parent, child]).get('u')!.max.x.toFixed()).toBe(large.width);
    expect(() => validateLayout(large, [parent, { ...child, position: { ...child.position, x: tiny } }])).toThrow();
  });
  it('identifica el elemento y campo inválido', () => {
    try { validateLayout(dims, [element('incorrecto', 'zone', null, { x: '-1', y: '0', z: '0' })]); }
    catch (error) { expect(error).toMatchObject({ code: 'INVALID_DIMENSIONS', details: { elementId: 'incorrecto', field: 'position.x' } }); return; }
    throw new Error('Debió rechazarse el elemento.');
  });
});
