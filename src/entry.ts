// The `liangmi()` entry: a chainable, awaitable builder that derives the preset and merges it with the user config.

import { defineConfig } from 'vite-plus'
import type { ConfigEnv, UserConfig } from 'vite-plus'

import { mergePresetConfig, omitPresetConfig, pickPresetConfig } from './merge.ts'
import { derivePreset } from './preset/index.ts'
import type { ConfigPart, Preset, PresetConfig } from './preset/index.ts'
import { findConfigDirectory } from './project/config-file.ts'
import type { DeclaredProject } from './project/index.ts'

export type UserConfigFunction = (env: ConfigEnv) => UserConfig | Promise<UserConfig>
type UserConfigInput = UserConfig | Promise<UserConfig> | UserConfigFunction
type ResolvedConfig<Input> = Input extends UserConfigFunction
  ? (env: ConfigEnv) => Promise<UserConfig>
  : UserConfig

// This recursive tuple check is intentionally narrow: it rejects duplicate literal parts without widening them to string[].
export type Unique<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends Tail[number]
    ? never
    : readonly [Head, ...Unique<Tail>]
  : T

export type PartsFunction<Result> = <const Parts extends readonly ConfigPart[]>(
  parts: Parts & Unique<Parts>
) => LiangmiConfig<Result>

export interface LiangmiConfig<Result> extends PromiseLike<Result> {
  only: PartsFunction<Result>
  exclude: PartsFunction<Result>
  // Declares project traits which override the derived ones.
  option: (projects: DeclaredProject[]) => LiangmiConfig<Result>
}

interface EntryState {
  config: UserConfigInput
  configDirectory: string
  declared: DeclaredProject[]
  filter: (presetConfig: PresetConfig) => PresetConfig
}

// The config directory is read from the stack synchronously, before Vite removes its bundled config file.
export function liangmi<const Input extends UserConfigInput = UserConfig>(
  config?: Input
): LiangmiConfig<ResolvedConfig<Input>> {
  return createLiangmiConfig({
    config: config ?? {},
    configDirectory: findConfigDirectory(new Error('Find vite config').stack) ?? process.cwd(),
    declared: [],
    filter: presetConfig => presetConfig
  })
}

function createLiangmiConfig<Result>(state: EntryState): LiangmiConfig<Result> {
  return {
    only: parts =>
      createLiangmiConfig({
        ...state,
        filter: config => pickPresetConfig(state.filter(config), parts)
      }),
    exclude: parts =>
      createLiangmiConfig({
        ...state,
        filter: config => omitPresetConfig(state.filter(config), parts)
      }),
    option: projects =>
      createLiangmiConfig({ ...state, declared: [...state.declared, ...projects] }),
    // oxlint-disable-next-line unicorn/no-thenable -- The entry is awaited in vite.config.ts to resolve the config.
    then: (onFulfilled, onRejected) => resolveConfig<Result>(state).then(onFulfilled, onRejected)
  }
}

async function resolveConfig<Result>(state: EntryState): Promise<Result> {
  const preset = derivePreset(state.configDirectory, state.declared)
  const presetConfig = state.filter(preset.config)
  const { config } = state

  if (typeof config === 'function') {
    // Vite+ owns ConfigEnv, so defer function configs until the loader calls this wrapper.
    return defineConfig(async (env: ConfigEnv) =>
      mergeUserConfig(preset, presetConfig, await config(env), state.configDirectory)
    ) as Result
  }

  return defineConfig(
    mergeUserConfig(preset, presetConfig, await config, state.configDirectory)
  ) as Result
}

function mergeUserConfig(
  preset: Preset,
  presetConfig: PresetConfig,
  userConfig: UserConfig,
  configDirectory: string
): UserConfig {
  assertMemberConfig(preset, userConfig, configDirectory)

  return mergePresetConfig(presetConfig, userConfig)
}

// Vite+ only reads `lint` and `fmt` from the workspace root, so they would be silently ignored here.
function assertMemberConfig(preset: Preset, userConfig: UserConfig, configDirectory: string): void {
  const ignoredParts = (['lint', 'fmt'] as const).filter(part => userConfig[part] !== undefined)

  if (preset.position === 'member' && ignoredParts.length > 0) {
    throw new Error(
      `[@liangmi/vp-config] \`${ignoredParts.join('` and `')}\` in ${configDirectory} is ignored by Vite+, which only reads them from the workspace root. Declare the project traits with \`.option()\` or add overrides in the workspace root config instead.`
    )
  }
}
