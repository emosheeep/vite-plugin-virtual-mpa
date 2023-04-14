import type { Page, ScanOptions } from './api-types';
import path from 'path';
import fs from 'fs';

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
  const { filename, entryFile, scanDirs, template } = scanOptions || {} as ScanOptions;
  const pages: Page[] = [];

  for (const entryDir of [scanDirs].flat().filter(Boolean)) {
    for (const name of fs.readdirSync(entryDir)) {
      const dir = path.join(entryDir, name); // dir path
      if (!fs.statSync(dir).isDirectory()) continue;

      const entryPath = entryFile ? path.join(dir, entryFile) : '';
      const tplPath = template ? path.join(dir, template) : '';

      pages.push({
        name,
        template: fs.existsSync(tplPath)
          ? tplPath as Page['template']
          : undefined,
        entry: fs.existsSync(entryPath)
          ? path.join('/', entryPath) as Page['entry']
          : undefined,
        filename: typeof filename === 'function'
          ? filename(name) as Page['filename']
          : undefined,
      });
    }
  }

  return pages;
}
