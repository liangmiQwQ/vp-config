import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'
import { componentOverride } from '../shared/lint.ts'

// This is incomplete, Oxlint's better Vue support (template support) is needed since I personally mainly develop website with Vue.js
const browserEnvironmentOverride: OxlintConfig = {
  env: { browser: true },
  rules: {
    'prefer-dom-node-append': 'warn',
    'prefer-dom-node-dataset': 'warn',
    'unicorn/prefer-query-selector': 'warn',

    'prefer-dom-node-remove': 'warn',
    'prefer-blob-reading-methods': 'warn',

    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }]
  }
}

export const lintWebsite: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(
  mergeConfig<OxlintConfig, OxlintConfig>(lintBase, componentOverride),
  browserEnvironmentOverride
)
