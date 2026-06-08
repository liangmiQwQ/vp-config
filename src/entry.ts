import { defineConfig, mergeConfig, type ConfigEnv, type UserConfig } from "vite-plus";

// The function used to define config entries
export function createConfigEntry<const PresetConfig extends UserConfig>(
  presetConfig: PresetConfig,
): ConfigEntry<PresetConfig> {
  const entry = ((config: ConfigInput) =>
    defineMergedConfig(presetConfig, config)) as typeof defineConfig;
  const only: ConfigEntry<PresetConfig>["only"] = (parts, ...args) => {
    return defineMergedConfig(pickPresetConfig(presetConfig, parts), ...args);
  };
  const exclude: ConfigEntry<PresetConfig>["exclude"] = (parts, ...args) => {
    return defineMergedConfig(omitPresetConfig(presetConfig, parts), ...args);
  };

  return Object.assign(entry, { only, exclude });
}

type ConfigArgs = Parameters<typeof defineConfig>;
type ConfigInput = ConfigArgs[0];
type ConfigResult = ReturnType<typeof defineConfig>;
type ConfigFunctionInput = (env: ConfigEnv) => UserConfig | Promise<UserConfig>;

// `only` or `exclude` list type
export type Unique<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends Tail[number]
    ? never
    : readonly [Head, ...Unique<Tail>]
  : T;
export type ConfigPart<PresetConfig> = Extract<keyof NonNullable<PresetConfig>, string>;

export type ConfigFunction<PresetConfig> = <
  const Parts extends readonly ConfigPart<PresetConfig>[],
>(
  parts: Parts & Unique<Parts>,
  ...args: ConfigArgs
) => ConfigResult;

export type ConfigEntry<PresetConfig> = {
  only: ConfigFunction<PresetConfig>;
  exclude: ConfigFunction<PresetConfig>;
} & typeof defineConfig;

function defineMergedConfig(presetConfig: UserConfig, config: ConfigInput): ConfigResult {
  if (typeof config === "function") {
    return defineConfig(async (env) => {
      const userConfig = await (config as ConfigFunctionInput)(env);
      return mergeConfig(presetConfig, userConfig) as UserConfig;
    }) as ConfigResult;
  }

  if (config instanceof Promise) {
    return defineConfig(
      config.then((userConfig) => mergeConfig(presetConfig, userConfig) as UserConfig),
    ) as ConfigResult;
  }

  return defineConfig(mergeConfig(presetConfig, config) as UserConfig) as ConfigResult;
}

function pickPresetConfig<PresetConfig extends UserConfig>(
  presetConfig: PresetConfig,
  parts: readonly ConfigPart<PresetConfig>[],
): UserConfig {
  return Object.fromEntries(parts.map((part) => [part, presetConfig[part]])) as UserConfig;
}

function omitPresetConfig<PresetConfig extends UserConfig>(
  presetConfig: PresetConfig,
  parts: readonly ConfigPart<PresetConfig>[],
): UserConfig {
  const excludedParts = new Set<string>(parts);

  return Object.fromEntries(
    Object.entries(presetConfig).filter(([part]) => !excludedParts.has(part)),
  ) as UserConfig;
}
