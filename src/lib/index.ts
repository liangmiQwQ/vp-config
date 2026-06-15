import type { PresetConfig } from '../entry.ts'
import { staged } from '../shared/staged.ts'
import { fmtLib } from './fmt.ts'
import { lintLib } from './lint.ts'
import { packLib } from './pack.ts'

export const libConfig: PresetConfig = {
  fmt: fmtLib,
  lint: lintLib,
  pack: packLib,
  staged
}
