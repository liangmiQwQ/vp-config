import type { OxfmtConfig } from 'vite-plus/fmt'

export const fmtBase: OxfmtConfig = {
  arrowParens: 'avoid',
  embeddedLanguageFormatting: 'off',
  singleQuote: true,
  sortImports: {
    partitionByComment: true
  },
  sortPackageJson: {
    sortScripts: true
  },
  semi: false,
  trailingComma: 'none'
}
