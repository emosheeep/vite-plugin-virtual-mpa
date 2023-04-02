import ejs from 'ejs';
import color from 'picocolors';
import fs from 'fs';
import path from 'path';
import history, { Rewrite } from 'connect-history-api-fallback';
import { name as pkgName } from '../package.json';
import type { MpaOptions, AllowedEvent, Page, WatchOptions } from './api-types';
import { type ResolvedConfig, type Plugin, normalizePath, createFilter, ViteDevServer } from 'vite';

const bodyInject = /<\/body>/;
const pluginName = color.cyan(pkgName);

function throwError(message) {
  throw new Error(`[${pluginName}]: ${color.red(message)}`);
}

export function createMpaPlugin<
  PN extends string,
  PFN extends string,
  PT extends string,
  Event extends AllowedEvent,
  TPL extends string,
>(
  config: MpaOptions<PN, PFN, PT, Event, TPL>,
): Plugin {
  const {
    template = 'index.html',
    verbose = true,
    pages,
    rewrites,
    previewRewrites,
    watchOptions,
  } = config;
  let resolvedConfig: ResolvedConfig;

  let inputMap: Record<string, string> = {};
  let virtualPageMap: Record<string, Page> = {};
  let tplSet: Set<string> = new Set();

  /**
   * Update pages configurations.
   */
  function configInit(pages: Page[]) {
    const tempInputMap: typeof inputMap = {};
    const tempVirtualPageMap: typeof virtualPageMap = {};
    const tempTplSet: typeof tplSet = new Set([template]);

    for (const page of pages) {
      const entryPath = page.filename || `${page.name}.html`;
      if (entryPath.startsWith('/')) throwError(`Make sure the path relative, received '${entryPath}'`);
      if (page.name.includes('/')) throwError(`Page name shouldn't include '/', received '${page.name}'`);
      if (page.entry && !page.entry.startsWith('/')) {
        throwError(
          `Entry must be an absolute path relative to the project root, received '${page.entry}'`,
        );
      }

      tempInputMap[page.name] = entryPath;
      tempVirtualPageMap[entryPath] = page;
      page.template && tempTplSet.add(page.template);
    }
    /**
     * Use new configurations instead of the old.
     */
    inputMap = tempInputMap;
    virtualPageMap = tempVirtualPageMap;
    tplSet = tempTplSet;
  }

  function useHistoryFallbackMiddleware(middlewares: ViteDevServer['middlewares'], rewrites: Rewrite[] = []) {
    middlewares.use(
      // @ts-ignore
      history({
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
        rewrites: rewrites.concat([
          {
            from: new RegExp(normalizePath(`/${resolvedConfig.base}/(${Object.keys(inputMap).join('|')})`)),
            to: ctx => {
              return normalizePath(`/${resolvedConfig.base}/${inputMap[ctx.match[1]]}`);
            },
          },
        ]),
      }),
    );

    // print rewriting log if verbose is true
    if (verbose) {
      middlewares.use((req, res, next) => {
        const { url, originalUrl } = req;
        if (originalUrl !== url) {
          console.log(
            `[${pluginName}]: Rewriting ${color.blue(originalUrl)} to ${color.blue(url)}`,
          );
        }
        next();
      });
    }
  }

  /**
   * Template file transform.
   */
  function ejsRender(fileContent: string, id?: string) {
    const page = id ? virtualPageMap[id] : null;

    try {
      return ejs.render(
        !page?.entry
          ? fileContent
          : fileContent.replace(
            bodyInject,
            `<script type="module" src="${normalizePath(
              `${page.entry}`,
            )}"></script>\n</body>`,
          ),
        // Variables injection
        { ...resolvedConfig.env, ...page?.data },
        // For error report
        { filename: id, root: resolvedConfig.root, async: false },
      );
    } catch (e) {
      return fileContent;
    }
  }

  return {
    name: pluginName,
    config({ clearScreen }) {
      configInit(config.pages); // Init

      return {
        appType: 'mpa',
        clearScreen: clearScreen ?? false,
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
      resolvedConfig = config;
      if (verbose) {
        const colorProcess = path => normalizePath(`${color.blue(`<${config.build.outDir}>/`)}${color.green(path)}`);
        const inputFiles = Object.values(inputMap).map(colorProcess);
        console.log(`[${pluginName}]: Generated virtual files: \n${inputFiles.join('\n')}`);
      }
    },
    /**
     * Get html according to page configurations.
     */
    load(id) {
      const page = virtualPageMap[id];
      if (!page) return null;
      return fs.readFileSync(page.template || template, 'utf-8');
    },
    transformIndexHtml: {
      enforce: 'pre',
      transform(html) {
        return ejsRender(html);
      },
    },
    configureServer(server) {
      const {
        config,
        watcher,
        middlewares,
        pluginContainer,
        transformIndexHtml,
      } = server;

      const base = normalizePath(`/${config.base || '/'}/`);

      if (watchOptions) {
        const {
          events,
          handler,
          include,
          excluded,
        } = typeof watchOptions === 'function'
          ? { handler: watchOptions } as WatchOptions<Event>
          : watchOptions;

        const isMatch = createFilter(include || /.*/, excluded);

        watcher.on('all', (type: Event, filename) => {
          if (events && !events.includes(type)) return;
          if (!isMatch(filename)) return;

          const file = path.relative(config.root, filename);

          verbose && console.log(
            `[${pluginName}]: ${color.green(`file ${type}`)} - ${color.dim(file)}`,
          );

          handler({
            type,
            file,
            server,
            reloadPages: configInit,
          });
        });
      }

      // Fully reload when template files change.
      watcher.on('change', file => {
        if (
          file.endsWith('.html') &&
          tplSet.has(path.relative(config.root, file))
        ) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      });

      // History fallback
      useHistoryFallbackMiddleware(middlewares, rewrites);

      // Handle html file redirected by history fallback.
      middlewares.use(async (req, res, next) => {
        const url = req.url;
        // filename in page configuration can't start with '/', because the key of inputMap is relative path.
        const fileName = url?.match(`${base}([^?]+)`)?.[1]; // clean url

        if (
          res.writableEnded ||
          !fileName ||
          !fileName.endsWith('.html') || // HTML Fallback Middleware appends '.html' to URLs
          !virtualPageMap[fileName]
        ) {
          return next(); // This allows vite handling unmatched paths.
        }

        /**
         * The following 2 lines fixed #12.
         * When using cypress for e2e testing, we should manually set response header and status code.
         * Otherwise, it causes cypress testing process of cross-entry-page jumping hanging, which results in a timeout error.
         */
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;

        // load file
        let loadResult = await pluginContainer.load(fileName);
        if (!loadResult) {
          throw new Error(`Failed to load url ${fileName}`);
        }
        loadResult = typeof loadResult === 'string'
          ? loadResult
          : loadResult.code;

        res.end(
          await transformIndexHtml(
            url,
            ejsRender(loadResult, fileName),
            req.originalUrl,
          ),
        );
      });
    },
    configurePreviewServer(server) {
      // History Fallback
      useHistoryFallbackMiddleware(server.middlewares, previewRewrites);
    },
  };
}

// // This is for type declaration testing.
// /* @__PURE__ */createMpaPlugin({
//   template: 'na.html',
//   watchOptions: {
//     include: [],
//     events: ['unlink', 'change'],
//     handler(ctx) {
//       ctx.type;
//       ctx.reloadPages([
//         {
//           name: '123',
//           filename: '////av.abv.v.html.html',
//           template: 'a.b.v',
//         },
//       ]);
//     },
//   },
//   pages: [
//     {
//       name: '123',
//       filename: '////av.abv.v.html.html',
//       template: 'a.b.v',
//     },
//   ],
// });
