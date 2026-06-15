import type { UserConfig } from 'vite-plus'

import { testBase } from '../base/test.ts'

export const testCli: UserConfig['test'] = {
  ...testBase
}
