module.exports = {
  extends: ['@guardian/eslint-config-typescript'],
  rules: {
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
  },
};