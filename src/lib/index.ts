import type { UserConfig } from 'vite-plus'

import { fmtLib } from './fmt.ts'
import { lintLib } from './lint.ts'

export const libConfig: UserConfig = {
  fmt: fmtLib,
  lint: lintLib
}
