import type { Plugin } from 'vite';
import type { Options } from 'html-minifier-terser';
import { minify } from 'html-minifier-terser';

export function htmlMinifyPlugin(options?: Options): Plugin {
  return {
    name: 'vite:html-minify',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml: (html) => {
      return minify(html, {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        ...options,
      });
    },
  };
}
