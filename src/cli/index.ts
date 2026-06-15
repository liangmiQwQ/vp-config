import type { PresetConfig } from '../entry.ts'
import { fmtCli } from './fmt.ts'
import { lintCli } from './lint.ts'
import { testCli } from './test.ts'

export const cliConfig: PresetConfig = {
  fmt: fmtCli,
  lint: lintCli,
  test: testCli
}
