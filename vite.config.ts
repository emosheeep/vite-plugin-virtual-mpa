import { defineConfig } from 'vite';
import { externals } from 'rollup-plugin-node-externals';

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...externals({
        deps: true,
        devDeps: true,
        peerDeps: true,
      }),
    },
  ],
  build: {
    minify: false,
    lib: {
      fileName: 'index',
      entry: 'index.ts',
      formats: ['es', 'cjs'],
    },
  },
});
