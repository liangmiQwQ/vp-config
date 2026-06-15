import type { PresetConfig } from '../entry.ts'
import { fmtLib } from './fmt.ts'
import { lintLib } from './lint.ts'
import { testLib } from './test.ts'

export const libConfig: PresetConfig = {
  fmt: fmtLib,
  lint: lintLib,
  test: testLib
}
