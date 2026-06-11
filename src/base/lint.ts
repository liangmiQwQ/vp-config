import type { OxlintConfig } from 'vite-plus/lint'

export const lintBase: OxlintConfig = {
  options: { typeAware: true, typeCheck: true, denyWarnings: true },
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
