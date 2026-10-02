import { defineConfig } from 'vite-plus'
import type { ConfigEnv, UserConfig } from 'vite-plus'

import { mergePresetConfig, omitPresetConfig, pickPresetConfig } from './merge.ts'
import { derivePreset } from './preset/index.ts'
import type { ConfigPart, Preset, PresetConfig } from './preset/index.ts'
import { findConfigDirectory } from './project/config-file.ts'
import type { DeclaredProjects } from './project/index.ts'

export interface LiangmiOptions {
  // Project facts which override the detected ones, keyed by paths relative to this config.
  projects?: DeclaredProjects
}

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
  option: (options: LiangmiOptions) => LiangmiConfig<Result>
}

interface EntryState {
  config: UserConfigInput
  configDirectory: string
  options: LiangmiOptions
  filter: (presetConfig: PresetConfig) => PresetConfig
}

// The config directory is read from the stack synchronously, before Vite removes its bundled config file.
export function liangmi<const Input extends UserConfigInput = UserConfig>(
  config?: Input
): LiangmiConfig<ResolvedConfig<Input>> {
  return createLiangmiConfig({
    config: config ?? {},
    configDirectory: findConfigDirectory(new Error('Find vite config').stack) ?? process.cwd(),
    options: {},
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
    option: options => createLiangmiConfig({ ...state, options: { ...state.options, ...options } }),
    // oxlint-disable-next-line unicorn/no-thenable -- The entry is awaited in vite.config.ts to resolve the config.
    then: (onFulfilled, onRejected) => resolveConfig<Result>(state).then(onFulfilled, onRejected)
  }
}

async function resolveConfig<Result>(state: EntryState): Promise<Result> {
  const preset = derivePreset(state.configDirectory, state.options.projects)
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
      `[@liangmi/vp-config] \`${ignoredParts.join('` and `')}\` in ${configDirectory} is ignored by Vite+, which only reads them from the workspace root. Declare the project facts with \`.option({ projects })\` or add overrides in the workspace root config instead.`
    )
  }
}
