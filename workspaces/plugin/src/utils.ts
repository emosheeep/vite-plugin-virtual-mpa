import type { UrlWithStringQuery } from 'node:url';
import type { Rewrite } from 'connect-history-api-fallback';
import type { Page } from './api-types';

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
 * @see https://github.com/bripkens/connect-history-api-fallback/blob/6b58bc97d4a2ff2be0a68dc661df5c7857758a55/lib/index.js#L89-L101
 */
export function evaluateRewriteRule(
  parsedUrl: UrlWithStringQuery,
  match: RegExpMatchArray,
  rule: Rewrite['to'],
) {
  if (typeof rule === 'string') {
    return rule;
  } else if (typeof rule !== 'function') {
    throw new Error('Rewrite rule can only be of type string or function.');
  }

  return rule({
    parsedUrl,
    match,
  });
}
