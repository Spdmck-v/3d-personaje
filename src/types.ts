import type * as THREE from 'three';

/** Categorías genéricas de pieza (brazo/pierna sirven para ambos lados). */
export type TipoParte = 'cabeza' | 'torso' | 'brazo' | 'pierna' | 'alas';

/** Puntos de anclaje reales del cuerpo. */
export type NombreSlot =
  | 'cabeza'
  | 'torso'
  | 'alas'
  | 'brazoIzq'
  | 'brazoDer'
  | 'piernaIzq'
  | 'piernaDer';

export type Vec3 = [number, number, number];

/** Un diseño del catálogo: nombre visible + función que construye su geometría. */
export interface DisenoParte {
  nombre: string;
  construir: () => THREE.Group;
}

export type CatalogoTipo = Record<string, DisenoParte>;

/** Cada pieza puede animarse sola definiendo userData.animar. */
export type AnimarParte = (tiempo: number, caminar: number) => void;
