import { describe, it, expect } from 'vitest';
import { CATALOGO } from '../src/parts';
import { ESTANTES_INICIALES } from '../src/pickups';

describe('catálogo', () => {
  it('cada pieza de los estantes existe en el catálogo (regresión: antes "normal" faltaba)', () => {
    const faltantes = ESTANTES_INICIALES.filter((p) => !CATALOGO[p.tipo][p.diseno]);
    expect(faltantes).toEqual([]);
  });

  it('hay 33 piezas en los estantes', () => {
    expect(ESTANTES_INICIALES).toHaveLength(33);
  });

  it('cada diseño tiene nombre y constructor', () => {
    for (const diseños of Object.values(CATALOGO)) {
      for (const d of Object.values(diseños)) {
        expect(d.nombre.length).toBeGreaterThan(0);
        expect(typeof d.construir).toBe('function');
      }
    }
  });
});
