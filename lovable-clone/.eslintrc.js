/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@lovable/eslint-config'],
  root: true,
  ignorePatterns: [
    'apps/**',
    'packages/**',
    'templates/**',
    'dist',
    'node_modules',
    '.next',
    'coverage',
  ],
};