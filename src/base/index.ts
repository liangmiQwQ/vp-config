import type { PresetConfig } from '../entry.ts'
import { fmtBase } from './fmt.ts'
import { lintBase } from './lint.ts'
import { runBase } from './run.ts'
import { stagedBase } from './staged.ts'

export const baseConfig: PresetConfig = {
  fmt: fmtBase,
  lint: lintBase,
  run: runBase,
  staged: stagedBase
}
