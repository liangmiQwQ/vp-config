import type { UserConfig } from 'vite-plus'

import { fmtLib } from './fmt.ts'

export const libConfig: UserConfig = {
  fmt: fmtLib
}
