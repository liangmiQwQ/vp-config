import { expect, test } from "vite-plus/test";
import { base, cli, lib, website } from "../src/index.ts";

test("base returns user config", () => {
  expect(base({ fmt: { semi: true } })).toMatchObject({
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
