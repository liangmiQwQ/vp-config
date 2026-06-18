import type { PresetConfig } from '../entry.ts'
import { run } from '../shared/run.ts'
import { staged } from '../shared/staged.ts'
import { fmtWebsite } from './fmt.ts'
import { lintWebsite } from './lint.ts'
import { testWebsite } from './test.ts'

export const websiteConfig: PresetConfig = {
  fmt: fmtWebsite,
  lint: lintWebsite,
  run,
  staged,
  test: testWebsite
}
