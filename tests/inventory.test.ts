import { describe, it, expect, vi } from 'vitest';
import { crearInventario, CAPACIDAD } from '../src/inventory';

describe('inventario', () => {
  it('guarda piezas válidas y respeta la capacidad', () => {
    const inv = crearInventario();
    expect(inv.agregar('brazo', 'garra')).toBe(true);
    expect(inv.agregar('brazo', 'robotico')).toBe(true);
    expect(inv.agregar('brazo', 'normal')).toBe(false); // capacidad 2
    expect(inv.contar('brazo')).toBe(CAPACIDAD.brazo);
    expect(inv.hayEspacio('brazo')).toBe(false);
  });

  it('rechaza maniquí, "ninguna" y diseños inexistentes', () => {
    const inv = crearInventario();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(inv.agregar('cabeza', 'maniqui')).toBe(false);
    expect(inv.agregar('alas', 'ninguna')).toBe(false);
    expect(inv.agregar('cabeza', 'inventada')).toBe(false);
    expect(inv.contar('cabeza')).toBe(0);
  });

  it('quitar devuelve el diseño y libera espacio', () => {
    const inv = crearInventario();
    inv.agregar('torso', 'armadura');
    expect(inv.quitar('torso', 0)).toBe('armadura');
    expect(inv.hayEspacio('torso')).toBe(true);
    expect(inv.quitar('torso', 0)).toBeNull();
    expect(inv.quitar('torso', -1)).toBeNull();
  });

  it('notifica a los oyentes en cada cambio', () => {
    const inv = crearInventario();
    const fn = vi.fn();
    inv.onCambio(fn);
    inv.agregar('cabeza', 'robot');
    inv.quitar('cabeza', 0);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('cargar descarta datos inválidos y recorta al límite', () => {
    const inv = crearInventario();
    inv.cargar({ brazo: ['garra', 'robotico', 'normal', 'xxx'], cabeza: ['maniqui'] });
    expect(inv.mochila.brazo).toEqual(['garra', 'robotico']);
    expect(inv.mochila.cabeza).toEqual([]);
  });
});
