import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'
import { tuiOverride } from '../shared/lint.ts'

export const lintLib: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(lintBase, {
  overrides: [{ files: ['cli.*', '**/cli/**', 'tui.*', '**/tui/**'], ...tuiOverride }]
})
