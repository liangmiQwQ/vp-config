import { expect, test } from "vite-plus/test";
import type { ConfigEnv } from "vite-plus";
import { base, cli, lib, website } from "../src/index.ts";

test("base returns user config", () => {
  expect(base({ fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true,
    },
  });
});

test("base resolves function config", async () => {
  const env = { command: "serve", mode: "test" } as ConfigEnv;
  const config = base((configEnv) => ({
    fmt: {
      semi: configEnv.mode === "test",
    },
  }));

  expect(typeof config).toBe("function");
  await expect(config(env)).resolves.toMatchObject({
    fmt: {
      semi: true,
    },
  });
});

test("base part selectors keep the current config shape", () => {
  expect(base.only([], { fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true,
    },
  });
  expect(base.exclude([], { fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true,
    },
  });
});

test("specialized entries currently reuse base", () => {
  expect(cli).toBe(base);
  expect(lib).toBe(base);
  expect(website).toBe(base);
});
