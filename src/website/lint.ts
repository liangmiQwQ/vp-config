import { mergeConfig } from 'vite-plus'
import type { OxlintConfig } from 'vite-plus/lint'

import { lintBase } from '../base/lint.ts'

// This is incomplete, Oxlint's better Vue support (template support) is needed since I personally mainly develop website with Vue.js
export const lintWebsite: OxlintConfig = mergeConfig<OxlintConfig, OxlintConfig>(lintBase, {
  env: { vue: true, browser: true }
})
