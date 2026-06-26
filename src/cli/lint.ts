import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'
import { tuiOverride } from '../shared/lint.ts'

export const lintCli: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(
  lintBase,
  mergeConfig<OxlintConfig, OxlintConfig>(tuiOverride, {
    overrides: [
      {
        rules: {
          'import/no-unassigned-import': 'off'
        },
        files: ['bin/**']
      }
    ]
  })
)
