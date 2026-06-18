import type { PresetConfig } from '../entry.ts'
import { fmtWebsite } from './fmt.ts'
import { lintWebsite } from './lint.ts'
import { runWebsite } from './run.ts'
import { stagedWebsite } from './staged.ts'
import { testWebsite } from './test.ts'

export const websiteConfig: PresetConfig = {
  fmt: fmtWebsite,
  lint: lintWebsite,
  run: runWebsite,
  staged: stagedWebsite,
  test: testWebsite
}
