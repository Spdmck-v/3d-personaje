// ============================================================
// parts.js — Catálogo de partes (índice)
//
// Aquí solo se JUNTAN los diseños; cada uno vive en su archivo dentro de parts/.
// Para agregar un diseño nuevo: escribe su función en el archivo de su tipo
// (por ejemplo parts/cabezas.js) y añade una línea a la lista de ese archivo.
//
// REGLAS QUE TODAS LAS PARTES DEBEN CUMPLIR (para que encajen siempre):
//   1. El ORIGEN (0,0,0) de la parte es su PUNTO DE ANCLAJE:
//        cabeza → base del cuello (crece hacia arriba)
//        torso  → cintura (crece hacia arriba)
//        brazo  → hombro (cuelga hacia abajo)
//        pierna → cadera (cuelga hacia abajo)
//        alas   → centro de la espalda alta (salen hacia los lados)
//   2. Mira hacia +z (el frente del personaje es el eje z positivo).
//   3. Tamaños aproximados:
//        cabeza ~0.4 de alto | torso 0.6 de alto, ~0.5-0.6 de ancho
//        brazo ~0.55 de largo | pierna 0.7 de largo | alas ~0.95 hacia cada lado
//   4. Brazos y piernas son SIMÉTRICOS: la misma función sirve para ambos lados.
//   5. (Opcional) Una parte puede animarse sola definiendo
//        grupo.userData.animar = (tiempo, caminar) => { ... }
//      "caminar" va de 0 (quieto) a 1 (caminando).
// ============================================================

import { CABEZAS } from './parts/cabezas';
import { TORSOS } from './parts/torsos';
import { BRAZOS } from './parts/brazos';
import { PIERNAS } from './parts/piernas';
import { ALAS } from './parts/alas';
import type { CatalogoTipo, TipoParte } from './types';

export { PALETA, configurarEntorno } from './parts/materiales';

// Estructura:  CATALOGO[tipoDeParte][nombreDelDiseño] = { nombre, construir }
export const CATALOGO: Record<TipoParte, CatalogoTipo> = {
  cabeza: CABEZAS,
  torso: TORSOS,
  brazo: BRAZOS,
  pierna: PIERNAS,
  alas: ALAS
};

// Diseño con el que empieza cada tipo de parte (maniquí vacío)
export const DISENO_POR_DEFECTO = {
  cabeza: 'maniqui',
  torso: 'maniqui',
  brazo: 'maniqui',
  pierna: 'maniqui',
  alas: 'ninguna'
};