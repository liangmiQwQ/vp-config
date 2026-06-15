import type { UserConfig } from 'vite-plus'

import { testBase } from '../base/test.ts'

export const testLib: UserConfig['test'] = {
  ...testBase
}
