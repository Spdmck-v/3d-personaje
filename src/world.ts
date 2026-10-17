// ============================================================
// world.ts — Pickups del mundo (estantes + piezas soltadas al piso)
// ============================================================

import * as THREE from 'three';
import { ANCHO, FONDO } from './room';
import { crearPickup, ESTANTES_INICIALES, type Pickup } from './pickups';
import { sonido } from './sonido';
import type { TipoParte } from './types';

export function crearMundo(escena: THREE.Scene, jugador: THREE.Object3D) {
  const pickups: Pickup[] = [];

  for (const p of ESTANTES_INICIALES) {
    const pk = crearPickup(p.tipo, p.diseno, p.x, p.z, p.y);
    pickups.push(pk);
    escena.add(pk.grupo);
  }

  function soltarAlPiso(tipo: TipoParte, diseno: string): void {
    const ang = Math.random() * Math.PI * 2;
    const x = THREE.MathUtils.clamp(jugador.position.x + Math.cos(ang) * 0.9, -ANCHO / 2 + 0.6, ANCHO / 2 - 0.6);
    const z = THREE.MathUtils.clamp(jugador.position.z + Math.sin(ang) * 0.9, -FONDO / 2 + 0.6, FONDO / 2 - 0.6);
    const pk = crearPickup(tipo, diseno, x, z, 0);
    pickups.push(pk);
    escena.add(pk.grupo);
    sonido.soltar();
  }

  function quitarPickup(pickup: Pickup): void {
    pickup.disponible = false;
    escena.remove(pickup.grupo);
    const i = pickups.indexOf(pickup);
    if (i >= 0) pickups.splice(i, 1);
  }

  /** Pickup más cercano dentro de su radio de alcance (estantes alcanzan más lejos). */
  function pickupCercano(): Pickup | null {
    let mejor: Pickup | null = null;
    let mejorDist = Infinity;
    for (const p of pickups) {
      if (!p.disponible) continue;
      const d = Math.hypot(jugador.position.x - p.posicion.x, jugador.position.z - p.posicion.z);
      const radio = p.enEstante ? 2.1 : 1.5;
      if (d < radio && d < mejorDist) {
        mejor = p;
        mejorDist = d;
      }
    }
    return mejor;
  }

  return { pickups, soltarAlPiso, quitarPickup, pickupCercano };
}

export type Mundo = ReturnType<typeof crearMundo>;
