// ============================================================
// camera.ts — Cámara en 3ª persona con pointer lock y anti-clipping
// ============================================================

import * as THREE from 'three';
import { ANCHO, FONDO, COLISIONES } from './room';
import { estado } from './state';

const DIST_CAM = 3.0;

/** Orientación de la cámara; la comparten cámara y movimiento. */
export interface Vista {
  yaw: number;
  pitch: number;
}

export function crearCamara(renderer: THREE.WebGLRenderer, objetivo: THREE.Object3D) {
  const camara = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  const vista: Vista = { yaw: Math.PI, pitch: 0.28 };

  renderer.domElement.addEventListener('click', () => {
    if (!estado.inventarioAbierto && document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  });
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== renderer.domElement || estado.inventarioAbierto) return;
    vista.yaw -= e.movementX * 0.0024;
    vista.pitch = THREE.MathUtils.clamp(vista.pitch + e.movementY * 0.0022, -0.15, 1.0);
  });

  // Paredes + interior de estantes: si choca, la cámara se acerca al jugador
  function choca(x: number, y: number, z: number): boolean {
    if (Math.abs(x) > ANCHO / 2 - 0.2 || Math.abs(z) > FONDO / 2 - 0.2 || y < 0.3 || y > 3.9) {
      return true;
    }
    for (const c of COLISIONES) {
      if (Math.abs(x - c.x) < c.hx + 0.2 && Math.abs(z - c.z) < c.hz + 0.2 && y > 0.5 && y < 3.0) {
        return true;
      }
    }
    return false;
  }

  function actualizar(): void {
    // Retrocede hasta encontrar un punto sin colisión
    let d = DIST_CAM;
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let intento = 0; intento < 8; intento++) {
      cx = objetivo.position.x + Math.sin(vista.yaw) * Math.cos(vista.pitch) * d;
      cz = objetivo.position.z + Math.cos(vista.yaw) * Math.cos(vista.pitch) * d;
      cy = 1.4 + Math.sin(vista.pitch) * d + objetivo.position.y * 0.5;
      if (!choca(cx, cy, cz)) break;
      d *= 0.8;
    }
    camara.position.set(
      THREE.MathUtils.clamp(cx, -ANCHO / 2 + 0.2, ANCHO / 2 - 0.2),
      THREE.MathUtils.clamp(cy, 0.5, 3.8),
      THREE.MathUtils.clamp(cz, -FONDO / 2 + 0.2, FONDO / 2 - 0.2)
    );
    camara.lookAt(objetivo.position.x, 1.25 + objetivo.position.y * 0.5, objetivo.position.z);
  }

  function redimensionar(): void {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
  }

  return { camara, vista, actualizar, redimensionar };
}
