import { mergeConfig } from 'vite-plus'
import type { UserConfig } from 'vite-plus/pack'

import type { ProjectFacts } from '../project/index.ts'

export const packLib: UserConfig = {
  fixedExtension: true,
  exports: true,
  minify: false,
  dts: {
    generator: 'tsgo'
  }
}

export const packCli: UserConfig = {
  dts: false,
  minify: true,
  platform: 'node',
  nodeProtocol: 'strip'
}

// When a project ships both a library and an executable, library defaults take priority where they conflict.
export function derivePack(facts: ProjectFacts): UserConfig | undefined {
  if (facts.lib && facts.cli) {
    return mergeConfig<UserConfig, UserConfig>(packCli, packLib)
  }

  if (facts.lib) {
    return packLib
  }

  return facts.cli ? packCli : undefined
}
