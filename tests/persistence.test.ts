import { describe, it, expect } from 'vitest';
import { serializarBuild, parsearBuild, urlCompartir, sanearMochila } from '../src/persistence';

describe('persistencia / compartir por URL', () => {
  it('serializar y parsear son inversos', () => {
    const build = { cabeza: 'robot', torso: 'motor', alas: 'mecanicas', brazoIzq: 'garra' };
    expect(parsearBuild(serializarBuild(build))).toEqual(build);
  });

  it('ignora slots y diseños desconocidos (entrada no confiable)', () => {
    expect(parsearBuild('cabeza:robot,hackeo:1,torso:nada,alas:angel')).toEqual({
      cabeza: 'robot',
      alas: 'angel'
    });
  });

  it('maneja vacío y basura', () => {
    expect(parsearBuild(null)).toEqual({});
    expect(parsearBuild('')).toEqual({});
    expect(parsearBuild(':::,,,')).toEqual({});
  });

  it('urlCompartir reemplaza el query anterior', () => {
    const url = urlCompartir({ cabeza: 'robot' }, 'https://x.dev/app/?b=viejo#h');
    expect(url).toBe('https://x.dev/app/?b=cabeza%3Arobot');
  });

  it('sanearMochila filtra tipos y respeta capacidad', () => {
    const r = sanearMochila({ pierna: ['ruedas', 'resorte', 'oscuro'], torso: 'no-lista', alas: [1, 'angel'] });
    expect(r.pierna).toEqual(['ruedas', 'resorte']);
    expect(r.torso).toBeUndefined();
    expect(r.alas).toEqual(['angel']);
    expect(sanearMochila(null)).toEqual({});
  });
});
