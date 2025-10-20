import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { createMpaPlugin, createPages } from '../src/index';

const base = '/'; // You can change whatever you want

const pages = createPages([
  {
    name: 'apple',
    /**
     * filename is optional, default is `${name}.html`, which is the relative path of `build.outDir`.
     */
    filename: 'fruits/apple.html', // output into sites/fruits/apple.html at build time.
    entry: '/src/pages/apple/index.js',
    data: {
      title: 'This is Apple page',
    },
  },
  {
    name: 'banana',
    filename: 'fruits/banana.html',
    entry: '/src/pages/banana/index.js',
    data: {
      title: 'This is Banana page',
    },
  },
  {
    name: 'strawberries',
    filename: 'fruits/strawberries.html',
    entry: '/src/pages/strawberries/index.js',
    data: {
      title: 'This is Strawberries page',
    },
  },
  {
    name: 'home',
    filename: 'index.html',
    entry: '/src/pages/home/index.js',
    data: {
      title: 'This is Home page',
    },
  },
  {
    name: 'some-test-url',
    filename: 'index.html',
    entry: '/src/pages/home/index.js',
    data: {
      title: 'This is Home page',
    },
  },
]);

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    vue(),
    vueJsx(),
    createMpaPlugin({
      template: 'src/template.html',
      pages,
      transformHtml(html, ctx) {
        return {
          html,
          tags: [
            {
              tag: 'div',
              injectTo: 'body-prepend',
              children: `[Auto Injected] Page name: ${ctx.page.name}`,
            },
          ],
        };
      },
    }),
  ],
  build: { sourcemap: true },
  server: { port: 5173, open: true },
  preview: { port: 5173 },
  optimizeDeps: { force: true },
  resolve: { alias: { '@': path.resolve('src') } },
});
