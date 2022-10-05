import { name as pluginName } from './package.json';
import { Plugin, ResolvedConfig, normalizePath } from 'vite';
import { readFileSync } from 'fs';
import history, { Rewrite } from 'connect-history-api-fallback';
import color from 'cli-color';
import ejs from 'ejs';

const bodyInject = /<\/body>/;
const issuePath = color.blue('https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/new');

type TplStr<T extends string> = T extends `/${infer P}` ? TplStr<P> : T extends `${infer Q}.html` ? TplStr<Q> : `${T}.html`

interface Page<Name extends string, Filename extends string, Tpl extends string> {
  /**
   * Required. Name is used to generate default rewrite rules, it just a common string and please don't include '/'.
   * You can use filename option not name option if you want to customize the path of generated files.
   */
  name: Name extends `${string}/${string}` ? never : Name;
  /**
   * Relative path to the output directory, which should end with .html
   * @default `${name}.html`
   */
  filename?: TplStr<Filename>;
  /**
   * Higher priority template file, which will overwrite the default template.
   */
  template?: TplStr<Tpl>;
  /**
   * Entry file that will append to body. which you should remove from the html template file.
   */
  entry?: `/${string}`;
  /**
   * Data to inject with ejs.
   */
  data?: Record<string, any>,
}

export interface MpaOptions<T extends string, T1 extends string, T2 extends string, T3 extends string> {
  /**
   * whether to print log
   * @default true
   */
  verbose?: boolean,
  /**
   * default template file
   * @default index.html
   */
  template?: TplStr<T>,
  /**
   * Configure your rewrite rules, only proceed fallback html requests.
   * further: https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[],
  /**
   * your MPA core configurations
   */
  pages: Array<Page<T1, T2, T3>>
}

export function createMpaPlugin<
  T extends string,
  T1 extends string,
  T2 extends string,
  T3 extends string,
>(
  config: MpaOptions<T, T1, T2, T3>,
): Plugin {
  const {
    template = 'index.html',
    verbose = true,
    pages,
    rewrites,
  } = config;

  const inputMap: Record<string, string> = {};
  const virtualPageMap: Record<string, Page<T1, T2, T3>> = {};

  for (const page of pages) {
    const entryPath = page.filename || `${page.name}.html`;
    if (entryPath.startsWith('/')) {
      throw new Error(`[${pluginName}]: Make sure the path relative, received '${entryPath}'`);
    }
    if (page.name.includes('/')) {
      throw new Error(`[${pluginName}]: Page name shouldn't include '/', received '${page.name}'`);
    }
    if (page.entry && !page.entry.startsWith('/')) {
      throw new Error(`[${pluginName}]: Entry must be an absolute path relative to the project root, received '${page.name}'`);
    }
    virtualPageMap[entryPath] = page;
    inputMap[page.name] = entryPath;
  }

  /**
   * 模板文件处理
   */
  function transform(fileContent, id) {
    const page = virtualPageMap[id];
    if (!page) return fileContent;

    return ejs.render(
      !page.entry
        ? fileContent
        : fileContent.replace(
          bodyInject,
          `<script type="module" src="${normalizePath(
            `${page.entry}`,
          )}"></script>\n</body>`,
        ),
      page.data,
    );
  }

  let userConfig: ResolvedConfig;
  return {
    name: pluginName,
    config() {
      return {
        appType: 'mpa',
        clearScreen: false,
        optimizeDeps: {
          entries: pages
            .map(v => v.entry)
            .filter(v => !!v) as string[],
        },
        build: {
          rollupOptions: {
            input: inputMap,
          },
        },
      };
    },
    configResolved(config) {
      userConfig = config;
      if (verbose) {
        const colorProcess = path => normalizePath(`<${color.blue(config.build.outDir)}>/${color.green(path)}`);
        const inputFiles = Object.values(inputMap).map(colorProcess);
        console.log(`[${pluginName}]: Generated virtual files: \n${inputFiles.join('\n')}`);
      }
    },
    /**
     * 拦截html请求
     */
    resolveId(id, importer, options) {
      if (options.isEntry && virtualPageMap[id]) {
        return id;
      }
    },
    /**
     * 根据配置映射html文件
     */
    load(id) {
      const page = virtualPageMap[id];
      if (!page) return null;
      return readFileSync(page.template || template, 'utf-8');
    },
    transform,
    configureServer({ middlewares, pluginContainer, transformIndexHtml }) {
      let { base = '/' } = userConfig;
      base = normalizePath(`/${base}/`);

      middlewares.use(
        // @ts-ignore
        history({
          htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          rewrites: (rewrites || []).concat([
            {
              from: new RegExp(normalizePath(`/${base}/(${Object.keys(inputMap).join('|')})`)),
              to: ctx => normalizePath(`/${inputMap[ctx.match[1]]}`),
            },
          ]),
        }),
      );

      middlewares.use(async (req, res, next) => {
        const accept = req.headers.accept;
        const url = req.url!;

        // 忽略非入口html请求
        if (
          res.writableEnded ||
          accept === '*/*' ||
          !accept?.includes('text/html')
        ) {
          return next();
        }

        // 统一路径，允许直接通过url访问虚拟文件
        const rewritten = url.startsWith(base) ? url : normalizePath(`/${base}/${url}`);
        const fileName = rewritten.replace(base, ''); // 文件名不能以'/'开头，否则无法对应到inputMap，因为inputMap的键是相对路径

        if (verbose && req.originalUrl !== url) {
          console.log(
            `[${pluginName}]: Rewriting ${color.blue(req.originalUrl)} to ${color.blue(rewritten)}`,
          );
        }

        if (!virtualPageMap[fileName]) {
          if (fileName.startsWith('/')) {
            console.log(
              `[${pluginName}]: ${color.red(`filename shouldn't startsWith '/', but received '${fileName}', which may be a bug`)}.`,
              `Please report it at ${issuePath}, thanks!`,
            );
          }
          res.write(`[${pluginName}]: Missing corresponding entry file '${rewritten}', please check your rewrite rules!`);
          res.end();
          return;
        }

        res.end(
          await transformIndexHtml(
            url,
            transform(
              await pluginContainer.load(fileName) as string,
              fileName,
            ),
            req.originalUrl,
          ),
        );
      });
    },
  };
}

// // This is for type declaration testing.
// /* @__PURE__ */createMpaPlugin({
//   template: 'na.html',
//   pages: [
//     {
//       name: '123',
//       filename: '////av.abv.v.html.html',
//       template: 'a.b.v',
//     },
//   ],
// });
