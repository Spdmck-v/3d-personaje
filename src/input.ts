// ============================================================
// input.js — Teclado (WASD para moverse, E para interactuar)
// Este archivo SOLO se encarga de saber qué teclas se están
// usando. No mueve nada: eso lo decide main.js.
// ============================================================

// Aquí guardamos qué teclas están presionadas ahora mismo.
// Ejemplo: { KeyW: true, KeyA: false }
const teclas: Record<string, boolean> = {};

// Lista de funciones que se ejecutan UNA vez cuando se presiona una tecla.
// Ejemplo: { KeyE: [funcion1, funcion2] }
const escuchas: Record<string, Array<() => void>> = {};

// Usamos event.code (ej: "KeyW") y no event.key (ej: "w"),
// así funciona igual aunque el teclado esté en otro idioma o con Mayúsculas activadas.
window.addEventListener('keydown', (evento) => {
  teclas[evento.code] = true;

  // evento.repeat es true cuando mantienes la tecla apretada.
  // Lo ignoramos para que "E" se active una vez por pulsación.
  if (!evento.repeat && escuchas[evento.code]) {
    escuchas[evento.code].forEach((funcion) => funcion());
  }
});

window.addEventListener('keyup', (evento) => {
  teclas[evento.code] = false;
});

// Si cambias de pestaña con una tecla apretada, el navegador no avisa que la soltaste.
// Por eso, al perder el foco, soltamos todas las teclas (evita que el personaje siga caminando solo).
window.addEventListener('blur', () => {
  for (const codigo in teclas) teclas[codigo] = false;
});

// ¿Está esta tecla presionada ahora? (se usa para moverse, cada cuadro)
export function estaPresionada(codigo: string): boolean {
  return teclas[codigo] === true;
}

// Ejecuta una función UNA vez cada vez que se presiona la tecla (se usa para interactuar)
export function alPresionar(codigo: string, funcion: () => void): void {
  if (!escuchas[codigo]) escuchas[codigo] = [];
  escuchas[codigo].push(funcion);
}