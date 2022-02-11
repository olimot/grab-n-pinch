module.exports = {
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', varsIgnorePattern: '^_' }],
    'import/no-extraneous-dependencies': 0,
    'prefer-destructuring': 0,
    'no-continue': 0,
    'no-param-reassign': 0,
    'no-restricted-syntax': 0,
    'no-await-in-loop': 0,
    'no-promise-executor-return': 0,
    'no-plusplus': 0,
    'no-shadow': 0,
    '@typescript-eslint/no-shadow': 'error',
  },
};
