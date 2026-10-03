import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/games/rooftop-rush/embed/' : '/',
  plugins: [react()],
  server: { port: 5192, host: '127.0.0.1' },
  build: {
    outDir: '../../public/games/rooftop-rush/embed',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
}));
