// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://44.213.153.17:3000', // Redirige las solicitudes de API al servidor Express
    },
  },
});
