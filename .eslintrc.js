const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'standard',
    '@vue/typescript/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    semi: 'off',
    indent: 'off',
    'comma-dangle': 'off',
    'space-before-function-paren': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    }],
    'vue/max-attributes-per-line': 'off',
  },
});
