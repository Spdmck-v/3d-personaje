// ============================================================
// parts/alas.js — Diseños de ALAS
// Origen = centro de la espalda alta. Las alas salen hacia los lados (±x),
// miden ~0.95 hacia cada lado y quedan detrás del cuerpo.
// ============================================================

import * as THREE from 'three';
import { MAT, malla, hueso } from './materiales';
import type { CatalogoTipo } from '../types';

// ---------- Sin alas ----------
function sinAlas() {
  return new THREE.Group(); // un grupo vacío = "no hay nada puesto"
}

// ---------- Alas blancas (abanico de plumas) ----------
const ANGULOS_PLUMAS = [20, 50, 80, 110, 135, 155]; // grados medidos desde "recto hacia arriba"
const LARGOS_PLUMAS = [0.5, 0.62, 0.78, 0.92, 0.95, 0.8];

function crearPlumas(
  ala: THREE.Group,
  lado: number,
  material: THREE.Material,
  escala: number,
  z: number
): void {
  ANGULOS_PLUMAS.forEach((grados, i) => {
    // El "pivote" está en la raíz del ala: girarlo abre el abanico.
    const pivote = new THREE.Group();
    pivote.rotation.z = -lado * THREE.MathUtils.degToRad(grados);
    pivote.position.z = z;

    const largo = LARGOS_PLUMAS[i] * escala;
    // Cono de 4 lados aplastado = pluma. Se sube largo/2 para que su base quede en la raíz.
    const pluma = malla(new THREE.CylinderGeometry(0.006, 0.075, largo, 4), material, 0, largo / 2, 0);
    pluma.scale.z = 0.3;
    pivote.add(pluma);
    ala.add(pivote);
  });
}

function alasAngel() {
  const g = new THREE.Group();
  const alas: { ala: THREE.Group; lado: number }[] = [];
  for (const lado of [1, -1]) {
    const ala = new THREE.Group();
    ala.position.set(lado * 0.1, 0, 0);
    ala.rotation.y = lado * 0.35;                         // se abren un poco hacia atrás
    crearPlumas(ala, lado, MAT.plumaSombra, 1.0, -0.03);  // capa de atrás (sombra lavanda)
    crearPlumas(ala, lado, MAT.pluma, 0.88, 0);           // capa de adelante (blanca)
    g.add(ala);
    alas.push({ ala, lado });
  }
  g.userData.animar = (tiempo: number, caminar: number) => {
    for (const { ala, lado } of alas) {
      ala.rotation.z = lado * (0.04 * Math.sin(tiempo * 1.6) + 0.08 * caminar);
    }
  };
  return g;
}

// ---------- Alas de murciélago (membrana + huesos) ----------
function crearAlaMurcielago(lado: number): THREE.Group {
  const ala = new THREE.Group();

  // Puntos del contorno de la membrana (x, y). Se multiplica x por "lado" para espejarla.
  const contorno = [
    [0.3, 0.5], [0.95, 0.7], [0.76, 0.38], [0.85, 0.15],
    [0.62, 0.1], [0.55, -0.1], [0.38, -0.02], [0.2, -0.3], [0.1, -0.1]
  ];
  const forma = new THREE.Shape();
  forma.moveTo(0, 0);
  for (const [x, y] of contorno) forma.lineTo(x * lado, y);
  forma.closePath();
  ala.add(new THREE.Mesh(new THREE.ShapeGeometry(forma), MAT.membrana));

  // Huesos: del hombro al codo, y del codo a cada punta de dedo
  const codo = [0.3, 0.5];
  const huesos = [
    [[0, 0], codo],
    [codo, [0.95, 0.7]],
    [codo, [0.85, 0.15]],
    [codo, [0.55, -0.1]],
    [codo, [0.2, -0.3]]
  ];
  for (const [a, b] of huesos) {
    ala.add(hueso([a[0] * lado, a[1], 0], [b[0] * lado, b[1], 0], 0.014, MAT.huesoAla, 5));
  }
  return ala;
}

function alasMurcielago() {
  const g = new THREE.Group();
  const alas: { ala: THREE.Group; lado: number }[] = [];
  for (const lado of [1, -1]) {
    const ala = crearAlaMurcielago(lado);
    ala.position.set(lado * 0.08, 0, 0);
    ala.rotation.y = lado * 0.35;
    g.add(ala);
    alas.push({ ala, lado });
  }
  g.userData.animar = (tiempo: number, caminar: number) => {
    for (const { ala, lado } of alas) {
      ala.rotation.z = lado * (0.06 * Math.sin(tiempo * 1.6) + 0.1 * caminar);
    }
  };
  return g;
}

// ---------- Alas mecánicas (paneles de metal con líneas de neón) ----------
const ANGULOS_PANELES = [25, 55, 85, 115];
const LARGOS_PANELES = [0.55, 0.7, 0.85, 0.7];

function alasMecanicas() {
  const g = new THREE.Group();
  const pivotes: { pivote: THREE.Group; lado: number; base: number; fase: number }[] = [];

  for (const lado of [1, -1]) {
    const ala = new THREE.Group();
    ala.position.set(lado * 0.1, 0, 0);
    ala.rotation.y = lado * 0.35;
    ala.add(malla(new THREE.SphereGeometry(0.06, 6, 5), MAT.metalOscuro, 0, 0, 0)); // articulación

    ANGULOS_PANELES.forEach((grados, i) => {
      const largo = LARGOS_PANELES[i];
      const pivote = new THREE.Group();
      pivote.position.z = -i * 0.012; // cada panel un pelín más atrás (evita que se "peleen" al superponerse)
      pivote.add(malla(new THREE.BoxGeometry(0.1, largo, 0.025), MAT.metal, 0, largo / 2, 0));
      pivote.add(malla(new THREE.BoxGeometry(0.02, largo * 0.8, 0.03), MAT.neon, 0, largo / 2, 0)); // línea luminosa
      ala.add(pivote);
      pivotes.push({ pivote, lado, base: THREE.MathUtils.degToRad(grados), fase: i });
    });
    g.add(ala);
  }

  // Los paneles se abren y cierran un poquito, más al caminar
  g.userData.animar = (tiempo: number, caminar: number) => {
    for (const { pivote, lado, base, fase } of pivotes) {
      const apertura = 1 + 0.06 * Math.sin(tiempo * 1.8 + fase) + 0.08 * caminar;
      pivote.rotation.z = -lado * base * apertura;
    }
  };
  return g;
}

export const ALAS: CatalogoTipo = {
  ninguna:    { nombre: 'Sin alas',      construir: sinAlas },
  angel:      { nombre: 'Alas blancas',  construir: alasAngel },
  murcielago: { nombre: 'Murciélago',    construir: alasMurcielago },
  mecanicas:  { nombre: 'Mecánicas',     construir: alasMecanicas }
};