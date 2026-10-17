// ============================================================
// player.ts — Movimiento WASD, colisiones, salto y baile
// ============================================================

import * as THREE from 'three';
import { ANCHO, FONDO, COLISIONES } from './room';
import { estaPresionada, alPresionar } from './input';
import { sonido } from './sonido';
import { estado } from './state';
import type { Vista } from './camera';
import type { Personaje } from './character';

const VELOCIDAD = 3.4;
const MARGEN_JUGADOR = 1.0;
const LIMITE_X = ANCHO / 2 - 0.1 - MARGEN_JUGADOR; // 5.9 en 14x10
const LIMITE_Z = FONDO / 2 - 0.1 - MARGEN_JUGADOR; // 3.9
const RADIO = 0.4;
const GRAVEDAD = 12;
const IMPULSO_SALTO = 4.6;
const DURACION_BAILE = 2.2;

export function crearControlJugador(jugador: THREE.Object3D, personaje: Personaje, vista: Vista) {
  const direccion = new THREE.Vector3();
  let anguloInteraccion: number | null = null;
  let vy = 0; // velocidad vertical del salto
  let enSuelo = true;
  let tiempoBaile = -1; // >=0 bailando

  function girarSuave(anguloObjetivo: number, delta: number): void {
    let diferencia = anguloObjetivo - jugador.rotation.y;
    diferencia = Math.atan2(Math.sin(diferencia), Math.cos(diferencia));
    jugador.rotation.y += diferencia * Math.min(1, 12 * delta);
  }

  function resolverColisiones(): void {
    for (const c of COLISIONES) {
      const dx = jugador.position.x - c.x;
      const dz = jugador.position.z - c.z;
      const px = c.hx + RADIO - Math.abs(dx);
      const pz = c.hz + RADIO - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) jugador.position.x = c.x + Math.sign(dx || 1) * (c.hx + RADIO);
        else jugador.position.z = c.z + Math.sign(dz || 1) * (c.hz + RADIO);
      }
    }
  }

  /** Devuelve true si el cuerpo debe animarse (caminando o bailando). */
  function mover(delta: number): boolean {
    // Gravedad del salto siempre, aunque el inventario esté abierto
    if (!enSuelo || jugador.position.y > 0) {
      vy -= GRAVEDAD * delta;
      jugador.position.y += vy * delta;
      if (jugador.position.y <= 0) {
        jugador.position.y = 0;
        vy = 0;
        enSuelo = true;
      }
    }
    // Baile: gira y rebota 2s
    if (tiempoBaile >= 0) {
      tiempoBaile += delta;
      jugador.rotation.y += delta * 6;
      jugador.position.y = Math.abs(Math.sin(tiempoBaile * 8)) * 0.12;
      if (tiempoBaile > DURACION_BAILE) {
        tiempoBaile = -1;
        jugador.position.y = enSuelo ? 0 : jugador.position.y;
      }
      return true;
    }
    if (estado.inventarioAbierto) return false;

    const adelanteX = -Math.sin(vista.yaw);
    const adelanteZ = -Math.cos(vista.yaw);
    direccion.set(0, 0, 0);
    if (estaPresionada('KeyW') || estaPresionada('ArrowUp')) {
      direccion.x += adelanteX;
      direccion.z += adelanteZ;
    }
    if (estaPresionada('KeyS') || estaPresionada('ArrowDown')) {
      direccion.x -= adelanteX;
      direccion.z -= adelanteZ;
    }
    if (estaPresionada('KeyD') || estaPresionada('ArrowRight')) {
      direccion.x += -adelanteZ;
      direccion.z += adelanteX;
    }
    if (estaPresionada('KeyA') || estaPresionada('ArrowLeft')) {
      direccion.x -= -adelanteZ;
      direccion.z -= adelanteX;
    }
    if (direccion.lengthSq() === 0) return false;

    direccion.normalize();
    jugador.position.x = THREE.MathUtils.clamp(
      jugador.position.x + direccion.x * VELOCIDAD * delta,
      -LIMITE_X,
      LIMITE_X
    );
    jugador.position.z = THREE.MathUtils.clamp(
      jugador.position.z + direccion.z * VELOCIDAD * delta,
      -LIMITE_Z,
      LIMITE_Z
    );
    resolverColisiones();
    girarSuave(Math.atan2(direccion.x, direccion.z), delta);
    anguloInteraccion = null;
    return true;
  }

  alPresionar('Space', () => {
    if (estado.inventarioAbierto || !enSuelo || tiempoBaile >= 0) return;
    vy = IMPULSO_SALTO;
    enSuelo = false;
    sonido.salto();
  });
  alPresionar('KeyT', () => {
    if (estado.inventarioAbierto || tiempoBaile >= 0) return;
    tiempoBaile = 0;
    personaje.interactuar();
    sonido.baile();
  });

  /** Se llama cada cuadro. Devuelve true si el cuerpo debe animarse. */
  function actualizar(delta: number): boolean {
    const moviendo = mover(delta);
    if (!moviendo && anguloInteraccion !== null && !estado.inventarioAbierto) {
      girarSuave(anguloInteraccion, delta);
    }
    return moviendo;
  }

  /** El muñeco se gira suavemente hacia un punto (p. ej. el objeto con el que interactúa). */
  function mirarHacia(x: number, z: number): void {
    anguloInteraccion = Math.atan2(x - jugador.position.x, z - jugador.position.z);
  }

  return { actualizar, mirarHacia };
}

export type ControlJugador = ReturnType<typeof crearControlJugador>;
