// ============================================================
// parts/piernas.js — Diseños de PIERNA
// Origen = la cadera. La pierna cuelga hacia abajo (0.7) y el pie toca y = -0.7.
// La misma función sirve para la pierna izquierda y la derecha.
// ============================================================

import * as THREE from 'three';
import { MAT, malla, hueso } from './materiales';
import type { CatalogoTipo } from '../types';

// ---------- Normal ----------
function piernaNormal() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(0.09, 0.08, 0.62, 6), MAT.pantalon, 0, -0.29, 0));
  g.add(malla(new THREE.BoxGeometry(0.16, 0.1, 0.26), MAT.zapatos, 0, -0.65, 0.04));
  return g;
}

// ---------- Pantalón oscuro ----------
function piernaOscura() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(0.1, 0.085, 0.62, 6), MAT.pantalonOscuro, 0, -0.29, 0));
  g.add(malla(new THREE.BoxGeometry(0.17, 0.1, 0.27), MAT.zapatosOscuros, 0, -0.65, 0.04));
  return g;
}

// ---------- Resorte ----------
// Una curva en forma de hélice; TubeGeometry la convierte en un tubo (el alambre del resorte).
class Helice extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radio: number,
    private altura: number,
    private vueltas: number
  ) {
    super();
  }
  // t va de 0 a 1 a lo largo de la curva
  getPoint(t: number, destino = new THREE.Vector3()): THREE.Vector3 {
    const angulo = t * this.vueltas * Math.PI * 2;
    return destino.set(Math.cos(angulo) * this.radio, -t * this.altura, Math.sin(angulo) * this.radio);
  }
}

function piernaResorte() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8), MAT.metalOscuro, 0, -0.02, 0)); // cadera

  const ALTO = 0.5;
  const resorte = malla(new THREE.TubeGeometry(new Helice(0.065, ALTO, 6), 48, 0.02, 5, false), MAT.metal, 0, -0.08, 0);
  const placa = malla(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), MAT.metalOscuro, 0, -0.6, 0);
  const pie = malla(new THREE.BoxGeometry(0.18, 0.08, 0.28), MAT.naranja, 0, -0.66, 0.04);
  g.add(resorte, placa, pie);

  // Al caminar el resorte se comprime un poco y el pie sube con él
  g.userData.animar = (tiempo: number, caminar: number) => {
    const k = 1 - 0.1 * caminar * Math.abs(Math.sin(tiempo * 5));
    resorte.scale.y = k;
    const fondo = -0.08 - ALTO * k;
    placa.position.y = fondo - 0.02;
    pie.position.y = fondo - 0.08;
  };
  return g;
}

// ---------- Ruedas ----------
function piernaRuedas() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8), MAT.metalOscuro, 0, -0.02, 0)); // cadera
  g.add(malla(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), MAT.metal, 0, -0.27, 0));       // poste

  // La rueda es un grupo con su centro en el eje: girarlo (rotation.x) la hace rodar.
  const rueda = new THREE.Group();
  rueda.position.set(0, -0.58, 0);
  const llanta = malla(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), MAT.zapatosOscuros, 0, 0, 0);
  llanta.rotation.z = Math.PI / 2; // el cilindro nace parado; lo acostamos para que el eje sea x
  rueda.add(llanta);
  // Rayos en cruz (sobresalen un poquito para que se note que gira)
  rueda.add(malla(new THREE.BoxGeometry(0.1, 0.2, 0.03), MAT.naranja, 0, 0, 0));
  rueda.add(malla(new THREE.BoxGeometry(0.1, 0.03, 0.2), MAT.naranja, 0, 0, 0));
  g.add(rueda);

  // Esta parte guarda su propio estado: cuánto ha girado la rueda
  let giro = 0;
  let anterior: number | null = null;
  g.userData.animar = (tiempo: number, caminar: number) => {
    if (anterior !== null) giro += (tiempo - anterior) * 12 * caminar; // gira solo si camina
    anterior = tiempo;
    rueda.rotation.x = giro;
  };
  return g;
}

// ---------- Patas robot (rodilla hacia adelante, pistón, pie metálico) ----------
function piernaPatasRobot() {
  const g = new THREE.Group();
  g.add(malla(new THREE.SphereGeometry(0.075, 6, 5), MAT.metalOscuro, 0, 0, 0));        // cadera
  g.add(hueso([0, -0.02, 0], [0, -0.32, 0.08], 0.05, MAT.metal));                       // muslo
  g.add(malla(new THREE.SphereGeometry(0.06, 6, 5), MAT.metalOscuro, 0, -0.32, 0.08));  // rodilla
  g.add(hueso([0, -0.32, 0.08], [0, -0.64, 0], 0.04, MAT.metal));                       // pantorrilla
  g.add(hueso([0, -0.06, -0.07], [0, -0.5, -0.06], 0.018, MAT.naranja));                // pistón trasero
  g.add(malla(new THREE.SphereGeometry(0.045, 6, 5), MAT.neon, 0, -0.64, 0));           // tobillo luminoso
  g.add(malla(new THREE.BoxGeometry(0.16, 0.06, 0.26), MAT.metalOscuro, 0, -0.67, 0.06)); // pie
  return g;
}

// ---------- Maniquí vacío ----------
function piernaManiqui() {
  const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(0.09, 0.08, 0.62, 6), MAT.maniqui, 0, -0.29, 0));
  g.add(malla(new THREE.BoxGeometry(0.16, 0.1, 0.26), MAT.maniquiOscuro, 0, -0.65, 0.04));
  return g;
}

export const PIERNAS: CatalogoTipo = {
  maniqui: { nombre: 'Maniquí vacío',    construir: piernaManiqui },
  normal: { nombre: 'Pantalón normal',  construir: piernaNormal },
  oscuro: { nombre: 'Pantalón oscuro', construir: piernaOscura },
  resorte: { nombre: 'Resorte',        construir: piernaResorte },
  ruedas: { nombre: 'Ruedas',          construir: piernaRuedas },
  patasRobot: { nombre: 'Patas robot', construir: piernaPatasRobot }
};