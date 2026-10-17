// ============================================================
// ui/inventoryUI.ts — Ventana de inventario (drag & drop + click rápido)
// ============================================================

import { CATALOGO } from '../parts';
import { SLOTS_POR_TIPO, CAPACIDAD, TIPOS, type Inventario } from '../inventory';
import { generarThumbs, thumbDe } from '../thumbs';
import { sonido } from '../sonido';
import { estado } from '../state';
import { mostrarMensaje } from './avisos';
import type { Personaje } from '../character';
import type { NombreSlot, TipoParte } from '../types';

export const TIPO_DE_SLOT: Record<NombreSlot, TipoParte> = {
  cabeza: 'cabeza',
  torso: 'torso',
  alas: 'alas',
  brazoIzq: 'brazo',
  brazoDer: 'brazo',
  piernaIzq: 'pierna',
  piernaDer: 'pierna'
};

const ICONOS: Record<TipoParte, Record<string, string>> = {
  cabeza: { maniqui: '🗿', normal: '🙂', rubia: '👱‍♀️', cubica: '🧊', triangular: '🔺', robot: '🤖' },
  torso: { maniqui: '🩶', normal: '👕', sudadera: '🧣', ancho: '🎽', armadura: '🛡️', motor: '⚙️' },
  brazo: { maniqui: '🦾', normal: '💪', sudadera: '🧤', robotico: '🦿', tentaculo: '🐙', garra: '🦖' },
  pierna: { maniqui: '🦵', normal: '👖', oscuro: '🥾', resorte: '🌀', ruedas: '🛞', patasRobot: '🦾' },
  alas: { ninguna: '➖', angel: '🕊️', murcielago: '🦇', mecanicas: '🛩️' }
};
const iconoDe = (tipo: TipoParte, diseno: string) => ICONOS[tipo]?.[diseno] ?? '❓';

type DatosArrastre =
  | { de: 'slot'; slot: NombreSlot; tipo: TipoParte; diseno: string }
  | { de: 'mochila'; tipo: TipoParte; indice: number };

interface Deps {
  personaje: Personaje;
  inventario: Inventario;
  soltarAlPiso: (tipo: TipoParte, diseno: string) => void;
}

export function crearInventarioUI({ personaje, inventario, soltarAlPiso }: Deps) {
  const ventana = document.getElementById('inventario')!;
  const divMochila = document.getElementById('inv-mochila')!;
  const slotsMuneco = [...document.querySelectorAll<HTMLElement>('.slot-cuerpo')];
  let thumbsListas = false;

  // Miniaturas reales como imagen principal; emoji como fallback si falla el render.
  function imgPieza(tipo: TipoParte, diseno: string, tam = 44): string {
    const url = thumbDe(tipo, diseno);
    if (url) {
      return `<img src="${url}" width="${tam}" height="${tam}" alt="${diseno}" style="border-radius:8px;background:#1b1b2f;vertical-align:middle">`;
    }
    return `<span style="font-size:${tam * 0.6}px">${iconoDe(tipo, diseno)}</span>`;
  }

  function refrescar(): void {
    for (const div of slotsMuneco) {
      const slot = div.dataset.slot as NombreSlot;
      const tipo = TIPO_DE_SLOT[slot];
      const dis = personaje.disenoEn(slot);
      const nombre = CATALOGO[tipo]?.[dis]?.nombre ?? dis;
      const vacio = personaje.esVacio(slot);
      div.innerHTML = `<div class="thumb">${imgPieza(tipo, dis, 52)}</div>
        <div class="slot-titulo">${slot}</div>
        <div class="nombre">${vacio ? '(vacío)' : `${iconoDe(tipo, dis)} ${nombre}`}</div>`;
      div.draggable = !vacio;
      div.dataset.origen = 'slot';
      div.dataset.slotOrigen = slot;
    }
    divMochila.innerHTML = '';
    divMochila.dataset.origen = 'mochila';
    for (const tipo of TIPOS) {
      const lista = inventario.mochila[tipo];
      const titulo = document.createElement('div');
      titulo.className = 'inv-vacio';
      titulo.textContent = `${tipo} (${lista.length}/${CAPACIDAD[tipo]}) — arrastra al cuerpo`;
      divMochila.appendChild(titulo);
      lista.forEach((diseno, idx) => {
        const fila = document.createElement('div');
        fila.className = 'inv-item';
        fila.draggable = true;
        fila.dataset.origen = 'mochila';
        fila.dataset.tipo = tipo;
        fila.dataset.indice = String(idx);
        fila.innerHTML = `${imgPieza(tipo, diseno, 40)}<span>${iconoDe(tipo, diseno)} ${CATALOGO[tipo][diseno].nombre}</span>
          <span class="inv-vacio">${tipo === 'brazo' || tipo === 'pierna' ? '→ Izq o Der' : '→ su lugar'}</span>`;
        fila.onclick = () => equiparClickRapido(tipo, idx);
        divMochila.appendChild(fila);
      });
      if (lista.length === 0) {
        const v = document.createElement('div');
        v.className = 'inv-vacio';
        v.textContent = '— vacío —';
        divMochila.appendChild(v);
      }
    }
  }

  function equiparClickRapido(tipo: TipoParte, indice: number): void {
    const candidatos = SLOTS_POR_TIPO[tipo];
    const destino = candidatos.find((s) => personaje.esVacio(s)) ?? candidatos[0];
    equiparDesdeMochila(tipo, indice, destino);
  }

  function equiparDesdeMochila(tipo: TipoParte, indice: number, slotDestino: NombreSlot): void {
    if (TIPO_DE_SLOT[slotDestino] !== tipo) {
      mostrarMensaje(`Esa pieza es de ${tipo}, no va en ${slotDestino}`);
      sonido.error();
      return;
    }
    const diseno = inventario.quitar(tipo, indice);
    if (!diseno) return;
    const anterior = personaje.disenoEn(slotDestino);
    personaje.ponerParte(slotDestino, diseno);
    sonido.equipar();
    if (anterior && anterior !== 'maniqui' && anterior !== 'ninguna') {
      if (!inventario.agregar(tipo, anterior)) soltarAlPiso(tipo, anterior);
    }
    refrescar();
  }

  function quitarEquipado(slot: NombreSlot): void {
    const tipo = TIPO_DE_SLOT[slot];
    const anterior = personaje.quitarParte(slot);
    if (!anterior) return;
    sonido.quitar();
    if (!inventario.agregar(tipo, anterior)) {
      soltarAlPiso(tipo, anterior);
      mostrarMensaje(`${anterior} cayó al piso (mochila llena)`);
    }
    refrescar();
  }

  // ---------- Drag & drop ----------
  let arrastre: DatosArrastre | null = null;
  const zonaDe = (e: Event) => (e.target as HTMLElement).closest?.('.slot-cuerpo, #inv-mochila') as HTMLElement | null;
  const estaCerrada = () => ventana.classList.contains('oculto');

  document.addEventListener('dragstart', (e) => {
    const t = (e.target as HTMLElement).closest?.<HTMLElement>('[draggable="true"]');
    if (!t || estaCerrada()) return;
    if (t.dataset.origen === 'slot') {
      const slot = (t.dataset.slotOrigen ?? t.dataset.slot) as NombreSlot;
      arrastre = { de: 'slot', slot, tipo: TIPO_DE_SLOT[slot], diseno: personaje.disenoEn(slot) };
    } else if (t.dataset.origen === 'mochila') {
      arrastre = { de: 'mochila', tipo: t.dataset.tipo as TipoParte, indice: Number(t.dataset.indice) };
    }
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragover', (e) => {
    const zona = zonaDe(e);
    if (zona && !estaCerrada()) {
      e.preventDefault();
      zona.classList.add('sobre');
    }
  });
  document.addEventListener('dragleave', (e) => {
    zonaDe(e)?.classList.remove('sobre');
  });
  document.addEventListener('drop', (e) => {
    const zona = zonaDe(e);
    if (!zona || !arrastre) return;
    e.preventDefault();
    document.querySelectorAll('.sobre').forEach((d) => d.classList.remove('sobre'));
    if (zona.classList.contains('slot-cuerpo')) {
      const dest = zona.dataset.slot as NombreSlot;
      if (arrastre.de === 'mochila') {
        equiparDesdeMochila(arrastre.tipo, arrastre.indice, dest);
      } else {
        const origen = arrastre.slot;
        if (origen !== dest && TIPO_DE_SLOT[origen] === TIPO_DE_SLOT[dest]) {
          const a = personaje.disenoEn(origen);
          const b = personaje.disenoEn(dest);
          personaje.ponerParte(dest, a);
          personaje.ponerParte(origen, b ?? (TIPO_DE_SLOT[origen] === 'alas' ? 'ninguna' : 'maniqui'));
          sonido.equipar();
          refrescar();
        }
      }
    } else if (zona.id === 'inv-mochila' && arrastre.de === 'slot') {
      quitarEquipado(arrastre.slot);
    }
    arrastre = null;
  });
  document.addEventListener('dragend', () => {
    arrastre = null;
    document.querySelectorAll('.sobre').forEach((d) => d.classList.remove('sobre'));
  });

  function alternar(): void {
    estado.inventarioAbierto = !estado.inventarioAbierto;
    if (estado.inventarioAbierto) {
      if (!thumbsListas) {
        try {
          generarThumbs();
        } catch {
          /* fallback a emojis */
        }
        thumbsListas = true;
      }
      refrescar();
      ventana.classList.remove('oculto');
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      ventana.classList.add('oculto');
    }
  }

  inventario.onCambio(() => {
    if (estado.inventarioAbierto) refrescar();
  });

  return { refrescar, alternar };
}

export type InventarioUI = ReturnType<typeof crearInventarioUI>;
