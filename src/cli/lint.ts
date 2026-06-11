import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'

export const lintCli: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(lintBase, {
  env: { node: true }
})
