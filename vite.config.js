// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // Redirige las solicitudes de API al servidor Express
    },
  },
});
