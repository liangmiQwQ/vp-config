import type { OxfmtConfig } from 'vite-plus/fmt'

import { fmtBase } from '../base/fmt.ts'

// We do not use mergeConfig because there are all top-level fields.
export const fmtWebsite: OxfmtConfig = {
  ...fmtBase,
  jsxSingleQuote: true,
  embeddedLanguageFormatting: 'auto',
  // Prefer processing tailwindcss by hand.
  sortTailwindcss: false
}
