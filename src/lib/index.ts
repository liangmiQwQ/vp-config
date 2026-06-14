import type { PresetConfig } from '../entry.ts'
import { fmtLib } from './fmt.ts'
import { lintLib } from './lint.ts'

export const libConfig: PresetConfig = {
  fmt: fmtLib,
  lint: lintLib
}
