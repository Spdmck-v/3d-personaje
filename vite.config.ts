import { defineConfig } from 'vite';

// `base: './'` permite desplegar en GitHub Pages (subruta /nombre-repo/) sin romper rutas.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 700 },
  test: { environment: 'node' }
});
