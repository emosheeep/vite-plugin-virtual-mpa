import type { Page, ScanOptions } from './api-types';
import path from 'path';
import fs from 'fs';

/**
 * Replace slash and backslash with single slash.
 * This uses for cross-platform path parsing.
 */
export function replaceSlash<T extends string | undefined | null>(
  str: T,
): T extends string ? string : T extends undefined | null ? T : never;
export function replaceSlash(str: any) {
  return str?.replaceAll(/[\\/]+/g, '/');
}

/**
 * This function simply converts the arguments to an array and returns them.
 * It helps creating pages configuration with type hints independently outside plugin function.
 */
export function createPages<
  Name extends string,
  Filename extends string,
  Tpl extends string,
>(pages: Page<Name, Filename, Tpl> | Page<Name, Filename, Tpl>[]) {
  return Array.isArray(pages) ? pages : [pages];
}

/**
 * Generate pages configurations using scanOptions.
 */
export function scanPages(scanOptions?: ScanOptions) {
  const { filename, entryFile, scanDirs, template } =
    scanOptions || ({} as ScanOptions);
  const pages: Page[] = [];

  for (const entryDir of [scanDirs].flat().filter(Boolean)) {
    for (const name of fs.readdirSync(entryDir)) {
      const dir = path.join(entryDir, name); // dir path
      if (!fs.statSync(dir).isDirectory()) continue;

      const entryPath = entryFile ? path.join(dir, entryFile) : '';
      const tplPath = template ? path.join(dir, template) : '';

      pages.push({
        name,
        template: replaceSlash(
          fs.existsSync(tplPath) ? tplPath : undefined,
        ) as Page['template'],
        entry: replaceSlash(
          fs.existsSync(entryPath) ? path.join('/', entryPath) : undefined,
        ) as Page['entry'],
        filename: replaceSlash(
          typeof filename === 'function' ? filename(name) : undefined,
        ) as Page['filename'],
      });
    }
  }

  return pages;
}
