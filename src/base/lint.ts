import type { DummyRuleMap, OxlintConfig } from 'vite-plus/lint'

// Rules Config
const nursery: DummyRuleMap = {
  // We hope typescript can process them.
  'no-undef': 'off',
  'import/named': 'off',

  // Disable some too strict ones
  'no-restricted-exports': 'off'
}

export const lintBase: OxlintConfig = {
  categories: {
    correctness: 'error',
    perf: 'error',
    restriction: 'error',
    suspicious: 'error',
    nursery: 'error',
    pedantic: 'warn',
    style: 'off'
  },
  plugins: ['eslint', 'oxc', 'import', 'promise', 'typescript', 'unicorn'],
  rules: {
    // oxlint-disable-next-line oxc/no-rest-spread-properties
    ...nursery,

    'no-inline-comments': 'off'
  },
  options: {
    typeAware: true,
    typeCheck: true,
    denyWarnings: true,
    reportUnusedDisableDirectives: 'warn',
    // We hope to use `oxlint-disable-next-line` instead of `eslint-xxx`
    respectEslintDisableDirectives: false
  },
  overrides: [
    // Test override, can be used for all catelogries
    {
      env: {
        node: true,
        // We do not use jest
        vitest: true
      },
      files: ['*.test.ts', '*.spec.ts']
    }
  ]
}
