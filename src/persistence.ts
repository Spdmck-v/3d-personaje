// ============================================================
// persistence.ts — Guardado local y compartir por URL
// Funciones puras (serializar/parsear) + acceso a localStorage con try/catch.
// ============================================================

import { CATALOGO } from './parts';
import { CAPACIDAD, TIPOS, type Mochila } from './inventory';
import type { NombreSlot, TipoParte } from './types';

export const SLOTS: readonly NombreSlot[] = [
  'cabeza', 'torso', 'alas', 'brazoIzq', 'brazoDer', 'piernaIzq', 'piernaDer'
];

const TIPO_DE_SLOT: Record<NombreSlot, TipoParte> = {
  cabeza: 'cabeza', torso: 'torso', alas: 'alas',
  brazoIzq: 'brazo', brazoDer: 'brazo', piernaIzq: 'pierna', piernaDer: 'pierna'
};

export type Build = Partial<Record<NombreSlot, string>>;

export interface PartidaGuardada {
  build: Build;
  mochila: Partial<Mochila>;
}

const CLAVE = 'personaje-3d:v1';

/** ¿Existe este diseño en el catálogo para ese slot? */
export function disenoValido(slot: NombreSlot, diseno: string): boolean {
  return Boolean(CATALOGO[TIPO_DE_SLOT[slot]]?.[diseno]);
}

/** { cabeza: 'robot', torso: 'motor' } → "cabeza:robot,torso:motor" */
export function serializarBuild(build: Build): string {
  return SLOTS.filter((s) => build[s]).map((s) => `${s}:${build[s]}`).join(',');
}

/** Inverso de serializarBuild. Ignora slots o diseños desconocidos (entrada no confiable). */
export function parsearBuild(texto: string | null | undefined): Build {
  const build: Build = {};
  if (!texto) return build;
  for (const par of texto.split(',')) {
    const [slot, diseno] = par.split(':');
    if ((SLOTS as readonly string[]).includes(slot) && disenoValido(slot as NombreSlot, diseno)) {
      build[slot as NombreSlot] = diseno;
    }
  }
  return build;
}

export function urlCompartir(build: Build, base: string): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('b', serializarBuild(build));
  return url.toString();
}

/** Limpia una mochila leída del disco: solo diseños válidos y respetando capacidad. */
export function sanearMochila(datos: unknown): Partial<Mochila> {
  const salida: Partial<Mochila> = {};
  if (!datos || typeof datos !== 'object') return salida;
  for (const tipo of TIPOS) {
    const lista = (datos as Record<string, unknown>)[tipo];
    if (!Array.isArray(lista)) continue;
    salida[tipo] = lista
      .filter((d): d is string => typeof d === 'string' && Boolean(CATALOGO[tipo]?.[d]))
      .slice(0, CAPACIDAD[tipo]);
  }
  return salida;
}

export function guardar(partida: PartidaGuardada): void {
  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify({ build: serializarBuild(partida.build), mochila: partida.mochila })
    );
  } catch {
    /* modo privado o almacenamiento lleno: no rompe el juego */
  }
}

export function cargar(): PartidaGuardada | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as { build?: string; mochila?: unknown };
    return {
      build: parsearBuild(typeof datos.build === 'string' ? datos.build : ''),
      mochila: sanearMochila(datos.mochila)
    };
  } catch {
    return null;
  }
}

export function borrar(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* noop */
  }
}
