import { stagedBase } from '../base/staged.ts'
import type { PresetConfig } from '../entry.ts'
import { fmtWebsite } from './fmt.ts'
import { lintWebsite } from './lint.ts'
import { testWebsite } from './test.ts'

export const websiteConfig: PresetConfig = {
  fmt: fmtWebsite,
  lint: lintWebsite,
  staged: stagedBase,
  test: testWebsite
}
