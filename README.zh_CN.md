# vite-plugin-virtual-mpa

> 开箱即用的 Vite MPA插件，支持HTML模板引擎和虚拟文件功能，能够使用一份模板生成多个文件。

[English](./README.md) | 中文

## 主要功能

- EJS 模板渲染
- 多页面应用支持，开发时提供history fallback能力.
- 自定义模板HTML文件的输出路径, 使用一份模板生成多份文件

## 插件对比

使用vite开发构建 **多页面应用(MPA)** 的时候，我们通常需要一个具备以下能力的插件：

1. 具备模板引擎如ejs，能够使用一个模板生成多份文件，且能自定义构建时生成文件的路径。

2. 自动配置 `rollupOptions.input`，并提供能力配置开发服务器的代理（主要是history fallback api）。

市面上有非常多的关于vite的MPA插件，但他们却几乎没有能同时做到以上两点的。根据名称匹配度和下载量，我筛选到以下插件:

1. [vite-plugin-mpa](https://github.com/IndexXuan/vite-plugin-mpa)：可以自动配置入口，并提供开发服务器代理配置入口（fallback rule），但必须按照约定调整目录结构，且不支持模板引擎和虚拟入口，也无法定义生成文件的路径。

2. [vite-plugin-html-template](https://github.com/IndexXuan/vite-plugin-html-template)：这个插件的作者和vite-plugin-mpa是同一个人，算是作者推荐的配套插件，主要是和mpa插件组合使用以提供模板引擎功能，同样不支持虚拟入口。

3. [vite-plugin-html](https://github.com/vbenjs/vite-plugin-html)：只支持模板引擎，且不支持虚拟入口。

4. [vite-plugin-virtual-html](https://github.com/windsonR/vite-plugin-virtual-html)：支持虚拟入口，提供了渲染接口，可以定制模板引擎。但没有内置模板引擎，用起来有点麻烦还是。

其中，**"虚拟入口"** 的意思是，通过一个模板文件，渲染出多个入口html文件。

其他插件大同小异，他们各有所长，但用起来总不趁手。要么需要搭配使用，要么对现有项目结构的改动较多。有时候我也好奇，既然实现了模板引擎，却又需要多个模板文件，这样做岂不是失去了模板的优势。

而这个插件便是为了解决这些问题，它同时具备上面提到的所有能力。通过结合虚拟入口和模板引擎，使得用户只需要一份模板就可以生成不同的入口html，且能自定义入口文件的输出路径（再也不用手动写脚本移动了！）。同时也提供了接口为开发服务器配置rewrite rules，以便开发时能够正确地请求到入口文件。

如果你的项目正在使用vite工作流且为MPA应用，不妨尝试一下这个插件，它不限制技术栈，与你是否使用vue还是react或其他技术无关。

## 使用方式

```sh
pnpm add -D vite-plugin-virtual-mpa # or npm/yarn
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
   * 是否在控制台打印log
   * @default true
   */
  verbose?: boolean,
  /**
   * 默认模板文件
   * @default index.html
   */
  template?: `${string}.html`,
  /**
   * 配置fallback rewrite rules，只会处理accept=text/html的文件请求
   * 详见: https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[],
  pages: Array<{
    /**
     * 页面标识，必填
     */
    name: string;
    /**
     * 相对于`build.outDir`的路径，应该以html结尾
     * @default `${name}.html`
     */
    filename?: `${string}.html`;
    /**
     * 更高优先级的模板文件，将会覆盖默认模板
     */
    template?: string;
    /**
     * 自动注入入口文件，如果设置了entry，需要移除模板文件中的entry
     */
    entry?: string;
    /**
     * 注入到模板文件的数据
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
      // 开发阶段(vite serve)自定义 history fallback rewrite rules
      rewrites: [
        {
          from: /\/fruits\/(apple|banana|strawberries)/, 
          to: ctx => `/fruits/${ctx.match[1]}.html`
        },
      ],
      pages: [
        {
          name: 'apple',
          // 可选的文件名配置，默认是 name + '.html',
          filename: 'fruits/apple.html', // 最终会以相对路径生成在output目录（sites）—— sites/fruits/apple.html
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
