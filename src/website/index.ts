import type { UserConfig } from 'vite-plus'

import { fmtWebsite } from './fmt.ts'
import { lintWebsite } from './lint.ts'

export const websiteConfig: UserConfig = {
  fmt: fmtWebsite,
  lint: lintWebsite
}
