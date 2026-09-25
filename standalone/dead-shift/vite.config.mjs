import { defineConfig } from 'vite';
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/games/dead-shift/embed/' : '/',
  resolve: { dedupe: ['react', 'react-dom', 'three'] },
  server: { port: 5186, strictPort: false, host: '127.0.0.1' },
  preview: { port: 5187, strictPort: false, host: '127.0.0.1' },
  build: {
    outDir: '../../public/games/dead-shift/embed',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
}));
