import { defineConfig, mergeConfig } from 'vite-plus'
import type { ConfigEnv, UserConfig } from 'vite-plus'
import type { PackUserConfig } from 'vite-plus/pack'

export interface PresetConfig {
  fmt?: UserConfig['fmt']
  lint?: UserConfig['lint']
  pack?: PackUserConfig
  run?: UserConfig['run']
  staged?: UserConfig['staged']
}

// Keep the public call signature aligned with Vite+'s defineConfig, but merge presets by input kind:
// Objects are merged immediately, promises are merged after resolution, and functions are wrapped until Vite+ provides ConfigEnv.
export function createConfigEntry<const Config extends PresetConfig>(
  presetConfig: Config
): ConfigEntry<Config> {
  const entry = ((config: ConfigInput) =>
    defineMergedConfig(presetConfig, config)) as typeof defineConfig
  const only: ConfigEntry<Config>['only'] = (parts, ...args) =>
    defineMergedConfig(pickPresetConfig(presetConfig, parts), ...args)
  const exclude: ConfigEntry<Config>['exclude'] = (parts, ...args) =>
    defineMergedConfig(omitPresetConfig(presetConfig, parts), ...args)

  return Object.assign(entry, { only, exclude })
}

type ConfigArgs = Parameters<typeof defineConfig>
type ConfigInput = ConfigArgs[0]
type ConfigResult = ReturnType<typeof defineConfig>
type ConfigFunctionInput = (env: ConfigEnv) => UserConfig | Promise<UserConfig>
type StagedObjectConfig = Extract<NonNullable<UserConfig['staged']>, Record<string, unknown>>

// This recursive tuple check is intentionally narrow: it rejects duplicate literal parts without widening them to string[].
export type Unique<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends Tail[number]
    ? never
    : readonly [Head, ...Unique<Tail>]
  : T
export type ConfigPart<PresetConfig> = Extract<keyof NonNullable<PresetConfig>, string>

export type ConfigFunction<PresetConfig> = <
  const Parts extends readonly ConfigPart<PresetConfig>[]
>(
  parts: Parts & Unique<Parts>,
  ...args: ConfigArgs
) => ConfigResult

export type ConfigEntry<PresetConfig> = {
  only: ConfigFunction<PresetConfig>
  exclude: ConfigFunction<PresetConfig>
} & typeof defineConfig

function defineMergedConfig(presetConfig: PresetConfig, config: ConfigInput): ConfigResult {
  if (typeof config === 'function') {
    // Vite+ owns ConfigEnv, so defer function configs until the loader calls this wrapper.
    return defineConfig(async env => {
      const userConfig = await (config as ConfigFunctionInput)(env)
      return mergePresetConfig(presetConfig, userConfig)
    }) as ConfigResult
  }

  if (config instanceof Promise) {
    // Preserve async config shape instead of awaiting here, matching defineConfig's Promise overload.
    return defineConfig(
      config.then(userConfig => mergePresetConfig(presetConfig, userConfig))
    ) as ConfigResult
  }

  // Plain objects can be merged eagerly because they do not depend on ConfigEnv.
  return defineConfig(mergePresetConfig(presetConfig, config)) as ConfigResult
}

// Pick by explicit keys instead of mutating the preset object shared by other entries.
function pickPresetConfig<Config extends PresetConfig>(
  presetConfig: Config,
  parts: readonly ConfigPart<Config>[]
): PresetConfig {
  return Object.fromEntries(parts.map(part => [part, presetConfig[part]])) as PresetConfig
}

function omitPresetConfig<Config extends PresetConfig>(
  presetConfig: Config,
  parts: readonly ConfigPart<Config>[]
): PresetConfig {
  const excludedParts = new Set<string>(parts)

  // Object.entries loses keyof information, so the result is cast back to PresetConfig.
  return Object.fromEntries(
    Object.entries(presetConfig).filter(([part]) => !excludedParts.has(part))
  ) as PresetConfig
}

function mergePresetConfig(presetConfig: PresetConfig, userConfig: UserConfig): UserConfig {
  const config = { ...userConfig }

  if (presetConfig.fmt) {
    config.fmt = mergeConfig(presetConfig.fmt, userConfig.fmt ?? {}) as UserConfig['fmt']
  }

  if (presetConfig.lint) {
    config.lint = mergeLintConfig(presetConfig.lint, userConfig.lint)
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

  return config
}

function mergeLintConfig(
  presetLint: NonNullable<PresetConfig['lint']>,
  userLint: UserConfig['lint']
): UserConfig['lint'] {
  return {
    ...userLint,
    extends: [...(userLint?.extends ?? []), presetLint]
  }
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
