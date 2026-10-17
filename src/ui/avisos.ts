// Mensajes temporales y aviso contextual ("Presiona E para…").

const mensaje = document.getElementById('mensaje-prueba')!;
const aviso = document.getElementById('aviso-interaccion')!;
let temporizador: ReturnType<typeof setTimeout> | undefined;

export function mostrarMensaje(texto: string): void {
  mensaje.textContent = texto;
  mensaje.classList.remove('oculto');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => mensaje.classList.add('oculto'), 1800);
}

export function mostrarAviso(texto: string | null): void {
  if (texto === null) {
    aviso.classList.add('oculto');
    return;
  }
  aviso.textContent = texto;
  aviso.classList.remove('oculto');
}
