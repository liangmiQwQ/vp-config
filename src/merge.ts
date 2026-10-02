// Selects preset config parts, and merges the user config on top of them part by part.

import { mergeConfig } from 'vite-plus'
import type { UserConfig } from 'vite-plus'
import type { PackUserConfig } from 'vite-plus/pack'

import type { ConfigPart, PresetConfig } from './preset/index.ts'

type StagedObjectConfig = Extract<NonNullable<UserConfig['staged']>, Record<string, unknown>>

// Pick by explicit keys instead of mutating the preset object.
export function pickPresetConfig(
  presetConfig: PresetConfig,
  parts: readonly ConfigPart[]
): PresetConfig {
  return Object.fromEntries(
    Object.entries(presetConfig).filter(([part]) => parts.includes(part as ConfigPart))
  )
}

export function omitPresetConfig(
  presetConfig: PresetConfig,
  parts: readonly ConfigPart[]
): PresetConfig {
  return Object.fromEntries(
    Object.entries(presetConfig).filter(([part]) => !parts.includes(part as ConfigPart))
  )
}

export function mergePresetConfig(presetConfig: PresetConfig, userConfig: UserConfig): UserConfig {
  const config = { ...userConfig }

  if (presetConfig.fmt) {
    config.fmt = mergeConfig(presetConfig.fmt, userConfig.fmt ?? {}) as UserConfig['fmt']
  }

  if (presetConfig.lint) {
    config.lint = mergeConfig(presetConfig.lint, userConfig.lint ?? {}) as UserConfig['lint']
  }

  if (presetConfig.pack) {
    config.pack = mergePackConfig(presetConfig.pack, userConfig.pack)
  }

  if (presetConfig.run) {
    config.run = mergeConfig(presetConfig.run, userConfig.run ?? {}) as UserConfig['run']
  }

  if (presetConfig.staged) {
    config.staged = mergeStagedConfig(presetConfig.staged, userConfig.staged)
  }

  if (presetConfig.test) {
    config.test = mergeConfig(presetConfig.test, userConfig.test ?? {}) as UserConfig['test']
  }

  return config
}

function mergePackConfig(
  presetPack: NonNullable<PresetConfig['pack']>,
  userPack: UserConfig['pack']
): UserConfig['pack'] {
  if (Array.isArray(userPack)) {
    return userPack.map(packConfig => mergeConfig(presetPack, packConfig) as PackUserConfig)
  }

  return mergeConfig(presetPack, userPack ?? {}) as PackUserConfig
}

function mergeStagedConfig(
  presetStaged: NonNullable<PresetConfig['staged']>,
  userStaged: UserConfig['staged']
): UserConfig['staged'] {
  if (!isStagedObjectConfig(presetStaged)) {
    return userStaged ?? presetStaged
  }

  if (userStaged && !isStagedObjectConfig(userStaged)) {
    return userStaged
  }

  return mergeConfig(presetStaged, userStaged ?? {}) as UserConfig['staged']
}

function isStagedObjectConfig(config: UserConfig['staged']): config is StagedObjectConfig {
  return typeof config === 'object'
}
