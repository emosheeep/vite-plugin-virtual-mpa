import type { AllowedEvent, MpaOptions } from './api-types';
import type { Plugin } from 'vite';
import { createMpaPlugin as mpaPlugin } from './plugin';
import { htmlMinifyPlugin } from './html-minify';

export * from './api-types';
export * from './utils';

export function createMpaPlugin<
  PN extends string,
  PFN extends string,
  PT extends string,
  Event extends AllowedEvent,
  TPL extends string,
>(
  config: MpaOptions<PN, PFN, PT, Event, TPL>,
): Plugin[] {
  const { htmlMinify } = config;
  if (!htmlMinify) {
    return [mpaPlugin(config)];
  }
  return [mpaPlugin(config), htmlMinifyPlugin(htmlMinify === true ? {} : htmlMinify)];
}
