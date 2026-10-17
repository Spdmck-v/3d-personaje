// ============================================================
// character.js — El esqueleto del personaje
//
// El personaje es un conjunto de SLOTS (puntos de anclaje):
// cabeza, torso, alas, brazo izquierdo/derecho, pierna izquierda/derecha.
// Cada slot es un Group vacío puesto en el lugar correcto del cuerpo,
// y adentro lleva la parte que tenga puesta.
//
// Medidas: el origen (0,0,0) del personaje está en el PISO, entre los pies.
// ============================================================

import * as THREE from 'three';
import { CATALOGO, DISENO_POR_DEFECTO } from './parts';
import type { NombreSlot, TipoParte, Vec3, AnimarParte } from './types';

// Alturas importantes del cuerpo
const ALTURA_CADERA = 0.7;   // donde empiezan las piernas y la cintura
const ALTURA_CUELLO = 1.3;   // donde empieza la cabeza (cintura + 0.6 de torso)
const ALTURA_HOMBRO = 1.22;  // un poquito más abajo que el borde del torso
const ALTO_TORSO = 0.6;

// Definición de los slots.
//   tipo     → qué categoría del catálogo puede ir ahí
//   posicion → [x, y, z] del punto de anclaje
// El personaje mira hacia +z, así que su lado IZQUIERDO queda en +x.
const SLOTS: Record<NombreSlot, { tipo: TipoParte; posicion: Vec3 }> = {
  cabeza:     { tipo: 'cabeza', posicion: [0, ALTURA_CUELLO, 0] },
  torso:      { tipo: 'torso',  posicion: [0, ALTURA_CADERA, 0] },
  alas:       { tipo: 'alas',   posicion: [0, 1.12, -0.26] },   // detrás de la espalda
  brazoIzq:   { tipo: 'brazo',  posicion: [0.33, ALTURA_HOMBRO, 0] },
  brazoDer:   { tipo: 'brazo',  posicion: [-0.33, ALTURA_HOMBRO, 0] },
  piernaIzq:  { tipo: 'pierna', posicion: [0.15, ALTURA_CADERA, 0] },
  piernaDer:  { tipo: 'pierna', posicion: [-0.15, ALTURA_CADERA, 0] }
};

// Ajustes de las animaciones
const VELOCIDAD_PASOS = 10;        // qué tan rápido se mueven piernas y brazos al caminar
const AMPLITUD_PIERNAS = 0.7;      // cuánto se balancean las piernas (radianes)
const AMPLITUD_BRAZOS = 0.55;      // cuánto se balancean los brazos
const DURACION_INTERACCION = 0.9;  // segundos que dura el gesto de la mano
const ANGULO_MANO_LEVANTADA = -1.5; // negativo = el brazo se levanta hacia el frente

// Libera la memoria de las GEOMETRÍAS de una parte que ya no se usa.
// Los materiales NO se liberan porque son compartidos entre todas las partes.
function liberarParte(parte: THREE.Object3D): void {
  parte.traverse((hijo) => {
    if (hijo instanceof THREE.Mesh) hijo.geometry.dispose();
  });
}

export function crearPersonaje() {
  // Grupo principal: moverlo o girarlo mueve a todo el personaje.
  const grupo = new THREE.Group();

  // "cuerpo" va dentro del grupo y contiene los slots. Existe para poder hacer
  // rebotar el cuerpo al caminar sin tocar la posición que controla main.js.
  const cuerpo = new THREE.Group();
  grupo.add(cuerpo);

  const slots = {} as Record<NombreSlot, THREE.Group>; // nombre → Group del punto de anclaje
  const disenoActual = {} as Record<NombreSlot, string>; // nombre → diseño que lleva puesto
  const nombresSlots = Object.keys(SLOTS) as NombreSlot[];

  for (const nombre of nombresSlots) {
    const anclaje = new THREE.Group();
    anclaje.position.set(...SLOTS[nombre].posicion); // "..." reparte [x,y,z] en 3 valores
    cuerpo.add(anclaje);
    slots[nombre] = anclaje;
  }

  // ---------- Poner (o cambiar) la parte de un slot ----------
  // Ejemplo: personaje.ponerParte('alas', 'ninguna')
  function ponerParte(nombreSlot: NombreSlot, nombreDiseno: string): void {
    const slot = slots[nombreSlot];
    if (!slot) {
      console.warn(`No existe el slot "${nombreSlot}"`);
      return;
    }
    const diseno = CATALOGO[SLOTS[nombreSlot].tipo][nombreDiseno];
    if (!diseno) {
      console.warn(`No existe el diseño "${nombreDiseno}" para ${nombreSlot}`);
      return;
    }

    // 1) Quitamos la parte actual y liberamos su memoria
    for (const parteVieja of [...slot.children]) {
      slot.remove(parteVieja);
      liberarParte(parteVieja);
    }

    // 2) Construimos la nueva y la colocamos en el anclaje
    const parteNueva = diseno.construir();
    parteNueva.traverse((hijo) => {
      if (hijo instanceof THREE.Mesh) hijo.castShadow = true;
    });
    slot.add(parteNueva);
    disenoActual[nombreSlot] = nombreDiseno;
  }

  // ---------- Estado de las animaciones ----------
  let intensidad = 0;          // 0 = quieto, 1 = caminando (cambia suavemente)
  let fase = 0;                // avanza mientras camina; decide en qué punto del paso está
  let tiempoInteraccion = -1;  // -1 = no hay gesto; si no, segundos desde que empezó

  // Llamar cuando el jugador interactúa con algo: levanta la mano
  function interactuar() {
    tiempoInteraccion = 0;
  }

  // ---------- Animación general (se llama cada cuadro desde main.js) ----------
  //   tiempo    → segundos totales desde que arrancó
  //   delta     → segundos desde el cuadro anterior
  //   caminando → true si el jugador está apretando teclas de movimiento
  function animar(tiempo: number, delta: number, caminando: boolean): void {
    // --- 1. Intensidad suavizada: no pasa de golpe de quieto a caminar ---
    const objetivo = caminando ? 1 : 0;
    intensidad += (objetivo - intensidad) * Math.min(1, 8 * delta);
    fase += delta * VELOCIDAD_PASOS * intensidad;

    // --- 2. Respiración (igual que antes) ---
    const factor = 1 + 0.02 * Math.sin(tiempo * 2);
    const extra = ALTO_TORSO * (factor - 1);
    slots.torso.scale.y = factor;
    slots.cabeza.position.y = ALTURA_CUELLO + extra;
    slots.brazoIzq.position.y = ALTURA_HOMBRO + extra;
    slots.brazoDer.position.y = ALTURA_HOMBRO + extra;

    // --- 3. Caminar: piernas y brazos se balancean en direcciones opuestas ---
    // Al girar sobre el eje x, un ángulo NEGATIVO lleva el miembro hacia adelante.
    const paso = Math.sin(fase) * intensidad;
    slots.piernaIzq.rotation.x = paso * AMPLITUD_PIERNAS;
    slots.piernaDer.rotation.x = -paso * AMPLITUD_PIERNAS;
    slots.brazoIzq.rotation.x = -paso * AMPLITUD_BRAZOS; // el brazo izq. va con la pierna der.
    slots.brazoDer.rotation.x = paso * AMPLITUD_BRAZOS;

    // Pequeño rebote: el cuerpo sube un poquito en cada paso
    cuerpo.position.y = Math.abs(Math.sin(fase)) * 0.04 * intensidad;

    // --- 4. Gesto de interacción: la mano derecha se levanta y vuelve a bajar ---
    if (tiempoInteraccion >= 0) {
      tiempoInteraccion += delta;
      const progreso = tiempoInteraccion / DURACION_INTERACCION; // de 0 a 1
      if (progreso >= 1) {
        tiempoInteraccion = -1;
      } else {
        // Sube rápido, se queda un momento arriba y baja (el seno hace la curva)
        const peso = Math.min(1, Math.sin(Math.PI * progreso) * 1.6);
        const actual = slots.brazoDer.rotation.x;
        // Mezclamos: peso 0 = movimiento normal, peso 1 = mano levantada
        slots.brazoDer.rotation.x = actual * (1 - peso) + ANGULO_MANO_LEVANTADA * peso;
      }
    }

    // --- 5. Animaciones propias de cada parte (por ejemplo, el aleteo de las alas) ---
    for (const nombre of nombresSlots) {
      const parte = slots[nombre].children[0];
      const animarParte = parte?.userData.animar as AnimarParte | undefined;
      animarParte?.(tiempo, intensidad);
    }
  }

  // Ponemos el diseño por defecto en cada slot
  for (const nombre of nombresSlots) {
    ponerParte(nombre, DISENO_POR_DEFECTO[SLOTS[nombre].tipo]);
  }

  // ---------- Ayudas para inventario ----------
  // ¿El slot lleva el maniquí vacío / sin alas? (se considera "vacío")
  function esVacio(nombreSlot: NombreSlot): boolean {
    const d = disenoActual[nombreSlot];
    return d === 'maniqui' || d === 'ninguna' || d == null;
  }

  // Quita la parte y vuelve al maniquí vacío (o sin alas). Devuelve el diseño que tenía.
  function quitarParte(nombreSlot: NombreSlot): string | null {
    const anterior = disenoActual[nombreSlot];
    if (esVacio(nombreSlot)) return null;
    const tipo = SLOTS[nombreSlot].tipo;
    const vacio = tipo === 'alas' ? 'ninguna' : 'maniqui';
    ponerParte(nombreSlot, vacio);
    return anterior;
  }

  function disenoEn(nombreSlot: NombreSlot): string {
    return disenoActual[nombreSlot];
  }

  return { grupo, slots, disenoActual, ponerParte, quitarParte, esVacio, disenoEn, animar, interactuar };
}

export type Personaje = ReturnType<typeof crearPersonaje>;