import type { OxlintConfig } from 'vite-plus/lint'

// For code that's sure running on Node.js, mainly for CLI use.
export const cliOverride: OxlintConfig = {
  env: { node: true },
  // We don't enable most of the rules in this plugin, just follow the configure in lintBase.
  plugins: ['node'],
  rules: {
    'no-console': 'off',
    'unicorn/no-process-exit': 'off',
    'node/no-path-concat': 'error'
  }
}
