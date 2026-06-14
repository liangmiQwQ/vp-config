import type { PresetConfig } from '../entry.ts'
import { fmtWebsite } from './fmt.ts'
import { lintWebsite } from './lint.ts'

export const websiteConfig: PresetConfig = {
  fmt: fmtWebsite,
  lint: lintWebsite
}
