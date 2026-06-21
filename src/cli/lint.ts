import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'
import { cliOverride, componentOverride } from '../shared/lint.ts'

export const lintCli: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(
  lintBase,
  mergeConfig<OxlintConfig, OxlintConfig>(
    mergeConfig<OxlintConfig, OxlintConfig>(cliOverride, componentOverride),
    {
      overrides: [
        {
          rules: {
            'import/no-unassigned-import': 'off'
          },
          files: ['bin/**']
        }
      ]
    }
  )
)
