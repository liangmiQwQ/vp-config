import type { PresetConfig } from '../entry.ts'
import { fmtCli } from './fmt.ts'
import { lintCli } from './lint.ts'

export const cliConfig: PresetConfig = {
  fmt: fmtCli,
  lint: lintCli
}
