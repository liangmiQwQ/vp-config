import { definePlugin } from '@oxlint/plugins'

import { pluginName } from './constants.ts'
import { rules } from './rules.ts'

export { getAllowedConfigNames, isVpConfigImportAllowed } from './project.ts'
export {
  cleanupRuntimeInfo,
  getInfoPath,
  inferProjectCategory,
  readRuntimeInfo,
  writeRuntimeInfo
} from './info.ts'

// oxlint-disable-next-line import/no-default-export
export default definePlugin({
  meta: { name: pluginName },
  rules
})
