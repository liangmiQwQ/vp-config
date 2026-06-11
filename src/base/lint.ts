import type { OxlintConfig } from 'vite-plus/lint'

export const lintBase: OxlintConfig = {
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
      files: ['*.test.ts', '*.spec.ts'],
      env: {
        node: true,
        // We do not use jest
        vitest: true
      }
    }
  ]
}
