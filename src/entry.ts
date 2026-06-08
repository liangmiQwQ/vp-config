import { defineConfig, mergeConfig, type UserConfig } from "vite-plus";

export function createConfigEntry<const PresetConfig extends UserConfig | null>(
  presetConfig: PresetConfig,
): ConfigEntry<PresetConfig> {
  const entry = ((...args: ConfigArgs) =>
    defineMergedConfig(presetConfig, ...args)) as typeof defineConfig;
  const only: ConfigEntry<PresetConfig>["only"] = (parts, ...args) => {
    void parts;
    return defineMergedConfig(presetConfig, ...args);
  };
  const exclude: ConfigEntry<PresetConfig>["exclude"] = (parts, ...args) => {
    void parts;
    return defineMergedConfig(presetConfig, ...args);
  };

  return Object.assign(entry, { only, exclude });
}

type ConfigArgs = Parameters<typeof defineConfig>;
type ConfigResult = ReturnType<typeof defineConfig>;

type Unique<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends Tail[number]
    ? never
    : readonly [Head, ...Unique<Tail>]
  : T;

type ConfigPart<PresetConfig> = Extract<keyof NonNullable<PresetConfig>, string>;
type ConfigFunction<PresetConfig> = <const Parts extends readonly ConfigPart<PresetConfig>[]>(
  parts: Parts & Unique<Parts>,
  ...args: ConfigArgs
) => ConfigResult;

type ConfigEntry<PresetConfig> = {
  only: ConfigFunction<PresetConfig>;
  exclude: ConfigFunction<PresetConfig>;
} & typeof defineConfig;

function defineMergedConfig(presetConfig: UserConfig | null, ...args: ConfigArgs): ConfigResult {
  const [userConfig] = args;

  if (presetConfig == null) {
    return defineConfig(userConfig) as ConfigResult;
  }

  return defineConfig(mergeConfig(presetConfig, userConfig as UserConfig)) as ConfigResult;
}
