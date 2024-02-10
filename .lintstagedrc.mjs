export default {
  '**/*.{ts,tsx,js,jsx}': ['eslint', 'tsc --noEmit --allowJs'],
  '**/*.{js,ts,jsx,tsx,md,css}': ['prettier --check'],
};
