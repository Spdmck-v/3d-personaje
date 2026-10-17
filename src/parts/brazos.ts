// ============================================================
// parts/brazos.js — Diseños de BRAZO
// Origen = el hombro. El brazo cuelga hacia abajo (~0.55 de largo).
// La misma función sirve para el brazo izquierdo y el derecho.
// ============================================================

import * as THREE from 'three';
import { MAT, malla } from './materiales';
import type { CatalogoTipo } from '../types';

// ---------- Normal ----------
function brazoNormal() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CapsuleGeometry(0.07, 0.41, 3, 6), MAT.camisa, 0, -0.225, 0));
  g.add(malla(new THREE.SphereGeometry(0.075, 6, 5), MAT.piel, 0, -0.5, 0));
  return g;
}

// ---------- Manga de sudadera ----------
function brazoSudadera() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CapsuleGeometry(0.09, 0.36, 3, 6), MAT.verde, 0, -0.21, 0));
  for (const y of [-0.12, -0.28]) {
    g.add(malla(new THREE.CylinderGeometry(0.096, 0.096, 0.045, 8), MAT.verdeOscuro, 0, y, 0));
  }
  g.add(malla(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 8), MAT.verdeOscuro, 0, -0.43, 0)); // puño
  g.add(malla(new THREE.SphereGeometry(0.07, 6, 5), MAT.piel, 0, -0.52, 0));                      // mano
  return g;
}

// ---------- Robótico (articulaciones, anillo de neón, pinza) ----------
function brazoRobotico() {
  const g = new THREE.Group();
  g.add(malla(new THREE.SphereGeometry(0.085, 6, 5), MAT.metalOscuro, 0, 0, 0));                 // hombro
  g.add(malla(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6), MAT.metal, 0, -0.14, 0));         // brazo
  g.add(malla(new THREE.CylinderGeometry(0.066, 0.066, 0.02, 6), MAT.neon, 0, -0.2, 0));         // anillo luminoso
  g.add(malla(new THREE.SphereGeometry(0.07, 6, 5), MAT.metalOscuro, 0, -0.28, 0));              // codo
  g.add(malla(new THREE.CylinderGeometry(0.055, 0.05, 0.18, 6), MAT.metal, 0, -0.38, 0));        // antebrazo
  g.add(malla(new THREE.BoxGeometry(0.1, 0.09, 0.1), MAT.metalOscuro, 0, -0.5, 0));              // mano
  for (const x of [-0.03, 0, 0.03]) {
    g.add(malla(new THREE.BoxGeometry(0.02, 0.07, 0.02), MAT.metal, x, -0.57, 0.02));            // dedos
  }
  return g;
}

// ---------- Tentáculo (segmentos que ondulan solos) ----------
function brazoTentaculo() {
  const g = new THREE.Group();
  const SEGMENTOS = 7;
  const LARGO = 0.085;
  const segmentos: THREE.Group[] = [];

  // Cada segmento es hijo del anterior: al girar uno, giran todos los de abajo.
  // Eso crea la onda de un tentáculo.
  let padre = g;
  for (let i = 0; i < SEGMENTOS; i++) {
    const radioArriba = 0.075 - i * 0.008;
    const radioAbajo = 0.075 - (i + 1) * 0.008;
    const segmento = new THREE.Group();
    segmento.position.y = i === 0 ? 0 : -LARGO;
    segmento.add(malla(new THREE.CylinderGeometry(radioArriba, radioAbajo, LARGO, 6), MAT.tentaculo, 0, -LARGO / 2, 0));
    // Ventosas por el frente
    if (i >= 1 && i <= 5) {
      segmento.add(malla(new THREE.SphereGeometry(0.016, 5, 4), MAT.ventosa, 0, -LARGO / 2, radioArriba));
    }
    padre.add(segmento);
    segmentos.push(segmento);
    padre = segmento;
  }
  padre.add(malla(new THREE.SphereGeometry(0.02, 5, 4), MAT.tentaculo, 0, -LARGO, 0)); // punta

  g.userData.animar = (tiempo: number, caminar: number) => {
    const fuerza = 1 + caminar * 0.6; // ondula más al caminar
    segmentos.forEach((s, i) => {
      s.rotation.z = Math.sin(tiempo * 2.2 - i * 0.7) * 0.16 * fuerza;
      s.rotation.x = Math.cos(tiempo * 1.7 - i * 0.7) * 0.12 * fuerza;
    });
  };
  return g;
}

// ---------- Garra (mano de hueso con tres garras y pulgar) ----------
function brazoGarra() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CapsuleGeometry(0.07, 0.27, 3, 6), MAT.camisa, 0, -0.175, 0));
  g.add(malla(new THREE.SphereGeometry(0.08, 6, 5), MAT.garra, 0, -0.42, 0)); // palma

  // Cada garra es un cono apuntando hacia abajo, dentro de un grupo que la inclina hacia afuera
  const garras = [
    { x: -0.05, inclinacion: 0.3 },
    { x: 0, inclinacion: 0 },
    { x: 0.05, inclinacion: -0.3 }
  ];
  for (const { x, inclinacion } of garras) {
    const grupo = new THREE.Group();
    grupo.position.set(x, -0.46, 0.015);
    grupo.rotation.z = inclinacion;
    const cono = malla(new THREE.ConeGeometry(0.025, 0.13, 5), MAT.garra, 0, -0.065, 0);
    cono.rotation.x = Math.PI; // los conos nacen apuntando arriba; se voltean
    grupo.add(cono);
    g.add(grupo);
  }
  // Pulgar
  const pulgar = new THREE.Group();
  pulgar.position.set(0.075, -0.4, 0.03);
  pulgar.rotation.z = -0.9;
  const conoPulgar = malla(new THREE.ConeGeometry(0.02, 0.09, 5), MAT.garra, 0, -0.045, 0);
  conoPulgar.rotation.x = Math.PI;
  pulgar.add(conoPulgar);
  g.add(pulgar);
  return g;
}

// ---------- Maniquí vacío ----------
function brazoManiqui() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CapsuleGeometry(0.07, 0.41, 3, 6), MAT.maniqui, 0, -0.225, 0));
  g.add(malla(new THREE.SphereGeometry(0.075, 6, 5), MAT.maniqui, 0, -0.5, 0));
  return g;
}

export const BRAZOS: CatalogoTipo = {
  maniqui:   { nombre: 'Maniquí vacío',      construir: brazoManiqui },
  normal:    { nombre: 'Normal',             construir: brazoNormal },
  sudadera:  { nombre: 'Manga de sudadera', construir: brazoSudadera },
  robotico:  { nombre: 'Robótico',          construir: brazoRobotico },
  tentaculo: { nombre: 'Tentáculo',         construir: brazoTentaculo },
  garra:     { nombre: 'Garra',             construir: brazoGarra }
};