import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const STATIC = process.env.VITE_STATIC === '1';

export default defineConfig({
  plugins: [react()],
  base: STATIC ? './' : '/',
  build: STATIC ? { cssCodeSplit: false, assetsInlineLimit: 100_000_000, rollupOptions: { output: { inlineDynamicImports: true } } } : {},
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8787' } },
});
