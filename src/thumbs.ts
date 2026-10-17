// ============================================================
// thumbs.js — Miniaturas reales de cada pieza (mejora #14)
// Renderiza cada diseño UNA vez en un renderer offscreen 96x96
// y devuelve dataURL. En inventario se prefiere <img>, emoji fallback.
// Decisión: thumbs reales (más fiel que emoji) + emoji pequeño al lado
// del nombre para lectura rápida.
// ============================================================

import * as THREE from 'three';
import { CATALOGO } from './parts';
import type { TipoParte } from './types';

const cache: Record<string, string | null> = {}; // "tipo/diseno" -> dataURL
let listo = false;

function rendererOff() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(96, 96);
  r.setClearColor(0x000000, 0);
  return r;
}

export function generarThumbs(): Record<string, string | null> {
  if (listo) return cache;
  const r = rendererOff();
  const escena = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
  cam.position.set(0.6, 0.6, 1.6);
  cam.lookAt(0, 0.15, 0);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.6));
  const luz = new THREE.DirectionalLight(0xffffff, 1.4);
  luz.position.set(1, 2, 2);
  escena.add(luz);

  for (const tipo of Object.keys(CATALOGO) as TipoParte[]) {
    for (const diseno of Object.keys(CATALOGO[tipo])) {
      const clave = `${tipo}/${diseno}`;
      try {
        const g = CATALOGO[tipo][diseno].construir();
        // Encuadre según tipo
        if (tipo === 'alas') g.scale.setScalar(0.6);
        const centro = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
        g.position.sub(centro);
        g.position.y += 0.1;
        escena.add(g);
        // Gira un poco para que se vea 3D
        g.rotation.y = 0.5;
        r.render(escena, cam);
        cache[clave] = r.domElement.toDataURL();
        escena.remove(g);
        g.traverse((h) => {
          if (h instanceof THREE.Mesh) h.geometry.dispose();
        });
      } catch {
        cache[clave] = null;
      }
    }
  }
  r.dispose();
  listo = true;
  return cache;
}

export function thumbDe(tipo: TipoParte, diseno: string): string | null {
  return cache[`${tipo}/${diseno}`] ?? null;
}
