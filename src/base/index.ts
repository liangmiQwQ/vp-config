import type { PresetConfig } from '../entry.ts'
import { staged } from '../shared/staged.ts'
import { fmtBase } from './fmt.ts'
import { lintBase } from './lint.ts'

export const baseConfig: PresetConfig = {
  fmt: fmtBase,
  lint: lintBase,
  staged
}
