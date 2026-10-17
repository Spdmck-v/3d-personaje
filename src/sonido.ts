// ============================================================
// sonido.js — Efectos mínimos con WebAudio, sin assets (mejora #9)
// pop al recoger, click al equipar, thud al soltar, jump y dance.
// ============================================================

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tono(
  freq: number,
  dur: number,
  tipo: OscillatorType = 'sine',
  vol = 0.15,
  deslizarA: number | null = null
): void {
  try {
    const a = audio();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (deslizarA) o.frequency.exponentialRampToValueAtTime(deslizarA, a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  } catch { /* sin audio no rompe el juego */ }
}

export const sonido = {
  recoger() { tono(520, 0.12, 'sine', 0.15, 880); },
  equipar() { tono(340, 0.09, 'square', 0.08, 520); },
  quitar() { tono(420, 0.09, 'square', 0.08, 260); },
  soltar() { tono(160, 0.15, 'sine', 0.18, 90); },
  salto() { tono(280, 0.18, 'sine', 0.12, 640); },
  baile() { tono(440, 0.1, 'triangle', 0.12, 660); setTimeout(() => tono(660, 0.1, 'triangle', 0.12, 880), 120); },
  error() { tono(140, 0.15, 'sawtooth', 0.08); }
};
