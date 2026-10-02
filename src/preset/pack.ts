// Pack (tsdown) preset derived from the lib and cli traits of a project.

import { mergeConfig } from 'vite-plus'
import type { UserConfig } from 'vite-plus/pack'

import type { Project } from '../project/index.ts'
import { isCli, isLib } from '../project/traits.ts'

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
export function derivePack(project: Project): UserConfig | undefined {
  const lib = isLib(project)
  const cli = isCli(project)

  if (lib && cli) {
    return mergeConfig<UserConfig, UserConfig>(packCli, packLib)
  }

  if (lib) {
    return packLib
  }

  return cli ? packCli : undefined
}
