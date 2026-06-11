import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'

export const lintLib: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(lintBase, {
  // We do not have specific env for libraries
})
