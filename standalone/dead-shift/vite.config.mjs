import { defineConfig } from 'vite';
export default defineConfig({base:'./',resolve:{dedupe:['react','react-dom','three']},server:{port:5186,strictPort:false,host:'127.0.0.1'},preview:{port:5187,strictPort:false,host:'127.0.0.1'},build:{chunkSizeWarningLimit:1200}});
