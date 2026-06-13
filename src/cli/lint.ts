import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'

export const cliOverride: OxlintConfig = {
  env: { node: true },
  plugins: ['node'],
  rules: {
    'no-console': 'off',
    'unicorn/no-process-exit': 'off',
    'node/no-path-concat': 'error'
  }
}

export const lintCli: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(lintBase, cliOverride)
