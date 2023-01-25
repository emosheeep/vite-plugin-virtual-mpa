import ejs from 'ejs';
import color from 'picocolors';
import fs from 'fs';
import path from 'path';
import history from 'connect-history-api-fallback';
import { name as pkgName } from '../package.json';
import { Plugin, normalizePath, createFilter, type ResolvedConfig } from 'vite';
import { MpaOptions, AllowedEvent, Page, WatchOptions } from './api-types';
import MagicString from 'magic-string';

const bodyInject = /<\/body>/;
const pluginName = color.cyan(pkgName);

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
    watchOptions,
  } = config;
  let resolvedConfig: ResolvedConfig;

  let inputMap: Record<string, string> = {};
  let virtualPageMap: Record<string, Page> = {};

  /**
   * Update pages configurations.
   */
  function configInit(pages: Page[]) {
    const [tempInputMap, tempVirtualPageMap]: [typeof inputMap, typeof virtualPageMap] = [{}, {}];
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
      tempInputMap[page.name] = entryPath;
      tempVirtualPageMap[entryPath] = page;
    }
    /**
     * Use new configurations instead of the old.
     */
    inputMap = tempInputMap;
    virtualPageMap = tempVirtualPageMap;
  }

  /**
   * Template file transform.
   */
  function transform(fileContent, id) {
    const page = virtualPageMap[id];
    if (!page) return null;

    const ms = new MagicString(
      ejs.render(
        !page.entry
          ? fileContent
          : fileContent.replace(
            bodyInject,
            `<script type="module" src="${normalizePath(
              `${page.entry}`,
            )}"></script>\n</body>`,
          ),
        // Variables injection
        { ...resolvedConfig.env, ...page.data },
        // For error report
        { filename: id, root: resolvedConfig.root },
      ),
    );

    return {
      code: ms.toString(),
      /**
       * You should provide sourcemap as long as you made some modifications,
       * otherwise it probably cause some warnings. Fix #12.
       */
      map: ms.generateMap({
        source: id,
      }),
    };
  }

  return {
    name: pluginName,
    config() {
      configInit(config.pages); // Init

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
      resolvedConfig = config;
      if (verbose) {
        const colorProcess = path => normalizePath(`<${color.blue(config.build.outDir)}>/${color.green(path)}`);
        const inputFiles = Object.values(inputMap).map(colorProcess);
        console.log(`[${pluginName}]: Generated virtual files: \n${inputFiles.join('\n')}`);
      }
    },
    /**
     * Intercept html requests.
     */
    resolveId(id, importer, options) {
      if (options.isEntry && virtualPageMap[id]) {
        return id;
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
    transform,
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
            `[${pluginName}]: ${color.blue(type)} - ${color.blue(file)}`,
          );

          handler({
            type,
            file,
            server,
            reloadPages: configInit,
          });
        });
      }

      middlewares.use(
        // @ts-ignore
        history({
          htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          rewrites: (rewrites || []).concat([
            {
              from: new RegExp(normalizePath(`/${base}/(${Object.keys(inputMap).join('|')})`)),
              to: ctx => normalizePath(`/${inputMap[ctx.match[1]]}`),
            },
            {
              from: /.*/,
              to: ctx => {
                const { parsedUrl: { pathname } } = ctx;
                return normalizePath(pathname?.endsWith('.html') ? pathname : `${pathname}/index.html`);
              },
            },
          ]),
        }),
      );

      middlewares.use(async (req, res, next) => {
        const accept = req.headers.accept;
        const url = req.url!;

        // Ignore request that are not html.
        if (
          res.writableEnded ||
          accept === '*/*' ||
          !accept?.includes('text/html')
        ) {
          return next();
        }

        // Uniform the request url, allows visiting files directly.
        const rewritten = url.startsWith(base) ? url : normalizePath(`/${base}/${url}`);
        const fileName = rewritten.replace(base, ''); // filename in page configuration can't start with '/', because the key of inputMap is relative path.

        // print rewriting log if verbose is true
        if (verbose && req.originalUrl !== url) {
          console.log(
            `[${pluginName}]: Rewriting ${color.blue(req.originalUrl)} to ${color.blue(rewritten)}`,
          );
        }

        if (!virtualPageMap[fileName]) {
          return next(); // This allows vite handling unmatched paths.
        }

        /**
         * The following 2 lines fixed #12.
         * When using cypress for e2e testing, we should manually set response header and status code.
         * Otherwise, it causes cypress testing process of cross-entry-page jumping hanging, which results in a timeout error.
         * @see https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/12
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

        // transform and response
        const transformedResult = transform(loadResult, fileName);
        res.end(
          await transformIndexHtml(
            url,
            transformedResult
              ? transformedResult.code
              : loadResult, // No transform applied, keep code as-is,
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
