// ============================================================
// pickups.js — 33 piezas en 5 estantes (par por outfit en brazos/piernas)
// Cabeza/torso/alas: 1 por diseño. Brazos/piernas: 2 por diseño (Izq+Der).
// Sala 14x10: fondo z=-4.6, laterales x=±6.6. Tablas y=1.0/1.7/2.4.
// ============================================================

import * as THREE from 'three';
import { CATALOGO } from './parts';
import type { TipoParte } from './types';

export interface DefinicionPickup {
  tipo: TipoParte;
  diseno: string;
  x: number;
  y: number;
  z: number;
}

export interface Pickup {
  id: number;
  tipo: TipoParte;
  diseno: string;
  grupo: THREE.Group;
  soporte: THREE.Group;
  preview: THREE.Group;
  aro: THREE.Mesh | null;
  posicion: THREE.Vector3;
  enEstante: boolean;
  disponible: boolean;
  baseEscala: number;
}

let siguienteId = 1;

const matDisco = new THREE.MeshStandardMaterial({ color: 0x6b6b7d, roughness: 0.8 });
const matResaltado = new THREE.MeshBasicMaterial({ color: 0xffd166 });

// 1 por diseño en cabeza/torso/alas, 2 por diseño en brazos/piernas (coherente anatómico)
export const ESTANTES_INICIALES: DefinicionPickup[] = [
  // --- CABEZAS (fondo-izq, x=-5, z=-4.6): 3 abajo + 2 medio ---
  { tipo: 'cabeza', diseno: 'normal',     x: -6.0, y: 1.0, z: -4.6 },
  { tipo: 'cabeza', diseno: 'rubia',      x: -5.0, y: 1.0, z: -4.6 },
  { tipo: 'cabeza', diseno: 'cubica',     x: -4.0, y: 1.0, z: -4.6 },
  { tipo: 'cabeza', diseno: 'triangular', x: -5.5, y: 1.7, z: -4.6 },
  { tipo: 'cabeza', diseno: 'robot',      x: -4.5, y: 1.7, z: -4.6 },
  // --- TORSOS (fondo-centro, x=-1.4): 3 + 2 ---
  { tipo: 'torso', diseno: 'normal',   x: -2.4, y: 1.0, z: -4.6 },
  { tipo: 'torso', diseno: 'sudadera', x: -1.4, y: 1.0, z: -4.6 },
  { tipo: 'torso', diseno: 'ancho',    x: -0.4, y: 1.0, z: -4.6 },
  { tipo: 'torso', diseno: 'armadura', x: -1.9, y: 1.7, z: -4.6 },
  { tipo: 'torso', diseno: 'motor',    x: -0.9, y: 1.7, z: -4.6 },
  // --- ALAS (fondo-der, x=1.9): 2 + 1 ---
  { tipo: 'alas', diseno: 'angel',      x: 1.3, y: 1.0, z: -4.6 },
  { tipo: 'alas', diseno: 'murcielago', x: 2.5, y: 1.0, z: -4.6 },
  { tipo: 'alas', diseno: 'mecanicas',  x: 1.9, y: 1.7, z: -4.6 },
  // --- BRAZOS x2 (pared izquierda x=-6.6, a lo largo de z): 4 + 3 + 3 ---
  { tipo: 'brazo', diseno: 'normal',    x: -6.6, y: 1.0, z: -1.4 },
  { tipo: 'brazo', diseno: 'normal',    x: -6.6, y: 1.0, z: -0.3 },
  { tipo: 'brazo', diseno: 'sudadera',  x: -6.6, y: 1.0, z: 0.8 },
  { tipo: 'brazo', diseno: 'sudadera',  x: -6.6, y: 1.0, z: 1.9 },
  { tipo: 'brazo', diseno: 'robotico',  x: -6.6, y: 1.7, z: -0.9 },
  { tipo: 'brazo', diseno: 'robotico',  x: -6.6, y: 1.7, z: 0.2 },
  { tipo: 'brazo', diseno: 'tentaculo', x: -6.6, y: 1.7, z: 1.3 },
  { tipo: 'brazo', diseno: 'tentaculo', x: -6.6, y: 2.4, z: -0.9 },
  { tipo: 'brazo', diseno: 'garra',     x: -6.6, y: 2.4, z: 0.2 },
  { tipo: 'brazo', diseno: 'garra',     x: -6.6, y: 2.4, z: 1.3 },
  // --- PIERNAS x2 (pared derecha x=6.6): 4 + 3 + 3 ---
  { tipo: 'pierna', diseno: 'normal',     x: 6.6, y: 1.0, z: -1.4 },
  { tipo: 'pierna', diseno: 'normal',     x: 6.6, y: 1.0, z: -0.3 },
  { tipo: 'pierna', diseno: 'oscuro',     x: 6.6, y: 1.0, z: 0.8 },
  { tipo: 'pierna', diseno: 'oscuro',     x: 6.6, y: 1.0, z: 1.9 },
  { tipo: 'pierna', diseno: 'resorte',    x: 6.6, y: 1.7, z: -0.9 },
  { tipo: 'pierna', diseno: 'resorte',    x: 6.6, y: 1.7, z: 0.2 },
  { tipo: 'pierna', diseno: 'ruedas',     x: 6.6, y: 1.7, z: 1.3 },
  { tipo: 'pierna', diseno: 'ruedas',     x: 6.6, y: 2.4, z: -0.9 },
  { tipo: 'pierna', diseno: 'patasRobot', x: 6.6, y: 2.4, z: 0.2 },
  { tipo: 'pierna', diseno: 'patasRobot', x: 6.6, y: 2.4, z: 1.3 },
];


function construirPreview(tipo: TipoParte, diseno: string): THREE.Group {
  const entrada = CATALOGO[tipo]?.[diseno];
  if (!entrada) return new THREE.Group();
  const g = entrada.construir();
  if (tipo === 'alas') g.scale.setScalar(0.42);
  else if (tipo === 'torso') g.scale.setScalar(0.6);
  else if (tipo === 'cabeza') g.scale.setScalar(0.75);
  else g.scale.setScalar(0.7);
  return g;
}

// Etiqueta pequeña con el nombre del diseño (mejora #10)
function etiquetaPieza(texto: string): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 56;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, 256, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto.slice(0, 18), 128, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.15),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  return m;
}

function baseDiscoPiso() {
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16), matDisco);
  disco.position.y = 0.025;
  disco.receiveShadow = true;
  return disco;
}

export function crearPickup(
  tipo: TipoParte,
  diseno: string,
  x: number,
  z: number,
  yBase = 0
): Pickup {
  const grupo = new THREE.Group();
  const enEstante = yBase > 0;
  grupo.position.set(x, enEstante ? yBase : 0, z);

  let aro: THREE.Mesh | null = null;
  if (!enEstante) {
    grupo.add(baseDiscoPiso());
  } else {
    // aro dorado bajo la pieza: sirve para el resaltado (#4)
    aro = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 20), matResaltado.clone());
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 0.02;
    aro.visible = false;
    grupo.add(aro);
  }

  const preview = construirPreview(tipo, diseno);
  const soporte = new THREE.Group();
  soporte.position.y = enEstante ? 0.38 : 0.55;
  if ((tipo === 'brazo' || tipo === 'pierna') && !enEstante) soporte.position.y += 0.2;
  if (tipo === 'cabeza' && !enEstante) soporte.position.y += 0.05;
  soporte.add(preview);
  grupo.add(soporte);

  if (enEstante) {
    const entrada = CATALOGO[tipo]?.[diseno];
    const et = etiquetaPieza(entrada ? entrada.nombre : diseno);
    et.position.y = 0.72;
    grupo.add(et);
  }

  const pickup: Pickup = {
    id: siguienteId++,
    tipo,
    diseno,
    grupo,
    soporte,
    preview,
    aro,
    posicion: new THREE.Vector3(x, 0, z),
    enEstante,
    disponible: true,
    baseEscala: preview.scale.x
  };
  grupo.userData.pickupId = pickup.id;
  return pickup;
}

// pickupResaltadoId: el más cercano brilla y crece (mejora #4)
export function animarPickups(
  pickups: Pickup[],
  tiempo: number,
  pickupResaltadoId: number | null = null
): void {
  for (const p of pickups) {
    if (!p.disponible) continue;
    p.soporte.position.y += Math.sin(tiempo * 2 + p.id) * 0.0015;
    p.preview.rotation.y = tiempo * 1.2 + p.id;
    const esResaltado = p.id === pickupResaltadoId;
    const s = p.baseEscala * (esResaltado ? 1.3 : 1.0);
    p.preview.scale.setScalar(s);
    if (p.aro) p.aro.visible = esResaltado;
  }
}

export function nombrePieza(tipo: TipoParte, diseno: string): string {
  const entrada = CATALOGO[tipo]?.[diseno];
  return `${tipo}: ${entrada ? entrada.nombre : diseno}`;
}
