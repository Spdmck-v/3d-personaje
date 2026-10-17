// ============================================================
// main.ts — Punto de entrada: arma la escena y conecta los módulos.
//   camera.ts → cámara 3ª persona      player.ts → movimiento/salto/baile
//   world.ts → pickups del mundo       interactions.ts → tecla E
//   ui/inventoryUI.ts → inventario     persistence.ts → guardado y URL
// ============================================================

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { crearCuarto } from './room';
import { crearPersonaje } from './character';
import { configurarEntorno } from './parts';
import { crearInventario } from './inventory';
import { animarPickups } from './pickups';
import { alPresionar } from './input';
import { crearCamara } from './camera';
import { crearControlJugador } from './player';
import { crearMundo } from './world';
import { crearInteracciones } from './interactions';
import { crearInventarioUI } from './ui/inventoryUI';
import { mostrarMensaje } from './ui/avisos';
import { estado } from './state';
import * as guardado from './persistence';

// ---------- Escena y renderer ----------
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x1b1b2f);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('escena')!.appendChild(renderer.domElement);

const generadorEntorno = new THREE.PMREMGenerator(renderer);
configurarEntorno(generadorEntorno.fromScene(new RoomEnvironment(), 0.04).texture);

// ---------- Cuarto, personaje y sistemas ----------
const cuarto = crearCuarto();
escena.add(cuarto);

const personaje = crearPersonaje();
const jugador = personaje.grupo;
jugador.position.set(0, 0, 2.0);
escena.add(jugador);

const inventario = crearInventario();
const mundo = crearMundo(escena, jugador);
const { camara, vista, actualizar: actualizarCamara, redimensionar } = crearCamara(renderer, jugador);
const control = crearControlJugador(jugador, personaje, vista);
const inventarioUI = crearInventarioUI({ personaje, inventario, soltarAlPiso: mundo.soltarAlPiso });
const { actualizarAviso } = crearInteracciones({
  cuarto, jugador, personaje, inventario, mundo, control, inventarioUI, vista,
  canvas: renderer.domElement
});

alPresionar('KeyI', inventarioUI.alternar);
alPresionar('Escape', () => {
  if (estado.inventarioAbierto) inventarioUI.alternar();
});

// ---------- Guardado local + compartir por URL ----------
function buildActual(): guardado.Build {
  const build: guardado.Build = {};
  for (const slot of guardado.SLOTS) build[slot] = personaje.disenoEn(slot);
  return build;
}

function aplicarBuild(build: guardado.Build): void {
  for (const slot of guardado.SLOTS) {
    const diseno = build[slot];
    if (diseno) personaje.ponerParte(slot, diseno);
  }
}

// Prioridad: link compartido (?b=...) > partida guardada
const buildURL = guardado.parsearBuild(new URLSearchParams(location.search).get('b'));
const partida = guardado.cargar();
if (Object.keys(buildURL).length > 0) {
  aplicarBuild(buildURL);
  mostrarMensaje('Personaje cargado desde el link 🔗');
} else if (partida) {
  aplicarBuild(partida.build);
  inventario.cargar(partida.mochila);
}

let ultimoGuardado = '';
function guardarSiCambio(): void {
  const actual = { build: buildActual(), mochila: { ...inventario.mochila } };
  const firma = JSON.stringify(actual);
  if (firma === ultimoGuardado) return;
  ultimoGuardado = firma;
  guardado.guardar(actual);
}
setInterval(guardarSiCambio, 1000);
window.addEventListener('beforeunload', guardarSiCambio);

document.getElementById('btn-compartir')?.addEventListener('click', async () => {
  const url = guardado.urlCompartir(buildActual(), location.href);
  try {
    await navigator.clipboard.writeText(url);
    mostrarMensaje('Link copiado al portapapeles 🔗');
  } catch {
    window.prompt('Copia este link:', url);
  }
});

document.getElementById('btn-reiniciar')?.addEventListener('click', () => {
  guardado.borrar();
  location.href = location.pathname; // sin ?b=
});

// ---------- Resize y bucle principal ----------
window.addEventListener('resize', () => {
  redimensionar();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const reloj = new THREE.Clock();
function animar(): void {
  requestAnimationFrame(animar);
  const delta = Math.min(reloj.getDelta(), 0.1);
  const moviendo = control.actualizar(delta);
  personaje.animar(reloj.elapsedTime, delta, moviendo);
  const pk = mundo.pickupCercano();
  animarPickups(mundo.pickups, reloj.elapsedTime, pk ? pk.id : null);
  actualizarCamara();
  actualizarAviso(pk);
  renderer.render(escena, camara);
}

actualizarCamara();
animar();
