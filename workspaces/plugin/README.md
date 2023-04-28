# vite-plugin-virtual-mpa ⚡

[![npm version](https://img.shields.io/npm/v/vite-plugin-virtual-mpa)](https://npmjs.com/package/vite-plugin-virtual-mpa)
[![awesome-vite](https://awesome.re/badge.svg)](https://github.com/vitejs/awesome-vite)
![weekly downloads](https://img.shields.io/npm/dw/vite-plugin-virtual-mpa)
![license](https://img.shields.io/npm/l/vite-plugin-virtual-mpa)
[![install size](https://packagephobia.com/badge?p=vite-plugin-virtual-mpa)](https://packagephobia.com/result?p=vite-plugin-virtual-mpa)
![publish](https://github.com/emosheeep/vite-plugin-virtual-mpa/actions/workflows/npm-publish.yml/badge.svg)

Out-of-box MPA plugin for Vite 📦, with html template engine and virtual files support, generate multiple files using only one template.

English | [中文](./README.zh_CN.md)

## Features

- 💡 EJS Template Capability
- 💡 Fully Typed APIs and Prompts, Tiny and Pretty.
- 🛠️ Customize the path of generated files, generate multiple files using only one template.
- 🛠️ MPA support and History Fallback API for both dev and preview server.

## Usage

```sh
pnpm add -D vite-plugin-virtual-mpa # or npm/yarn
```

```ts
// vite.config.ts
import { createMpaPlugin, createPages } from 'vite-plugin-virtual-mpa'

// @see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createMpaPlugin({
      pages: [
        /** 
         * You can write pages configuration here directly. 
         * Or use `createPages` function independently outside and then pass result to this field.
         */
      ]
    }),
  ],
})

/**
 * This function simply converts the arguments to an array and returns them.
 * It helps creating pages configuration with type hints independently outside plugin function.
 * It may also simplify your configurations because you can manage them uniformly somewhere.
 */
const pages = createPages([
  // You can pass a single page object or a pages array.
])

// @see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createMpaPlugin({
      pages,
    }),
  ],
})
```

## Motivation

When building **MPA(multi-page-applications)** with Vite, we usually need a plugin that:

1. Has a template engine such as EJS, which can use one template to generate multiple files, and can customize the path of the generated files at build time.

2. Auto configurations for `rollupOptions.input` and provide the ability to configure the development server's proxy (primarily the History Fallback API).

There are so many MPA plugins for vite on the market, but it seems no one can do both of above at the same time. I filtered the following plugins based on name matching and downloads: 

1. [vite-plugin-mpa](https://github.com/IndexXuan/vite-plugin-mpa): It can automatically configure the entry and provide the DevServer proxy configuration (history fallback), but we must adjust the directory structure according to the convention, and does not support template engines and virtual entry, and cannot define the path to generate files.

2. [vite-plugin-html-template](https://github.com/IndexXuan/vite-plugin-html-template): The author of this plugin is the same as vite-plugin-mpa, which is recommended by the author. It is primarily used in combination with the MPA plugin to provide template engine functionality, and also doesn't support virtual entry.

3. [vite-plugin-html](https://github.com/vbenjs/vite-plugin-html): It supports template engines only, but no virtual entry. You need to use multiple entry templates if you want to generate multiple files.

4. [vite-plugin-virtual-html](https://github.com/windsonR/vite-plugin-virtual-html): It supports virtual entry points, provides a rendering interface to customize template engines. But there's no built-in template engine, so it's a bit cumbersome to use.

Here, **"virtual entry"** means that multiple entry HTML files are rendered through only one template file.

They have their strengths, but they don't work very well. Either it needs to be used in conjunction or it is a significant change to the existing project structure. Sometimes I wonder if it is losing the advantage of template by implementing a template engine but requiring multiple template files.

This plugin is designed to solve these problems, and it has all of these capabilities at the same time. By combining virtual entry and template engine, users can generate different entry HTML with only one template, and can customize the output path of the entry file (no need to manually write scripts to move!). It also provides an interface to configure rewrite rules for the development server, so that the development can correctly request the entry file.

If your project is using Vite workflow and is an MPA application, you may want to give this plugin a try. It doesn't limit the technology stack, it doesn't matter if you use Vue or React or any other technologies.

## Options

```ts
type FilterPattern = string | RegExp | (string | RegExp)[]
interface WatchHandler {
  (ctx: {
    server: ViteDevServer,
    file: string,
    type: Event
    /**
     * You can update the pages configuration by calling this function.
     * @params pages Your MPA core configurations, which will replace default `pages` config
     */
    reloadPages: (pages: Page[]) => void
  }): void
}

interface MpaOptions {
  /**
   * whether to print log
   * @default true
   */
  verbose?: boolean,
  /**
   * default template file
   * @default index.html
   */
  template?: `${string}.html`,
  /**
   * Configure your rewrite rules, only proceed html requests.
   * @see https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[],
  /**
   * Configure your preview server's rewrite rules.
   * @see https://github.com/bripkens/connect-history-api-fallback
   */
  previewRewrites?: Rewrite[],
  /**
   * Use to scan directories that have similar structure to generate pages.
   * Detected pages will be appended to `pages` option, page with name existed will be ignored.
   */
  scanOptions?: {
    /**
     * Directory path to scan, subdirectory's name will be used as unique page name.
     */
    scanDirs: string | string[];
    /**
     * The entry file path relative to scanned dir.
     */
    entryFile?: string;
    /**
     * Customize the virtual file name(output filename).
     * @param name Subdirectory name
     */
    filename?: (name: string) => string;
  };
  /**
   * Sometimes you might want to reload `pages` config or restart ViteDevServer when
   * there are some files added, removed, changed and so on. You can set `watchOptions` to
   * customize your own logic.
   */
  watchOptions?: WatchHandler | {
    /**
     * Specifies the files to **include**, based on `Rollup.createFilter`
     * @see https://vitejs.dev/guide/api-plugin.html#filtering-include-exclude-pattern
     */
    include?: Exclude<FilterPattern, null>,
    /**
     * Specifies the files to **exclude**, based on `Rollup.createFilter`
     * @see https://vitejs.dev/guide/api-plugin.html#filtering-include-exclude-pattern
     */
    excluded?: Exclude<FilterPattern, null>,
    /**
     * File events you wanna deal with.
     * @default ['add', 'unlink', 'change', 'unlinkDir', 'addDir']
     */
    events?: Event[],
    /**
     * Execute your own logic when file events fired.
     */
    handler: WatchHandler
  },
  /**
   * your MPA core configurations
   */
  pages: Array<{
    /**
     * Required. Name is used to generate default rewrite rules, it just a common string and please don't include '/'.
     * You can use filename option not name option if you want to customize the path of generated files.
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
  }>,
  /**
   * Whether to minify html file. Powered by html-minify-terser.
   * @default false
   * @see https://github.com/terser/html-minifier-terser
   */
  htmlMinify?: Options | boolean,
}
```
## Examples

Click here [codesandbox](https://codesandbox.io/p/sandbox/vite-plugin-virtual-mpa-0djylc) for a quick preview!

```ts
// vite.config.ts
import { normalizePath } from "vite";
import { createMpaPlugin } from "vite-plugin-virtual-mpa"

const base = "/sites/"

// @see https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    createMpaPlugin({
      htmlMinify: false,
      pages: [
        {
          name: "apple",
          /**
           * filename is optional, default is `${name}.html`, which is the relative path of `build.outDir`.
           */
          filename: "fruits/apple.html", // output into sites/fruits/apple.html at build time.
          entry: "/src/fruits/apple/index.js",
          data: {
            title: "This is Apple page"
          }
        },
        {
          name: "banana",
          filename: "fruits/banana.html",
          entry: "/src/fruits/banana/index.js",
          data: {
            title: "This is Banana page"
          }
        },
        {
          name: "strawberries",
          filename: "fruits/strawberries.html",
          entry: "/src/fruits/strawberries/index.js",
          data: {
            title: "This is Strawberries page"
          }
        }
      ],
      /**
       * The following `scanOptions` configs can replace the `pages` above, but except data injection.
       */
      scanOptions: {
        scanDirs: 'src/fruits',
        entryFile: 'index.js',
        filename: name => `fruits/${name}.html`,
        template: '../../template.html',
      }
      /**
       * Customize the history fallback rewrite rules.
       * If you config your pages as above, this rewrite rules will be automatically generated.
       * Otherwise you should manually write it, which will overwrite the default.
       */
      rewrites: [
        {
          from: new RegExp(normalizePath(`/${base}/(apple|banana|strawberries)`)),
          to: (ctx) => normalizePath(`/fruits/${ctx.match[1]}.html`),
        }
      ],
      /**
       * Configure your preview server's rewrite rules.
       * This option is almost the same with `rewrites`.
       */
      previewRewrites: [
        // If there's no index.html, you need to manually set rules for history fallback like:
        { from: /.*/, to: '/home.html' },
      ]
    }),
  ],
})
```

## Default Rewrite Rules

As the examples above says 👆🏻, if you follow the conventions, this plugin will generate a default rule which will be applied to both dev and preview server, it looks like:

```ts
{
  from: new RegExp(normalizePath(`/${base}/(${Object.keys(inputMap).join('|')})`)),
  to: ctx => normalizePath(`/${base}/${inputMap[ctx.match[1]]}`),
}
```

Here, **inputMap** is a dictionary that map the name matched into the corresponding virtual entry file. The structure of the `inputMap` is as follows:

```ts
{
  apple: 'fruits/apple.html',
  banana: 'fruits/banana.html',
  strawberries: 'fruits/strawberries.html',
}
```

Request url `/sites/apple/xxx` will be processed by **Default Rewrite Rule**, and will be redirected to the corresponding fallback url `/fruits/apple.html`(name `'apple'` correspond to `'fruits/apple.html'`, the same goes for the rest ones), which is based on `viteConfig.base(here is '/sites/')`. So the final url will be `/sites/fruits/apple.html`.

##  About virtual entry files

Usually during development, our files are written locally, and we can access the local corresponding files through the URL through the DevServer proxy. The same is true for virtual files, except that the corresponding file is not written to the filesystem but is kept in memory.

The plugin generates virtual files using the template system, allowing you to **reach the in-memory virtual files** at development time and generate them in the corresponding directory at build time. 
 
It's perfectly okay to think that these virtual files are really exist, and it will help you build an intuition about them in your mind to be able to write your proxy configuration correctly.

## About EJS template engine

Except for the `data` provided in the page configuration, ENV variables that start with `'VITE_'` will be auto injected into the provided template. More information about `envprefix` can be found [here](https://vitejs.dev/config/shared-options.html#envprefix).