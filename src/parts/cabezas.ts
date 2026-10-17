// ============================================================
// parts/cabezas.js — Diseños de CABEZA
// Origen = base del cuello. La cabeza crece hacia arriba (~0.4) y mira a +z.
// ============================================================

import * as THREE from 'three';
import { MAT, malla } from './materiales';
import type { CatalogoTipo } from '../types';

// ---------- Redonda (la original) ----------
function cabezaNormal() {
  const g = new THREE.Group();
  g.add(malla(new THREE.SphereGeometry(0.2, 8, 6), MAT.piel, 0, 0.18, 0));
  g.add(malla(new THREE.BoxGeometry(0.05, 0.07, 0.04), MAT.ojos, -0.07, 0.22, 0.18));
  g.add(malla(new THREE.BoxGeometry(0.05, 0.07, 0.04), MAT.ojos, 0.07, 0.22, 0.18));
  return g;
}

// ---------- Rubia con cuernitos, ahoge y lentes ----------
function cabezaRubia() {
  const g = new THREE.Group();

  // Cráneo
  g.add(malla(new THREE.SphereGeometry(0.2, 8, 6), MAT.piel, 0, 0.18, 0));

  // PELO. SphereGeometry acepta recortes: (radio, segW, segH, phiInicio, phiLargo, thetaInicio, thetaLargo).
  // phi = π/2 es el FRENTE (+z).
  //  a) casquete: tapa arriba, lados y nuca, dejando libre la cara
  g.add(malla(
    new THREE.SphereGeometry(0.218, 8, 6, Math.PI / 2 + 0.9, Math.PI * 2 - 1.8, 0, 2.0),
    MAT.pelo, 0, 0.18, -0.005));
  //  b) flequillo: solo la parte alta del frente
  g.add(malla(
    new THREE.SphereGeometry(0.222, 8, 6, Math.PI / 2 - 0.9, 1.8, 0, 0.95),
    MAT.pelo, 0, 0.18, 0.005));

  // Mechones largos a los lados y pelo largo en la espalda
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.CapsuleGeometry(0.045, 0.22, 3, 5), MAT.pelo, lado * 0.19, -0.02, 0.02));
  }
  g.add(malla(new THREE.BoxGeometry(0.34, 0.46, 0.1), MAT.pelo, 0, -0.05, -0.2));

  // Ahoge: un pelito que sobresale con un rulito
  const tallo = malla(new THREE.CylinderGeometry(0.004, 0.014, 0.12, 4), MAT.pelo, 0.02, 0.44, 0);
  tallo.rotation.z = -0.2;
  g.add(tallo);
  g.add(malla(new THREE.TorusGeometry(0.035, 0.006, 4, 8), MAT.pelo, 0.05, 0.52, 0));

  // Cuernitos oscuros (inclinados hacia afuera)
  for (const lado of [1, -1]) {
    const cuerno = malla(new THREE.ConeGeometry(0.035, 0.14, 5), MAT.cuerno, lado * 0.14, 0.36, 0.04);
    cuerno.rotation.z = -lado * 0.6;
    g.add(cuerno);
  }

  // Ojos grandes y claros + pupila + lentes (anillos) + rubor
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.CircleGeometry(0.048, 8), MAT.ojoBlanco, lado * 0.075, 0.22, 0.186));
    g.add(malla(new THREE.CircleGeometry(0.02, 6), MAT.ojos, lado * 0.075, 0.22, 0.19));
    g.add(malla(new THREE.TorusGeometry(0.056, 0.008, 4, 10), MAT.gafas, lado * 0.075, 0.22, 0.192));
    g.add(malla(new THREE.CircleGeometry(0.03, 6), MAT.rubor, lado * 0.12, 0.12, 0.165));
  }
  g.add(malla(new THREE.BoxGeometry(0.04, 0.01, 0.01), MAT.gafas, 0, 0.225, 0.194)); // puente de los lentes
  g.add(malla(new THREE.BoxGeometry(0.035, 0.012, 0.01), MAT.ojos, 0, 0.1, 0.186));   // boquita

  return g;
}

// ---------- Cuadrada (un cubo) ----------
function cabezaCubica() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.36, 0.36, 0.34), MAT.piel, 0, 0.17, 0));
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.BoxGeometry(0.06, 0.06, 0.03), MAT.ojos, lado * 0.09, 0.22, 0.175));
  }
  g.add(malla(new THREE.BoxGeometry(0.12, 0.03, 0.03), MAT.ojos, 0, 0.1, 0.175)); // sonrisa
  return g;
}

// ---------- Triangular (pirámide / cono de 4 lados) ----------
function cabezaTriangular() {
  const g = new THREE.Group();
  // ConeGeometry con 4 lados = pirámide. Se gira 45° para que una CARA mire al frente.
  const cono = malla(new THREE.ConeGeometry(0.24, 0.44, 4), MAT.piel, 0, 0.21, 0);
  cono.rotation.y = Math.PI / 4;
  g.add(cono);
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.BoxGeometry(0.05, 0.06, 0.04), MAT.ojos, lado * 0.06, 0.15, 0.11));
  }
  g.add(malla(new THREE.BoxGeometry(0.08, 0.02, 0.03), MAT.ojos, 0, 0.06, 0.145));
  return g;
}

// ---------- Robot (metal, visor de neón y antena) ----------
function cabezaRobot() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.38, 0.32, 0.34), MAT.metal, 0, 0.18, 0));
  // Visor luminoso
  g.add(malla(new THREE.BoxGeometry(0.3, 0.09, 0.02), MAT.neon, 0, 0.21, 0.175));
  // Rejilla de la "boca"
  for (const y of [0.09, 0.12]) {
    g.add(malla(new THREE.BoxGeometry(0.16, 0.018, 0.02), MAT.metalOscuro, 0, y - 0.01, 0.175));
  }
  // Orejas
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.BoxGeometry(0.04, 0.12, 0.12), MAT.metalOscuro, lado * 0.21, 0.18, 0));
  }
  // Antena con bolita luminosa
  g.add(malla(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 5), MAT.metalOscuro, 0, 0.41, 0));
  g.add(malla(new THREE.SphereGeometry(0.03, 6, 5), MAT.neon, 0, 0.5, 0));
  return g;
}

// ---------- Maniquí vacío (cabeza lisa gris, sin cara) ----------
function cabezaManiqui() {
  const g = new THREE.Group();
  g.add(malla(new THREE.SphereGeometry(0.2, 8, 6), MAT.maniqui, 0, 0.18, 0));
  // línea sutil donde irían los ojos (solo decorativa)
  g.add(malla(new THREE.BoxGeometry(0.2, 0.02, 0.02), MAT.maniquiOscuro, 0, 0.2, 0.185));
  return g;
}

export const CABEZAS: CatalogoTipo = {
  maniqui:    { nombre: 'Maniquí vacío',      construir: cabezaManiqui },
  normal:     { nombre: 'Redonda',            construir: cabezaNormal },
  rubia:      { nombre: 'Rubia con cuernitos', construir: cabezaRubia },
  cubica:     { nombre: 'Cuadrada',            construir: cabezaCubica },
  triangular: { nombre: 'Triangular',          construir: cabezaTriangular },
  robot:      { nombre: 'Robot',               construir: cabezaRobot }
};