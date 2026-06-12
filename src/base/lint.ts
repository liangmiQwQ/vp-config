import type { OxlintConfig } from 'vite-plus/lint'

export const lintBase: OxlintConfig = {
  categories: {
    correctness: 'error',
    perf: 'error',
    restriction: 'error',
    suspicious: 'error',
    pedantic: 'warn',
    style: 'off',
    nursery: 'off'
  },
  plugins: ['eslint', 'oxc', 'import', 'promise', 'typescript', 'unicorn'],
  rules: {
    // nursery
    'import/export': 'error'
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
