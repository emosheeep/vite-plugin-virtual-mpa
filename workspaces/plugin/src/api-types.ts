import type { FilterPattern, ViteDevServer } from 'vite';
import type { Rewrite } from 'connect-history-api-fallback';
import type { Options } from 'html-minifier-terser';

export type AllowedEvent = 'add' | 'unlink' | 'change' | 'unlinkDir' | 'addDir';

export type TplStr<T extends string> =
  T extends `/${infer P}`
    ? TplStr<P>
    : T extends `${infer Q}.html`
      ? TplStr<Q>
      : `${T}.html`;

export interface Page<
  Name extends string = string,
  Filename extends string = string,
  Tpl extends string = string,
> {
  /**
   * Required. Name is used to generate default rewrite rules, it just a common string and please don't include '/'.
   * You can use filename option not name option if you want to customize the path of generated files.
   */
  name: Name extends `${string}/${string}` ? never : Name;
  /**
   * Relative path to the output directory, which should end with .html and not startWith '/'
   * @default `${name}.html`
   */
  filename?: TplStr<Filename>
  /**
   * **Higher priority template file**, which will overwrite the default template.
   */
  template?: TplStr<Tpl>
  /**
   * Entry file that will append to body, which you should remove from the html template file.
   * It must always start with `'/'` which represents your project root directory.
   */
  entry?: `/${string}`
  /**
   * Data to inject with ejs.
   */
  data?: Record<string, any>
}

export type WatchHandler<Event extends AllowedEvent = AllowedEvent> = (
  ctx: {
    server: ViteDevServer,
    file: string,
    type: Event
    /**
     * You can update the pages configuration by calling this function.
     * @params pages Your MPA core configurations, which will replace default `pages` config
     */
    reloadPages: <
      PN extends string,
      PFN extends string,
      PT extends string,
    >(pages: Page<PN, PFN, PT>[]) => void
  }
) => void;

export interface WatchOptions<Event extends AllowedEvent = AllowedEvent>{
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
  handler: WatchHandler<Event>
}

export interface ScanOptions {
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
}

export interface MpaOptions<
  PageName extends string,
  PageFilename extends string,
  PageTpl extends string,
  Event extends AllowedEvent,
  DefTpl extends string,
> {
  /**
   * Whether to print log.
   * @default true
   */
  verbose?: boolean;
  /**
   * Default template file.
   * @default index.html
   */
  template?: TplStr<DefTpl>;
  /**
   * Configure your dev server's rewrite rules, only proceed fallback html requests.
   * @see https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[];
  /**
   * Configure your preview server's rewrite rules.
   * @see https://github.com/bripkens/connect-history-api-fallback
   */
  previewRewrites?: Rewrite[];
  /**
   * Sometimes you might want to reload `pages` config or restart ViteDevServer when
   * there are some files added, removed, changed and so on. You can set `watchOptions` to
   * customize your own logic.
   */
  watchOptions?: WatchHandler<Event> | WatchOptions<Event>;
  /**
   * Your MPA core configurations, you can write directly or use `createPages` function independently outside and then pass it to this field.
   */
  pages?: Page<PageName, PageFilename, PageTpl>[];
  /**
   * Use to scan directories that have similar structure to generate pages.
   * Detected pages will be appended to `pages` option, page with name existed will be ignored.
   */
  scanOptions?: ScanOptions;
  /**
   * Whether to minify html file. Powered by [html-minify-terser](https://github.com/terser/html-minifier-terser).
   * @default false
   */
  htmlMinify?: Options | boolean;
}
