import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-melhor-envio': {
        target: 'https://sandbox.melhorenvio.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-melhor-envio/, '/api/v2'),
        secure: false,
        headers: {
          'User-Agent': 'Vite-React-App'
        }
      }
    }
  }
});