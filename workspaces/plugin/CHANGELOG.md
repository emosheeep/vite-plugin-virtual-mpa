# 1.3.0

- feat: inject `env` variables into ejs template by default. [#8](https://github.com/emosheeep/vite-plugin-virtual-mpa/pull/8)

# 1.2.2

- Expose all types for using. [#4](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/4)

# 1.2.1

- Improve typings and add comments for a better prompts

# 1.2.0

- Improve typings.

# 1.2.0-beta.0

- Add `watchOptions` to allow users writing custom logic when file events fired. [#2](https://github.com/emosheeep/vite-plugin-virtual-mpa/issues/2)

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
