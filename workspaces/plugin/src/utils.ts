import type { Page } from './api-types';

/**
 * This function simply converts the arguments to an array and returns them.
 * It helps creating pages configuration with type hints independently outside plugin function.
 */
export function createPages<
  Name extends string,
  Filename extends string,
  Tpl extends string,
>(pages: Page<Name, Filename, Tpl> | Page<Name, Filename, Tpl>[]): Page[] {
  return Array.isArray(pages) ? pages : [pages];
}
