import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'

export const lintWebsite: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(lintBase, {
  env: { vue: true, browser: true }
})
