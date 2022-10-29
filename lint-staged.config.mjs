export default {
  '**/*.{js,ts}': files => files.map(v => `npx eslint ${v} --fix`),
  '**/*.ts': files => files.map(v =>
    `npx tsc --noEmit ${v} --resolveJsonModule --esModuleInterop`,
  ),
};
