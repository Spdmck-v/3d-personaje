// ============================================================
// interactions.ts — Tecla E: recoger piezas, espejo vestidor, lámpara
// ============================================================

import * as THREE from 'three';
import { alPresionar } from './input';
import { nombrePieza, type Pickup } from './pickups';
import { SLOTS_POR_TIPO, type Inventario } from './inventory';
import { sonido } from './sonido';
import { estado } from './state';
import { mostrarMensaje, mostrarAviso } from './ui/avisos';
import type { Lampara, Espejo } from './room';
import type { Personaje } from './character';
import type { Mundo } from './world';
import type { ControlJugador } from './player';
import type { InventarioUI } from './ui/inventoryUI';
import type { Vista } from './camera';
import type { NombreSlot } from './types';

interface Deps {
  cuarto: THREE.Group;
  jugador: THREE.Object3D;
  personaje: Personaje;
  inventario: Inventario;
  mundo: Mundo;
  control: ControlJugador;
  inventarioUI: InventarioUI;
  vista: Vista;
  canvas: HTMLElement;
}

export function crearInteracciones(d: Deps) {
  const { cuarto, jugador, personaje, inventario, mundo, control, inventarioUI, vista, canvas } = d;
  const lampara = cuarto.userData.lampara as Lampara;
  const espejo = cuarto.userData.espejo as Espejo;
  let lamparaEncendida = true;

  const cercaDe = (pos: THREE.Vector3, radio: number) =>
    Math.hypot(jugador.position.x - pos.x, jugador.position.z - pos.z) < radio;

  function slotDestino(tipo: Pickup['tipo']): NombreSlot {
    const slots = SLOTS_POR_TIPO[tipo];
    if (slots.length === 1) return slots[0];
    if (personaje.esVacio(slots[0])) return slots[0];
    if (personaje.esVacio(slots[1])) return slots[1];
    return slots[0];
  }

  function recoger(pickup: Pickup): void {
    const { tipo, diseno } = pickup;
    if (inventario.hayEspacio(tipo)) {
      inventario.agregar(tipo, diseno);
      mundo.quitarPickup(pickup);
      mostrarMensaje(`Recogido ${nombrePieza(tipo, diseno)} → mochila (I)`);
      sonido.recoger();
      personaje.interactuar();
      return;
    }
    // Mochila llena: se equipa directo y lo que llevaba cae al piso
    const destino = slotDestino(tipo);
    const anterior = personaje.disenoEn(destino);
    personaje.ponerParte(destino, diseno);
    mundo.quitarPickup(pickup);
    sonido.equipar();
    if (anterior && anterior !== 'maniqui' && anterior !== 'ninguna') {
      mundo.soltarAlPiso(tipo, anterior);
      mostrarMensaje(`Mochila llena: ${anterior} cayó al piso`);
    } else {
      mostrarMensaje(`Equipado ${nombrePieza(tipo, diseno)} en ${destino}`);
    }
    personaje.interactuar();
    inventarioUI.refrescar();
  }

  alPresionar('KeyE', () => {
    if (estado.inventarioAbierto) return;
    const pk = mundo.pickupCercano();
    if (pk) {
      recoger(pk);
      control.mirarHacia(pk.posicion.x, pk.posicion.z);
      return;
    }
    if (cercaDe(espejo.posicion, 2.2)) {
      // Espejo vestidor: gira la cámara al frente y abre el inventario
      vista.yaw = jugador.rotation.y;
      vista.pitch = 0.15;
      inventarioUI.alternar();
      mostrarMensaje('Espejo vestidor: arrastra piezas al muñeco');
      sonido.equipar();
      return;
    }
    if (cercaDe(lampara.posicion, 1.8)) {
      lamparaEncendida = !lamparaEncendida;
      lampara.luz.visible = lamparaEncendida;
      lampara.foco.material.color.set(lamparaEncendida ? 0xfff1c1 : 0x555555);
      personaje.interactuar();
      sonido.quitar();
      control.mirarHacia(lampara.posicion.x, lampara.posicion.z);
    }
  });

  /** Actualiza el texto contextual de pantalla. `pk` es el pickup cercano ya calculado. */
  function actualizarAviso(pk: Pickup | null): void {
    if (estado.inventarioAbierto) return mostrarAviso(null);
    if (pk) return mostrarAviso(`Presiona E para recoger ${nombrePieza(pk.tipo, pk.diseno)}`);
    if (cercaDe(espejo.posicion, 2.2)) return mostrarAviso('Presiona E para usar el espejo vestidor');
    if (cercaDe(lampara.posicion, 1.8)) return mostrarAviso('Presiona E para usar la lámpara');
    if (document.pointerLockElement !== canvas) {
      return mostrarAviso('Click para capturar el mouse · Espacio salta · T baila');
    }
    mostrarAviso(null);
  }

  return { actualizarAviso };
}
