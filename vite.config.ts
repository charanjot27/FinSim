import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        builder: fileURLToPath(new URL('./builder.html', import.meta.url)),
        demo: fileURLToPath(new URL('./demo.html', import.meta.url)),
        leaderboard: fileURLToPath(new URL('./leaderboard.html', import.meta.url)),
        product: fileURLToPath(new URL('./product.html', import.meta.url)),
      },
    },
  }
});
