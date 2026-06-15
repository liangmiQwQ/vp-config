import type { UserConfig } from 'vite-plus'

import { testBase } from '../base/test.ts'

export const testWebsite: UserConfig['test'] = {
  ...testBase
}
