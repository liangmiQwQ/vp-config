import type { PresetConfig } from '../entry.ts'
import { fmtCli } from './fmt.ts'
import { lintCli } from './lint.ts'
import { packCli } from './pack.ts'
import { runCli } from './run.ts'
import { stagedCli } from './staged.ts'

export const cliConfig: PresetConfig = {
  fmt: fmtCli,
  lint: lintCli,
  pack: packCli,
  run: runCli,
  staged: stagedCli
}
