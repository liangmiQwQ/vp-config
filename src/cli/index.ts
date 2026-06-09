import type { UserConfig } from 'vite-plus'

import { fmtCli } from './fmt.ts'

export const cliConfig: UserConfig = {
  fmt: fmtCli
}
