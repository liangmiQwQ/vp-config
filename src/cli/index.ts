import { stagedBase } from '../base/staged.ts'
import type { PresetConfig } from '../entry.ts'
import { fmtCli } from './fmt.ts'
import { lintCli } from './lint.ts'
import { packCli } from './pack.ts'

export const cliConfig: PresetConfig = {
  fmt: fmtCli,
  lint: lintCli,
  pack: packCli,
  staged: stagedBase
}
