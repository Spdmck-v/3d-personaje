// ============================================================
// inventory.ts — Mochila del jugador
// Capacidad: 1 cabeza, 1 torso, 1 alas, 2 brazos, 2 piernas.
// Los brazos/piernas son GENÉRICOS: al equipar se elige lado Izq/Der.
// Lógica pura (sin DOM ni Three.js en runtime) → fácil de testear.
// ============================================================

import { CATALOGO } from './parts';
import type { NombreSlot, TipoParte } from './types';

export const TIPOS: readonly TipoParte[] = ['cabeza', 'torso', 'brazo', 'pierna', 'alas'];

// Cuántos items de cada tipo caben en la mochila (sin contar lo equipado)
export const CAPACIDAD: Record<TipoParte, number> = {
  cabeza: 1,
  torso: 1,
  alas: 1,
  brazo: 2,
  pierna: 2
};

// Slot de personaje al que va cada tipo genérico.
export const SLOTS_POR_TIPO: Record<TipoParte, NombreSlot[]> = {
  cabeza: ['cabeza'],
  torso: ['torso'],
  alas: ['alas'],
  brazo: ['brazoIzq', 'brazoDer'],
  pierna: ['piernaIzq', 'piernaDer']
};

export type Mochila = Record<TipoParte, string[]>;
type Oyente = (mochila: Mochila) => void;

export interface Inventario {
  mochila: Mochila;
  hayEspacio: (tipo: TipoParte) => boolean;
  agregar: (tipo: TipoParte, diseno: string) => boolean;
  quitar: (tipo: TipoParte, indice: number) => string | null;
  contar: (tipo: TipoParte) => number;
  onCambio: (fn: Oyente) => void;
  /** Reemplaza el contenido (p. ej. al cargar una partida guardada). Ignora piezas inválidas. */
  cargar: (datos: Partial<Mochila>) => void;
}

export function crearInventario(): Inventario {
  const mochila: Mochila = { cabeza: [], torso: [], alas: [], brazo: [], pierna: [] };
  const oyentes: Oyente[] = [];

  const avisar = () => oyentes.forEach((fn) => fn(mochila));
  const onCambio = (fn: Oyente) => {
    oyentes.push(fn);
  };

  const hayEspacio = (tipo: TipoParte) => mochila[tipo].length < CAPACIDAD[tipo];

  // Intenta guardar. Devuelve true si cupo, false si está llena o es inválido.
  function agregar(tipo: TipoParte, diseno: string): boolean {
    if (!CATALOGO[tipo]?.[diseno]) {
      console.warn(`Inventario: diseño inválido ${tipo}/${diseno}`);
      return false;
    }
    // No guardamos piezas de maniquí ni "ninguna": no tiene sentido llevarlas
    if (diseno === 'maniqui' || diseno === 'ninguna') return false;
    if (!hayEspacio(tipo)) return false;
    mochila[tipo].push(diseno);
    avisar();
    return true;
  }

  // Saca un item de la mochila (por índice). Devuelve el diseño o null.
  function quitar(tipo: TipoParte, indice: number): string | null {
    const lista = mochila[tipo];
    if (!lista || indice < 0 || indice >= lista.length) return null;
    const [diseno] = lista.splice(indice, 1);
    avisar();
    return diseno;
  }

  const contar = (tipo: TipoParte) => mochila[tipo].length;

  function cargar(datos: Partial<Mochila>): void {
    for (const tipo of TIPOS) {
      mochila[tipo] = [];
      for (const diseno of datos[tipo] ?? []) {
        if (
          CATALOGO[tipo]?.[diseno] &&
          diseno !== 'maniqui' &&
          diseno !== 'ninguna' &&
          mochila[tipo].length < CAPACIDAD[tipo]
        ) {
          mochila[tipo].push(diseno);
        }
      }
    }
    avisar();
  }

  return { mochila, hayEspacio, agregar, quitar, contar, onCambio, cargar };
}
