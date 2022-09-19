import { name as pluginName } from './package.json';
import { Plugin, ResolvedConfig, normalizePath } from 'vite';
import { readFileSync } from 'fs';
import ejs from 'ejs';
import history, { Rewrite } from 'connect-history-api-fallback';

const bodyInject = /<\/body>/;

interface Page {
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
  template?: `${string}.html`;
  /**
   * Entry file that will append to body. which you should remove from the html template file.
   */
  entry?: string;
  /**
   * Data to inject with ejs.
   */
  data?: Record<string, any>,
}

export interface MpaOptions {
  /**
   * whether to print log
   * @default true
   */
  verbose?: boolean,
  /**
   * default template file
   * @default index.html
   */
  template?: `${string}.html`;
  /**
   * Configure your rewrite rules, only proceed fallback html requests.
   * further: https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[],
  /**
   * your MPA core configurations
   */
  pages: Array<Page>
}

export function createMpaPlugin(config: MpaOptions): Plugin {
  const {
    template = 'index.html',
    verbose = true,
    pages,
    rewrites,
  } = config;

  const input: Record<string, string> = {};
  const pageMap: Record<string, Page> = {};

  for (const page of pages) {
    const entryPath = page.filename || `${page.name}.html`;
    input[page.name] = entryPath;
    pageMap[entryPath] = page;
  }

  /**
   * 模板文件处理
   */
  function transform(fileContent, id) {
    const page = pageMap[id];
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
        build: {
          rollupOptions: {
            input,
          },
        },
      };
    },
    configResolved(config) {
      userConfig = config;
    },
    /**
     * 拦截html请求
     */
    resolveId(id, importer, options) {
      if (options.isEntry && pageMap[id]) {
        return id;
      }
    },
    /**
     * 根据配置映射html文件
     */
    load(id) {
      const page = pageMap[id];
      if (!page) return null;
      return readFileSync(page.template || template, 'utf-8');
    },
    transform,
    buildStart() {
      verbose && console.log(
        `[${pluginName}]: Generated virtual files `,
        input,
      );
    },
    configureServer({ middlewares, pluginContainer, transformIndexHtml }) {
      const { base = '/' } = userConfig;

      middlewares.use(
        // @ts-ignore
        history({
          htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          rewrites: rewrites || [
            {
              from: new RegExp(
                normalizePath(`/${base}/(${Object.keys(input).join('|')})`),
              ),
              to: ctx => {
                const rewritten = normalizePath(`/${base}/${input[ctx.match[1]]}`);
                verbose && console.log(
                  `[${pluginName}]: Hit default history fallback rule, rewriting ${ctx.parsedUrl.pathname} to ${rewritten}`,
                );
                return rewritten;
              },
            },
          ],
        }),
      );

      middlewares.use(async (req, res, next) => {
        const accept = req.headers.accept;
        // 忽略非入口html请求
        if (
          res.writableEnded ||
          accept === '*/*' ||
          !accept?.includes('text/html')
        ) {
          return next();
        }

        const relativePath = req.url!.replace(normalizePath(`/${base}/`), '');

        if (!pageMap[relativePath]) {
          const filePath = normalizePath(`/${base}/${relativePath}`);
          res.statusCode = 404;
          res.write(`[${pluginName}]: Missing corresponding file '${filePath}'`);
          res.end();
          return;
        }

        res.end(
          await transformIndexHtml(
            req.originalUrl!,
            transform(
              await pluginContainer.load(relativePath) as string,
              relativePath,
            ),
          ),
        );
      });
    },
  };
}
