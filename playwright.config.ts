import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  retries: 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
  },

  projects: [
    {
      name: 'default',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'cd ./example && pnpm build && pnpm preview',

    // This works fine, as there's a base route defined in example/vite.config.ts
    // url: 'http://localhost:5173/',

    // This is what causes the infinite hang on Playwright. On a browser,
    // accessing this URL causes a reroute to `/`, which returns a response.
    // When Playwright attempts to hit this URL with an `Accept: */*` header,
    // no rewrite takes place and the server never connects.
    url: 'http://localhost:5173/some-test-url',

    // This is only here for debugging purposes.
    stdout: 'pipe',
  },
});
