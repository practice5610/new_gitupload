module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['node_modules/*', 'dist/*', 'parcel/*', '.eslintrc.js'],
  plugins: ['simple-import-sort'],
  //parserOptions: { project: ['../api/api/tsconfig.json'] }, // UNCOMMENT to solve this error on VSCODE Console : Error while loading rule '@typescript-eslint/await-thenable'
  extends: [
    '@loopback/eslint-config',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // Include .prettierrc.js rules
    'prettier/prettier': ['error', { endOfLine: 'auto' }, { usePrettierrc: true }],

    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',

    '@typescript-eslint/explicit-function-return-type': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/ban-ts-ignore': 'off', // TODO: Comment this rule and block the use of @ts-ignore
    '@typescript-eslint/no-var-requires': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/consistent-type-assertions': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/no-empty-interface': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/no-empty-function': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/no-use-before-define': 'off', // TODO: Comment this rule and make the fixes needed

    '@typescript-eslint/ban-ts-comment': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/prefer-optional-chain': 'off', // TODO: Comment this rule and make the fixes needed
    '@typescript-eslint/ban-types': 'off', // TODO: Comment this rule and make the fixes needed
    'no-useless-escape': 'off', // TODO: Comment this rule and make the fixes needed
    'no-shadow': 'off', // TODO: Comment this rule and make the fixes needed

    '@typescript-eslint/consistent-type-assertions': [
      'warn',
      {
        assertionStyle: 'never',
      },
    ],

    '@typescript-eslint/no-namespace': 'off',

    '@typescript-eslint/naming-convention': [
      'error',
      {
        leadingUnderscore: 'allow',
        format: ['camelCase', 'UPPER_CASE', 'snake_case', 'PascalCase'],
        selector: 'default',
      },
    ],

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'sort-imports': 'off',
    'import/order': 'off',
  },
};
