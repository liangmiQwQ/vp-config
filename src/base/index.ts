import type { UserConfig } from 'vite-plus'

import { fmtBase } from './fmt.ts'
import { lintBase } from './lint.ts'

export const baseConfig: UserConfig = {
  fmt: fmtBase,
  lint: lintBase
}
