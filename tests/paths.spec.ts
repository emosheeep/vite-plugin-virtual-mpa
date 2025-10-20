import { test } from '@playwright/test';

const paths = [
  '/',
  '/fruits/apple',
  '/fruits/apple.html',
  '/fruits/banana',
  '/fruits/banana.htm',
  '/fruits/strawberry',
  '/fruits/strawberry/',
];

paths.forEach((path) => {
  test(`Path "${path}" is accessible`, async ({ page }) => {
    await page.goto(path);
  });
});
