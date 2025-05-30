import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/ArkhamDentalPro/', // 🔥 Isso é CRUCIAL para GitHub Pages!
  build: {
    outDir: 'docs', // Build na pasta docs/ no nível superior
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true, // Permite acesso externo
    allowedHosts: ['5173-i5153qq5abti9phokyudk-cd8c5332.manusvm.computer'] // Adiciona o host público permitido
  }
});
