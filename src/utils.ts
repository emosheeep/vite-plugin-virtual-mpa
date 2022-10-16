import { FilterPattern, ViteDevServer } from 'vite';
import { Rewrite } from 'connect-history-api-fallback';

export const AllowedEvents = ['add', 'unlink', 'change', 'unlinkDir', 'addDir'] as const;
export type AllowedEvent = (typeof AllowedEvents)[number];

type TplStr<T extends string> =
  T extends `/${infer P}`
    ? TplStr<P>
    : T extends `${infer Q}.html`
      ? TplStr<Q>
      : `${T}.html`;

export interface Page<
  Name extends string,
  Filename extends string,
  Tpl extends string,
> {
  /**
   * Required. Name is used to generate default rewrite rules, it just a common string and please don't include '/'.
   * You can use filename option not name option if you want to customize the path of generated files.
   */
  name: Name extends `${string}/${string}` ? never : Name;
  /**
   * Relative path to the output directory, which should end with .html
   * @default `${name}.html`
   */
  filename?: TplStr<Filename>
  /**
   * Higher priority template file, which will overwrite the default template.
   */
  template?: TplStr<Tpl>
  /**
   * Entry file that will append to body, which you should remove from the html template file.
   */
  entry?: `/${string}`
  /**
   * Data to inject with ejs.
   */
  data?: Record<string, any>
}

type WatchHandler<
  PN extends string,
  PFN extends string,
  PT extends string,
  Event extends AllowedEvent,
> = (
  ctx: {
    server: ViteDevServer,
    file: string,
    type: Event
    reloadPages: (pages: Page<PN, PFN, PT>[]) => void
  }
) => void;

export interface WatchOptions<
  PN extends string,
  PFN extends string,
  PT extends string,
  Event extends AllowedEvent,
>{
  include?: Exclude<FilterPattern, null>,
  excluded?: Exclude<FilterPattern, null>,
  events?: Event[],
  handler: WatchHandler<PN, PFN, PT, Event>
}

export interface MpaOptions<
  PN extends string,
  PFN extends string,
  PT extends string,
  PN1 extends string,
  PFN1 extends string,
  PT1 extends string,
  Event extends AllowedEvent,
  TPL extends string,
> {
  /**
   * whether to print log
   * @default true
   */
  verbose?: boolean
  /**
   * default template file
   * @default index.html
   */
  template?: TplStr<TPL>
  /**
   * Configure your rewrite rules, only proceed fallback html requests.
   * see: https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[]
  /**
   * Sometimes you might want to update the `pages` configuration or take some other measures when
   * there are some files added, removed, changed and so on.
   * You can set `watchOptions` and customize `handler` to handling this.
   *
   * The `include` and `exclude` based on `Rollup.createFilter`, see https://vitejs.dev/guide/api-plugin.html#filtering-include-exclude-pattern
   */
  watchOptions?: WatchHandler<PN1, PFN1, PT1, Event> | WatchOptions<PN1, PFN1, PT1, Event>,
  /**
   * Your MPA core configurations
   */
  pages: Page<PN, PFN, PT>[]
}
