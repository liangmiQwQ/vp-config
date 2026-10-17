// The `liangmi()` entry: a chainable builder, callable by Vite+ or awaited, that derives the preset and merges it with the user config.

import { composer } from '@oxlint-flat-config/composer/vite-plus'
import type { Composer } from '@oxlint-flat-config/composer/vite-plus'
import type { UserConfig } from 'oxlint-flat-config/vite-plus'
import { defineConfig } from 'vite-plus'
import type { ConfigEnv, UserConfig as ViteUserConfig } from 'vite-plus'

import { mergePresetConfig, omitPresetConfig, pickPresetConfig } from './merge.ts'
import { derivePreset } from './preset/index.ts'
import type { ConfigPart, Preset, PresetConfig } from './preset/index.ts'
import { findConfigDirectory } from './project/config-file.ts'
import { declarationKey, loadRootDeclarations } from './project/declarations.ts'
import type { DeclaredProject } from './project/index.ts'
import { findMemberRoot } from './project/workspace.ts'

export type UserConfigFunction = (env: ConfigEnv) => UserConfig | Promise<UserConfig>
type UserConfigInput = UserConfig | Promise<UserConfig> | UserConfigFunction
type ResolvedConfig<Input> = Input extends UserConfigFunction
  ? (env: ConfigEnv) => Promise<ViteUserConfig>
  : ViteUserConfig
type LintComposer = Omit<Composer<ViteUserConfig>, 'then'>
type LintStep = (lint: Composer<ViteUserConfig>) => Composer<ViteUserConfig>

// The composer methods change the `lint` flat config, after the user config objects are appended to the preset.
type LintMethods<Result> = {
  [Method in keyof LintComposer]: (
    ...args: Parameters<LintComposer[Method]>
  ) => LiangmiConfig<Result>
}

// This recursive tuple check is intentionally narrow: it rejects duplicate literal parts without widening them to string[].
export type Unique<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends Tail[number]
    ? never
    : readonly [Head, ...Unique<Tail>]
  : T

export type PartsFunction<Result> = <const Parts extends readonly ConfigPart[]>(
  parts: Parts & Unique<Parts>
) => LiangmiConfig<Result>

export interface LiangmiConfig<Result> extends PromiseLike<Result>, LintMethods<Result> {
  (env: ConfigEnv): Promise<ViteUserConfig>
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
  lintSteps: LintStep[]
}

// The config directory is read from the stack synchronously, before Vite removes its bundled config file.
export function liangmi<const Input extends UserConfigInput = UserConfig>(
  config?: Input
): LiangmiConfig<ResolvedConfig<Input>> {
  return createLiangmiConfig({
    config: config ?? {},
    configDirectory: findConfigDirectory(new Error('Find vite config').stack) ?? process.cwd(),
    declared: [],
    filter: presetConfig => presetConfig,
    lintSteps: []
  })
}

function createLiangmiConfig<Result>(state: EntryState): LiangmiConfig<Result> {
  const chain = (step: LintStep) =>
    createLiangmiConfig<Result>({ ...state, lintSteps: [...state.lintSteps, step] })

  const methods: { [Key in keyof LiangmiConfig<Result>]: LiangmiConfig<Result>[Key] } = {
    only: parts =>
      createLiangmiConfig<Result>({
        ...state,
        filter: config => pickPresetConfig(state.filter(config), parts)
      }),
    exclude: parts =>
      createLiangmiConfig<Result>({
        ...state,
        filter: config => omitPresetConfig(state.filter(config), parts)
      }),
    option: projects => {
      if (findMemberRoot(state.configDirectory)) {
        throw new Error(
          '[@liangmi/vp-config] `.option()` is only allowed in the workspace root config.'
        )
      }

      return createLiangmiConfig<Result>({ ...state, declared: [...state.declared, ...projects] })
    },

    append: (...inputs) => chain(lint => lint.append(...inputs)),
    prepend: (...inputs) => chain(lint => lint.prepend(...inputs)),
    // oxlint-disable-next-line unicorn/prefer-modern-dom-apis -- This is the composer method, not the DOM one.
    insertBefore: (name, ...inputs) => chain(lint => lint.insertBefore(name, ...inputs)),
    insertAfter: (name, ...inputs) => chain(lint => lint.insertAfter(name, ...inputs)),
    override: (name, patch) => chain(lint => lint.override(name, patch)),
    replace: (name, ...inputs) => chain(lint => lint.replace(name, ...inputs)),
    remove: name => chain(lint => lint.remove(name)),
    overrideRules: rules => chain(lint => lint.overrideRules(rules)),
    removeRules: (...ruleNames) => chain(lint => lint.removeRules(...ruleNames)),

    // oxlint-disable-next-line unicorn/no-thenable -- Support both direct config exports and explicit async resolution.
    then: (onFulfilled, onRejected) => resolveConfig<Result>(state).then(onFulfilled, onRejected)
  }

  // Vite calls function exports with ConfigEnv; awaiting the builder still resolves its config.
  return Object.assign(
    async (env: ConfigEnv) => {
      const config = await resolveConfig<
        ViteUserConfig | ((env: ConfigEnv) => Promise<ViteUserConfig>)
      >(state)
      return typeof config === 'function' ? config(env) : config
    },
    methods,
    { [declarationKey]: state.declared }
  )
}

async function resolveConfig<Result>(state: EntryState): Promise<Result> {
  const memberRoot = findMemberRoot(state.configDirectory)
  const declared = memberRoot ? await loadRootDeclarations(memberRoot) : state.declared
  const preset = derivePreset(state.configDirectory, declared)
  const presetConfig = state.filter(preset.config)
  const { config } = state

  // Vite+ owns ConfigEnv, so defer function configs until the loader calls this wrapper.
  const resolved =
    typeof config === 'function'
      ? defineConfig(async (env: ConfigEnv) =>
          mergeUserConfig(state, preset, presetConfig, await config(env))
        )
      : defineConfig(await mergeUserConfig(state, preset, presetConfig, await config))

  // A root config exported with top-level await is resolved, so it keeps the declarations too.
  return Object.assign(resolved, { [declarationKey]: declared }) as Result
}

function mergeUserConfig(
  state: EntryState,
  preset: Preset,
  presetConfig: PresetConfig,
  userConfig: UserConfig
): ViteUserConfig | PromiseLike<ViteUserConfig> {
  assertMemberConfig(state, preset, userConfig)

  return composeLint(mergePresetConfig(presetConfig, userConfig), state.lintSteps)
}

// The composer always emits `lint`, so skip it when there is nothing to lint.
function composeLint(
  { lint, ...config }: UserConfig,
  lintSteps: LintStep[]
): ViteUserConfig | PromiseLike<ViteUserConfig> {
  if (lint === undefined && lintSteps.length === 0) {
    return config
  }

  let composed = composer({ ...config, lint })
  for (const step of lintSteps) {
    composed = step(composed)
  }
  return composed
}

// Vite+ only reads `lint` and `fmt` from the workspace root, so they would be silently ignored here.
function assertMemberConfig(state: EntryState, preset: Preset, userConfig: UserConfig): void {
  const configured = {
    lint: userConfig.lint !== undefined || state.lintSteps.length > 0,
    fmt: userConfig.fmt !== undefined
  }
  const ignoredParts = (['lint', 'fmt'] as const).filter(part => configured[part])

  if (preset.position === 'member' && ignoredParts.length > 0) {
    throw new Error(
      `[@liangmi/vp-config] \`${ignoredParts.join('` and `')}\` in ${state.configDirectory} is ignored by Vite+, which only reads them from the workspace root. Declare the project traits with \`.option()\` or add overrides in the workspace root config instead.`
    )
  }
}
