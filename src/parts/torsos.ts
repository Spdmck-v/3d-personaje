// ============================================================
// parts/torsos.js — Diseños de TORSO
// Origen = la cintura. El torso crece hacia arriba (0.6) y mira a +z.
// Los hombros quedan a 0.52 de altura sobre la cintura (ahí se anclan los brazos).
// ============================================================

import * as THREE from 'three';
import { MAT, malla } from './materiales';
import type { CatalogoTipo } from '../types';

// ---------- Normal ----------
function torsoNormal() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.5, 0.6, 0.28), MAT.camisa, 0, 0.3, 0));
  g.add(malla(new THREE.BoxGeometry(0.52, 0.08, 0.3), MAT.cinturon, 0, 0.04, 0));
  return g;
}

// ---------- Sudadera verde con estrellas ----------
function formaEstrella(radioExt: number, radioInt: number) {
  const forma = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const radio = i % 2 === 0 ? radioExt : radioInt;     // alterna punta / hueco
    const angulo = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(angulo) * radio;
    const y = Math.sin(angulo) * radio;
    if (i === 0) forma.moveTo(x, y); else forma.lineTo(x, y);
  }
  forma.closePath();
  return forma;
}

function estrella(tamano: number, x: number, y: number) {
  const geo = new THREE.ExtrudeGeometry(formaEstrella(tamano, tamano * 0.45), { depth: 0.01, bevelEnabled: false });
  return malla(geo, MAT.estrella, x, y, 0.176);
}

function torsoSudadera() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.56, 0.66, 0.34), MAT.verde, 0, 0.27, 0));
  for (const y of [0.12, 0.3, 0.48]) {
    g.add(malla(new THREE.BoxGeometry(0.58, 0.06, 0.35), MAT.verdeOscuro, 0, y, 0));
  }
  g.add(malla(new THREE.BoxGeometry(0.6, 0.08, 0.38), MAT.verdeOscuro, 0, -0.02, 0)); // dobladillo
  g.add(malla(new THREE.BoxGeometry(0.3, 0.16, 0.03), MAT.verdeClaro, 0, 0.17, 0.185)); // bolsillo canguro
  g.add(estrella(0.07, -0.13, 0.46));
  g.add(estrella(0.06, 0.1, 0.4));
  g.add(estrella(0.045, -0.04, 0.3));

  // Pañuelo negro + moñito
  const cuello = malla(new THREE.TorusGeometry(0.14, 0.05, 5, 8), MAT.bufanda, 0, 0.63, 0);
  cuello.rotation.x = Math.PI / 2; // el anillo nace "parado"; lo acostamos
  g.add(cuello);
  const lazo = malla(new THREE.BoxGeometry(0.13, 0.13, 0.03), MAT.bufanda, 0, 0.56, 0.17);
  lazo.rotation.z = Math.PI / 4; // girado 45° = rombo
  g.add(lazo);
  return g;
}

// ---------- Ancho (hombros grandes, franja blanca) ----------
function torsoAncho() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.64, 0.6, 0.3), MAT.camisa, 0, 0.3, 0));
  g.add(malla(new THREE.BoxGeometry(0.66, 0.07, 0.32), MAT.pluma, 0, 0.46, 0));   // franja blanca
  g.add(malla(new THREE.BoxGeometry(0.66, 0.08, 0.32), MAT.cinturon, 0, 0.04, 0)); // cinturón
  g.add(malla(new THREE.BoxGeometry(0.09, 0.06, 0.02), MAT.naranja, 0, 0.04, 0.165)); // hebilla
  return g;
}

// ---------- Armadura (placas de metal y gema de neón) ----------
function torsoArmadura() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.54, 0.6, 0.3), MAT.metalOscuro, 0, 0.3, 0));
  g.add(malla(new THREE.BoxGeometry(0.5, 0.34, 0.06), MAT.metal, 0, 0.38, 0.16));  // peto
  g.add(malla(new THREE.BoxGeometry(0.4, 0.12, 0.06), MAT.metal, 0, 0.1, 0.16));   // placa del abdomen
  g.add(malla(new THREE.BoxGeometry(0.56, 0.06, 0.32), MAT.naranja, 0, 0.02, 0));  // cinturón dorado
  g.add(malla(new THREE.OctahedronGeometry(0.05, 0), MAT.neon, 0, 0.4, 0.2));      // gema
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.SphereGeometry(0.11, 6, 5), MAT.metal, lado * 0.3, 0.55, 0)); // hombreras
  }
  return g;
}

// ---------- Motor (núcleo giratorio, tuberías) ----------
function torsoMotor() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.54, 0.6, 0.3), MAT.metalOscuro, 0, 0.3, 0));
  g.add(malla(new THREE.BoxGeometry(0.56, 0.08, 0.32), MAT.metal, 0, 0.04, 0));    // cinturón
  g.add(malla(new THREE.BoxGeometry(0.3, 0.12, 0.08), MAT.metal, 0, 0.45, -0.18)); // escape trasero
  for (const lado of [1, -1]) {
    g.add(malla(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), MAT.naranja, lado * 0.2, 0.3, -0.17)); // tuberías
  }

  // Placa circular que sostiene el núcleo
  const placa = malla(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 8), MAT.metal, 0, 0.36, 0.16);
  placa.rotation.x = Math.PI / 2; // el cilindro nace parado; lo giramos para que mire al frente
  g.add(placa);

  // Núcleo: un engranaje de neón que gira y "late"
  const nucleo = new THREE.Group();
  nucleo.position.set(0, 0.36, 0.185);
  nucleo.rotation.x = Math.PI / 2;
  const gira = new THREE.Group(); // este sub-grupo es el que gira sobre su propio eje
  gira.add(malla(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), MAT.neon, 0, 0, 0));
  gira.add(malla(new THREE.BoxGeometry(0.2, 0.03, 0.03), MAT.neon, 0, 0, 0));
  gira.add(malla(new THREE.BoxGeometry(0.03, 0.03, 0.2), MAT.neon, 0, 0, 0));
  nucleo.add(gira);
  g.add(nucleo);

  g.userData.animar = (tiempo: number) => {
    gira.rotation.y = tiempo * 2;
    nucleo.scale.setScalar(1 + 0.06 * Math.sin(tiempo * 4)); // late
  };
  return g;
}

// ---------- Maniquí vacío ----------
function torsoManiqui() {
  const g = new THREE.Group();
  g.add(malla(new THREE.BoxGeometry(0.5, 0.6, 0.28), MAT.maniqui, 0, 0.3, 0));
  g.add(malla(new THREE.BoxGeometry(0.52, 0.08, 0.3), MAT.maniquiOscuro, 0, 0.04, 0));
  return g;
}

export const TORSOS: CatalogoTipo = {
  maniqui:  { nombre: 'Maniquí vacío',   construir: torsoManiqui },
  normal:   { nombre: 'Camisa azul',    construir: torsoNormal },
  sudadera: { nombre: 'Sudadera verde', construir: torsoSudadera },
  ancho:    { nombre: 'Ancho',          construir: torsoAncho },
  armadura: { nombre: 'Armadura',       construir: torsoArmadura },
  motor:    { nombre: 'Con motor',      construir: torsoMotor }
};