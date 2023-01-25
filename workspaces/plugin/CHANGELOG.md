# 1.6.0

fix: Warnings appear when `build.sourcemap` enabled. Closed [#19](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/19).

# 1.5.0
feat: Allow vite handling unmatched paths. Closed [#15](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/15).

# 1.4.1
fix: Cypress testing process of cross-entry-page jumping hanging, which causing a timeout error. Closed [#12](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/12).

# 1.4.0

- feat: Add `createPages` utility function to help creating `pages` configuration independently outside plugin function. Closed [#10](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/10).

# 1.3.0

- feat: inject `env` variables into ejs template by default. Merged [#8](https://github.com/emosheeep/vite-plugin-virtual-mpa/pull/8).

# 1.2.2

- Expose all types for using. Closed [#4](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/4).

# 1.2.1

- Improve typings and add comments for a better prompts

# 1.2.0

- Improve typings.

# 1.2.0-beta.0

- Add `watchOptions` to allow users writing custom logic when file events fired. Closed [#2](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/2).

# 1.1.0

- Some backend logic is added to make the proxy work correctly
- Fix the warning about `Could not auto-determine entry point...` by add entry path to `optimizeDeps.entries`
- More friendly error/log print
- Improved documentation

# 1.0.1

- More friendly typescript type hints

# 1.0.0

- Support for virtual html entry file, output multiple files using a single template
- Support ejs engine.
- Support `connect-history-fallback-api` for DevServer to rewrite requests.
