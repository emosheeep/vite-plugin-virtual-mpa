# vite-plugin-virtual-mpa

> Out-of-the-box MPA plugin for Vite, with html template engine and virtaul files support.

## Motivation

There are so many MPA plugins for vite on the market, but it seems no one can do both of below at the same time:
- Generate html virtual entry file using ejs for both serve and build command.
- Auto configuration for `rollupOptions.input` and history fallback.

## How It Works

- First, provide the virtual html entry file to the `rollupOptions.input`.
- Then, intercept the requests to it.
  - For DevServer, you can customize your fallback rewrite rules, it will return the virtual file
  - For build command, it will output the corresponding virtual file into `build.outDir`.


## Usage

```sh
pnpm add vite-plugin-virtual-mpa # or npm/yarn
```

```ts
// vite.config.ts
import { createMpaPlugin } from 'vite-plugin-virtual-mpa'

// @see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createMpaPlugin({
      pages: [
        // your configuration
      ]
    }),
  ],
})
```

## Options

```ts
interface MpaOptions {
  /**
   * whether to print log
   */
  verbose?: boolean,
  /**
   * default template file
   * @default index.html
   */
  template?: `${string}.html`,
  /**
   * Configure your rewrite rules, only proceed fallback html requests.
   * further: https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[],
  /**
   * your MPA core configurations
   */
  pages: Array<{
    /**
     * Required page name.
     */
    name: string;
    /**
     * Relative path to the output directory, which should end with .html
     * @default `${name}.html`
     */
    filename?: `${string}.html`;
    /**
     * Higher priority template file, which will overwrite the default template.
     */
    template?: string;
    /**
     * Entry file that will append to body. which you should remove from the html template file.
     */
    entry?: string;
    /**
     * Data to inject with ejs.
     */
    data?: Record<string, any>,
  }>
}
```
## Examples

```ts
// vite.config.ts
import { createMpaPlugin } from 'vite-plugin-virtual-mpa'

// @see https://vitejs.dev/config/
export default defineConfig({
  base: '/fruits/',
  build: {
    outDir: 'sites'
  },
  plugins: [
    createMpaPlugin({
      // This define the history fallback rewrite rules
      rewrites: [
        {
          from: /\/fruits\/(apple|banana|strawberries)/, 
          to: ctx => `/fruits/${ctx.match[1]}.html`
        },
      ],
      pages: [
        {
          name: 'apple',
          // filename is optional, default is apple.html, which will output into sites/apple.html
          filename: 'fruits/apple.html', // output into sites/fruits/apple.html
          data: {
            title: 'This is Apple page',
          },
        },
        {
          name: 'banana',
          filename: 'fruits/banana.html',
          data: {
            title: 'This is Banana page',
          },
        },
        {
          name: 'strawberries',
          filename: 'fruits/strawberries.html',
          data: {
            title: 'This is Strawberries page',
          },
        },
      ],
    }),
  ],
})
```

## Reference
- [vite-plugin-html](https://github.com/vbenjs/vite-plugin-html)
- [vite-plugin-mpa](https://github.com/IndexXuan/vite-plugin-mpa)
- [vite-plugin-virtual-html](https://github.com/windsonR/vite-plugin-virtual-html)