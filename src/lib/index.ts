import { runBase as runLib } from '../base/run.ts'
import type { PresetConfig } from '../entry.ts'
import { fmtLib } from './fmt.ts'
import { lintLib } from './lint.ts'
import { packLib } from './pack.ts'
import { stagedLib } from './staged.ts'

export const libConfig: PresetConfig = {
  fmt: fmtLib,
  lint: lintLib,
  pack: packLib,
  run: runLib,
  staged: stagedLib
}
