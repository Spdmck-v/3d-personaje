// ============================================================
// parts/materiales.js — Colores, materiales y ayudantes compartidos
// por todas las partes del cuerpo.
// ============================================================

import * as THREE from 'three';
import type { Vec3 } from '../types';

// ---------- PALETA DE COLORES ----------
// Todos los colores en un solo lugar: cambiar uno cambia todo el personaje.
export const PALETA = {
  // piel y ropa básica
  piel: 0xf2c6a0,
  camisa: 0x3b82c4,
  cinturon: 0x1f2a36,
  pantalon: 0x34495e,
  zapatos: 0x2b2b2b,
  ojos: 0x222222,
  // personaje con alas
  pelo: 0xf0cf6a,
  cuerno: 0x2b1b1b,
  gafas: 0x3a1f1f,
  rubor: 0xf29aa5,
  ojoBlanco: 0xf2f2ff,
  verde: 0x4f7a3a,
  verdeOscuro: 0x3d5f2e,
  verdeClaro: 0x7aa04f,
  estrella: 0xb5c86a,
  bufanda: 0x1a1a22,
  pluma: 0xffffff,
  plumaSombra: 0xb3b9da,
  pantalonOscuro: 0x2a1414,
  zapatosOscuros: 0x1c0f0f,
  // estilo robótico (azul grisáceo + acentos)
  metal: 0x8d9aa8,
  metalOscuro: 0x3f4854,
  neon: 0x3de0ff,
  naranja: 0xff8a3d,
  // estilo criatura (morado)
  tentaculo: 0x7a4fc2,
  ventosa: 0xc9a8ff,
  garra: 0xe8e2d0,
  membrana: 0x5a2a6e,
  huesoAla: 0x2b1b2e,
  // maniquí vacío (gris mate de tienda)
  maniqui: 0xb8b8c0,
  maniquiOscuro: 0x8a8a94
};

// ---------- MATERIALES COMPARTIDOS ----------
// Se crea un material por cada color, UNA sola vez, y se reutiliza.
// flatShading = true da el aspecto "low poly" (caras planas visibles).
// IMPORTANTE: como son compartidos, NUNCA se les llama dispose() al quitar una parte.
export type NombreColor = keyof typeof PALETA;
export const MAT = {} as Record<NombreColor, THREE.MeshStandardMaterial>;
for (const nombre of Object.keys(PALETA) as NombreColor[]) {
  MAT[nombre] = new THREE.MeshStandardMaterial({
    color: PALETA[nombre],
    flatShading: true,
    roughness: 0.8 // mate por defecto
  });
}

// ---------- ACABADOS ESPECIALES ----------
// metalness: 0 = no metal, 1 = metal puro | roughness: 0 = espejo, 1 = mate total
MAT.metal.metalness = 0.85;
MAT.metal.roughness = 0.35;
MAT.metalOscuro.metalness = 0.85;
MAT.metalOscuro.roughness = 0.45;

// Neón: brilla solo (emissive), como una luz encendida
MAT.neon.emissive.set(PALETA.neon);
MAT.neon.emissiveIntensity = 1.2;
MAT.neon.roughness = 0.4;

// Brillantes (poca rugosidad = reflejos marcados)
MAT.naranja.roughness = 0.3;
MAT.tentaculo.roughness = 0.25;
MAT.garra.roughness = 0.3;

// La membrana del ala de murciélago es una lámina: se debe ver por los dos lados
MAT.membrana.side = THREE.DoubleSide;

// Los metales necesitan "algo que reflejar" para verse bien. main.js crea un entorno
// virtual y nos lo pasa con esta función; solo lo usan los materiales metálicos.
const MATERIALES_METALICOS = [MAT.metal, MAT.metalOscuro];
export function configurarEntorno(textura: THREE.Texture): void {
  for (const material of MATERIALES_METALICOS) {
    material.envMap = textura;
    material.envMapIntensity = 0.9;
    material.needsUpdate = true;
  }
}

// ---------- AYUDANTES ----------

// Crea un Mesh (forma + material) en una posición.
export function malla(
  geometria: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
): THREE.Mesh {
  const m = new THREE.Mesh(geometria, material);
  m.position.set(x, y, z);
  return m;
}

// Crea un cilindro que une dos puntos (como un hueso o un tubo).
// p1 y p2 son [x, y, z].
export function hueso(
  p1: Vec3,
  p2: Vec3,
  radio: number,
  material: THREE.Material,
  lados = 6
): THREE.Mesh {
  const a = new THREE.Vector3(...p1);
  const b = new THREE.Vector3(...p2);
  const direccion = b.clone().sub(a);
  const largo = direccion.length();

  const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, largo, lados), material);
  m.position.copy(a).addScaledVector(direccion, 0.5);                       // en el punto medio
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direccion.normalize()); // apuntando de a hacia b
  return m;
}