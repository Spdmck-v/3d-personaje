// ============================================================
// room.js — El cuartito (Fase 2)
// Construye piso, paredes, decoración y luces cálidas.
// Exporta UNA función: crearCuarto(), que devuelve el cuarto
// listo para agregar a la escena.
// ============================================================

import * as THREE from 'three';

// Medidas del cuarto (en "unidades" de Three.js; piensa 1 unidad = 1 metro)
export const ANCHO = 14;  // de izquierda a derecha (eje x)
export const FONDO = 10;  // de adelante hacia atrás (eje z)
export const ALTO = 4;   // altura de las paredes (eje y)

// Colisiones simples (cajas) para que el jugador y la cámara no atraviesen muebles.
// Se rellenan en crearCuarto(): { x, z, hx, hz } (centro + mitad de tamaño)
export interface CajaColision {
  x: number;
  z: number;
  hx: number;
  hz: number;
}
export const COLISIONES: CajaColision[] = [];

/** Objetos interactivos que crearCuarto() deja en cuarto.userData. */
export interface Lampara {
  luz: THREE.PointLight;
  foco: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  posicion: THREE.Vector3;
}
export interface Espejo {
  posicion: THREE.Vector3;
}

// --- Función auxiliar: crea una caja con material y sombras ya configuradas ---
// Así no repetimos las mismas líneas cada vez que hacemos un mueble.
function crearCaja(
  ancho: number,
  alto: number,
  fondo: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
): THREE.Mesh {
  const caja = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), material);
  caja.position.set(x, y, z);
  caja.castShadow = true;    // este objeto proyecta sombra
  caja.receiveShadow = true; // y también recibe sombra de otros
  return caja;
}

export function crearCuarto() {
  // Un Group agrupa muchos objetos: moverlo mueve todo el cuarto junto.
  const cuarto = new THREE.Group();

  // ---------- MATERIALES ----------
  // Los creamos una sola vez y los reutilizamos (mejor rendimiento).
  // roughness: 1 = mate total, 0 = espejo.
  const matPiso = new THREE.MeshStandardMaterial({ color: 0xb98a5e, roughness: 0.8 });   // madera
  const matPared = new THREE.MeshStandardMaterial({ color: 0xe8d9c5, roughness: 1 });    // beige cálido
  const matAlfombra = new THREE.MeshStandardMaterial({ color: 0xc0504d, roughness: 1 }); // roja
  const matMarco = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.7 });  // madera oscura
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.6 });
  // MeshBasicMaterial no depende de la luz: sirve para cosas que "brillan solas".
  const matVidrio = new THREE.MeshBasicMaterial({ color: 0xbfe3ff });
  const matFoco = new THREE.MeshBasicMaterial({ color: 0xfff1c1 });
  const matPantalla = new THREE.MeshStandardMaterial({
    color: 0xffe8b0, emissive: 0xffc870, emissiveIntensity: 0.6, roughness: 1
  });

  // ---------- PISO ----------
  // PlaneGeometry nace "parada"; la giramos 90° para dejarla acostada.
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, FONDO), matPiso);
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  cuarto.add(piso);

  // ---------- PAREDES ----------
  const grosor = 0.2;
  // Pared del fondo
  cuarto.add(crearCaja(ANCHO, ALTO, grosor, matPared, 0, ALTO / 2, -FONDO / 2));
  // Pared izquierda y derecha
  cuarto.add(crearCaja(grosor, ALTO, FONDO, matPared, -ANCHO / 2, ALTO / 2, 0));
  cuarto.add(crearCaja(grosor, ALTO, FONDO, matPared, ANCHO / 2, ALTO / 2, 0));
  // Pared de adelante
  cuarto.add(crearCaja(ANCHO, ALTO, grosor, matPared, 0, ALTO / 2, FONDO / 2));

  // ---------- ALFOMBRA ----------
  // Un cilindro muy aplastado (radio arriba, radio abajo, altura, segmentos)
  const alfombra = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.03, 32), matAlfombra);
  alfombra.position.set(0, 0.015, 0);
  alfombra.receiveShadow = true;
  cuarto.add(alfombra);

  // ---------- VENTANA (en la pared del fondo) ----------
  const zVentana = -FONDO / 2 + 0.11; // justo delante de la pared
  const yVentana = 2.2;
  // El "vidrio"
  const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), matVidrio);
  vidrio.position.set(0, yVentana, zVentana);
  cuarto.add(vidrio);
  // Marco: 4 tablitas alrededor + una cruz en el medio
  cuarto.add(crearCaja(2.0, 0.1, 0.08, matMarco, 0, yVentana + 0.75, zVentana)); // arriba
  cuarto.add(crearCaja(2.0, 0.1, 0.08, matMarco, 0, yVentana - 0.75, zVentana)); // abajo
  cuarto.add(crearCaja(0.1, 1.6, 0.08, matMarco, -0.95, yVentana, zVentana));    // izquierda
  cuarto.add(crearCaja(0.1, 1.6, 0.08, matMarco, 0.95, yVentana, zVentana));     // derecha
  cuarto.add(crearCaja(0.06, 1.4, 0.06, matMarco, 0, yVentana, zVentana));       // cruz vertical
  cuarto.add(crearCaja(1.8, 0.06, 0.06, matMarco, 0, yVentana, zVentana));       // cruz horizontal

  // ---------- LÁMPARA DE PIE (esquina derecha del fondo) ----------
  const xL = 6.2, zL = -4.2;
  cuarto.add(crearCaja(0.5, 0.05, 0.5, matMetal, xL, 0.025, zL)); // base
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2, 12), matMetal);
  poste.position.set(xL, 1.0, zL);
  poste.castShadow = true;
  cuarto.add(poste);
  const pantalla = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 0.45, 20), matPantalla);
  pantalla.position.set(xL, 2.15, zL);
  cuarto.add(pantalla);
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), matFoco);
  foco.position.set(xL, 2.1, zL);
  cuarto.add(foco);

  // ---------- ESTANTES EN LAS PAREDES (3 niveles) ----------
  // Fondo: cabezas, torsos, alas. Laterales: brazos (izq) y piernas (der) más anchos.
  // Tablas en y=1.0 / 1.7 / 2.4. Los pickups flotan ~0.38 encima (ver pickups.js).
  const matEstante = new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.8 });
  function crearEstante(anchoTablas: number): THREE.Group {
    const g = new THREE.Group();
    const fondoT = 0.5;
    const grosorT = 0.07;
    for (const y of [1.0, 1.7, 2.4]) {
      g.add(crearCaja(anchoTablas, grosorT, fondoT, matEstante, 0, y, 0));
    }
    for (const lado of [-1, 1]) {
      g.add(crearCaja(0.07, 1.8, fondoT, matEstante, lado * (anchoTablas / 2), 1.7, 0));
    }
    return g;
  }
  function etiquetaEstante(texto: string): THREE.Mesh {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#2b1b2e';
    ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, 256, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.34),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    return m;
  }
  COLISIONES.length = 0;
  function registrarColision(x: number, z: number, hx: number, hz: number): void {
    COLISIONES.push({ x, z, hx, hz });
  }
  // Fondo (pegados a la pared de atrás, z=-FONDO/2+0.4)
  const zFondo = -FONDO / 2 + 0.4;
  const estCabezas = crearEstante(3.2); estCabezas.position.set(-5, 0, zFondo); cuarto.add(estCabezas);
  const et1 = etiquetaEstante('CABEZAS'); et1.position.set(-5, 2.85, zFondo + 0.05); cuarto.add(et1);
  registrarColision(-5, zFondo, 1.7, 0.35);
  const estTorsos = crearEstante(3.2); estTorsos.position.set(-1.4, 0, zFondo); cuarto.add(estTorsos);
  const et2 = etiquetaEstante('TORSOS'); et2.position.set(-1.4, 2.85, zFondo + 0.05); cuarto.add(et2);
  registrarColision(-1.4, zFondo, 1.7, 0.35);
  const estAlas = crearEstante(2.4); estAlas.position.set(1.9, 0, zFondo); cuarto.add(estAlas);
  const et3 = etiquetaEstante('ALAS'); et3.position.set(1.9, 2.85, zFondo + 0.05); cuarto.add(et3);
  registrarColision(1.9, zFondo, 1.3, 0.35);
  // Laterales (girados 90°, pegados a x=±ANCHO/2)
  const xLat = ANCHO / 2 - 0.4;
  const estBrazos = crearEstante(4.6); estBrazos.rotation.y = Math.PI / 2; estBrazos.position.set(-xLat, 0, 0.5); cuarto.add(estBrazos);
  const et4 = etiquetaEstante('BRAZOS x2'); et4.rotation.y = Math.PI / 2; et4.position.set(-xLat + 0.05, 2.85, 0.5); cuarto.add(et4);
  registrarColision(-xLat, 0.5, 0.35, 2.4);
  const estPiernas = crearEstante(4.6); estPiernas.rotation.y = -Math.PI / 2; estPiernas.position.set(xLat, 0, 0.5); cuarto.add(estPiernas);
  const et5 = etiquetaEstante('PIERNAS x2'); et5.rotation.y = -Math.PI / 2; et5.position.set(xLat - 0.05, 2.85, 0.5); cuarto.add(et5);
  registrarColision(xLat, 0.5, 0.35, 2.4);
  registrarColision(xL, zL, 0.35, 0.35);

  // ---------- ESPEJO VESTIDOR (pared del fondo, hueco libre a la derecha) ----------
  // Marco de madera + superficie reflectante falsa (metal muy pulido).
  const xE = 5.0, zE = -FONDO / 2 + 0.15;
  cuarto.add(crearCaja(1.9, 2.5, 0.1, matMarco, xE, 1.5, zE));
  const espejo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xcfe8ff, metalness: 1.0, roughness: 0.06 })
  );
  espejo.position.set(xE, 1.5, zE + 0.06);
  cuarto.add(espejo);

  // ---------- LUCES ----------
  // 1) Luz cálida de la lámpara. PointLight = como una bombilla, ilumina en todas direcciones.
  //    Sin sombras a propósito: las sombras de PointLight son pesadas.
  //    Parámetros: color, intensidad, distancia máxima, decaimiento.
  const luzLampara = new THREE.PointLight(0xffb066, 30, 12, 2);
  luzLampara.position.set(xL, 2.0, zL);
  cuarto.add(luzLampara);

  // 2) Luz principal "de ventana": DirectionalLight es la única que hace sombras suaves aquí.
  const luzVentana = new THREE.DirectionalLight(0xfff0d8, 1.6);
  luzVentana.position.set(-2, 6, -2);
  luzVentana.target.position.set(0, 0, 0); // hacia dónde apunta
  luzVentana.castShadow = true;
  // Calidad de la sombra: más grande = más nítida pero más pesada. 1024 es un buen equilibrio.
  luzVentana.shadow.mapSize.set(1024, 1024);
  // Zona que cubre la sombra (la ajustamos al tamaño del cuarto para no desperdiciar resolución)
  const zona = 8;
  luzVentana.shadow.camera.left = -zona;
  luzVentana.shadow.camera.right = zona;
  luzVentana.shadow.camera.top = zona;
  luzVentana.shadow.camera.bottom = -zona;
  luzVentana.shadow.camera.near = 0.5;
  luzVentana.shadow.camera.far = 15;
  luzVentana.shadow.radius = 4;   // suaviza el borde de la sombra
  luzVentana.shadow.bias = -0.0005; // evita rayitas raras en las superficies
  cuarto.add(luzVentana);
  cuarto.add(luzVentana.target);

  // 3) Luz ambiental suave para que las zonas en sombra no queden negras.
  cuarto.add(new THREE.HemisphereLight(0xffeedd, 0x6b4a30, 0.5)); // color del techo, color del piso, intensidad

  // Guardamos la lámpara en "userData" (una cajita libre que tiene todo objeto de Three.js)
  // para que main.js pueda encenderla y apagarla.
  cuarto.userData.lampara = {
    luz: luzLampara,
    foco: foco,
    posicion: new THREE.Vector3(xL, 0, zL)
  };
  cuarto.userData.espejo = {
    posicion: new THREE.Vector3(xE, 0, zE + 0.6)
  };

  return cuarto;
}