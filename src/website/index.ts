import type { UserConfig } from 'vite-plus'

import { fmtWebsite } from './fmt.ts'

export const websiteConfig: UserConfig = {
  fmt: fmtWebsite
}
