import { defineConfig } from 'vite';
import { externals } from 'rollup-plugin-node-externals';
import viteChecker from 'vite-plugin-checker';

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
    viteChecker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint . --ext .js,.ts',
      },
    }),
  ],
  build: {
    minify: false,
    lib: {
      fileName: 'index',
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
    },
  },
});
