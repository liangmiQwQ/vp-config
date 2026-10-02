# Config Entry

## Background

Vite+ reads `lint` and `fmt` from the workspace root `vite.config.ts` only. Package-level `lint` and `fmt` blocks are ignored, and package-specific behavior must be expressed as root `overrides`. Other parts like `pack`, `build` and `test` are still read from each package's own `vite.config.ts`.

A project is described by several independent questions: the runtime (node or browser), the frameworks (React, Vue), the file roles (tests, scripts) and the build output (library or CLI). They are combined freely, for example a React component library or an Ink CLI, so the config is derived from these facts. See [Project detection](./detection.md) for how they are detected and [pack config](./pack-config.md) for the build output.

## Single entry

Every `vite.config.ts` uses the same entry, `liangmi`. It is a wrapper of `defineConfig` from `vite-plus`, and the config passed to it is deeply merged with the generated defaults.

`liangmi()` returns a thenable object. Its methods are chained to set options, and the config is resolved when it is awaited.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({
  /* Your personal config overrides, will be merged deeply */
})
```

`liangmi` knows where it is loaded from by finding the workspace root, and only emits the parts Vite+ reads in that position.

| Position            | `lint` / `fmt` / `staged`                         | `pack` / `build` / `test` / `run` |
| ------------------- | ------------------------------------------------- | --------------------------------- |
| Single-package repo | Top-level, for the only project                   | For the root project              |
| Workspace root      | For the whole workspace, with generated overrides | Root-level tasks only             |
| Workspace member    | Not emitted                                       | For this package                  |

A single-package repo is not a special mode. Its project list only contains the root, so the config is emitted without `overrides`.

`.only()` and `.exclude()` are chained to load only selected parts.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({}).exclude(['staged'])
```

## Diagnostics

`liangmi` resolves its position and the project model while the config is loaded, so it reports problems directly.

- A workspace member passes `lint` or `fmt`, which Vite+ ignores. Report an error and suggest declaring the project facts or overrides in the root config.
