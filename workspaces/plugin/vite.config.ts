import { defineConfig } from 'vite';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import viteChecker from 'vite-plugin-checker';
import dtsPlugin from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    externalizeDeps(),
    dtsPlugin({ skipDiagnostics: true }),
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
