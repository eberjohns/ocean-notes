import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ocean-notes/',
  publicDir: 'public',
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/three')) {
            return 'three';
          }
        }
      }
    }
  }
});

