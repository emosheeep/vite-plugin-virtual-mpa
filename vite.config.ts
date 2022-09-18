import { defineConfig } from 'vite';
import { dependencies } from './package.json';

export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      external: [
        ...Object.keys(dependencies),
        'fs',
      ],
    },
    lib: {
      fileName: 'index',
      entry: 'index.ts',
      formats: ['es', 'cjs'],
    },
  },
});
