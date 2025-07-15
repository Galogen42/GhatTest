import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: __dirname,
  // Serve static assets from the repository root "public" directory
  publicDir: path.resolve(__dirname, '../../public'),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
});
