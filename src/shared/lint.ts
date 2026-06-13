import type { OxlintConfig } from 'vite-plus/lint'

export const cliOverride: OxlintConfig = {
  env: { node: true },
  plugins: ['node'],
  rules: {
    'no-console': 'off',
    'unicorn/no-process-exit': 'off',
    'node/no-path-concat': 'error'
  }
}
