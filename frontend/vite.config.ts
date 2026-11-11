import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '..'),
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    proxy: {
      '/api': {
        target: 'https://akademia-pgmm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: { chunkSizeWarningLimit: 900 },
});
