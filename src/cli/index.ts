import type { UserConfig } from 'vite-plus'

import { fmtCli } from './fmt.ts'
import { lintCli } from './lint.ts'

export const cliConfig: UserConfig = {
  fmt: fmtCli,
  lint: lintCli
}
