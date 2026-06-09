import { expect, test } from "vite-plus/test";
import type { ConfigEnv, UserConfig } from "vite-plus";
import { createConfigEntry } from "../src/entry.ts";

const presetConfig = {
  fmt: {
    semi: false,
  },
  staged: {
    "*": "vp check",
  },
} satisfies UserConfig;

test("should merge preset with object config", () => {
  const config = createConfigEntry(presetConfig);

  expect(config({ fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true,
    },
    staged: {
      "*": "vp check",
    },
  });
});

test("should merge preset with promise config", async () => {
  const config = createConfigEntry(presetConfig);

  await expect(config(Promise.resolve({ fmt: { semi: true } }))).resolves.toMatchObject({
    fmt: {
      semi: true,
    },
    staged: {
      "*": "vp check",
    },
  });
});

test("should merge preset with function config after Vite+ provides env", async () => {
  const config = createConfigEntry(presetConfig);
  const userConfig = config(env => ({
    fmt: {
      semi: env.mode === "test",
    },
  }));
  const env = { command: "serve", mode: "test" } as ConfigEnv;

  expect(typeof userConfig).toBe("function");
  await expect(userConfig(env)).resolves.toMatchObject({
    fmt: {
      semi: true,
    },
    staged: {
      "*": "vp check",
    },
  });
});

test("should merge only selected preset parts", () => {
  const config = createConfigEntry(presetConfig);

  expect(config.only(["fmt"], { staged: { "*": "vp test" } })).toMatchObject({
    fmt: {
      semi: false,
    },
    staged: {
      "*": "vp test",
    },
  });
});

test("should merge preset after excluding selected parts", () => {
  const config = createConfigEntry(presetConfig);

  expect(config.exclude(["fmt"], { fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true,
    },
    staged: {
      "*": "vp check",
    },
  });
});
