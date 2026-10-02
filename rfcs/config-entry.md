# Config Entry

> [!NOTE]
> This RFC is a draft. The API shape is not fixed and may change before it is implemented.

## Background

Vite+ reads `lint` and `fmt` from the workspace root `vite.config.ts` only. Package-level `lint` and `fmt` blocks are ignored, and package-specific behavior must be expressed as root `overrides`. Other parts like `pack`, `build` and `test` are still read from each package's own `vite.config.ts`.

A project is described by several independent questions: the runtime (node or browser), the frameworks (React, Vue), the file roles (tests, scripts) and the build output (library or CLI). They are combined freely, for example a React component library or an Ink CLI, so the config is derived from these facts.

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

## Project model

The root config has to know about every project to generate `lint.overrides` and `fmt.overrides`. It can't execute member configs, so the facts of each project must be statically readable.

Each project is described with these facts:

- `runtime`: `node`, `browser` or `universal`
- `frameworks`: like `react`, `vue`, `ink` and `tailwindcss`
- `lib`: whether the project ships a library
- `cli`: whether the project ships an executable

### Project discovery

Projects are the workspace members and the workspace root. Directories with their own `package.json` that are not workspace members can be added by the `projects` option in the root config.

### Detection

Facts are detected from committed files by default.

- `exports` in `package.json`: `lib`
- `bin` in `package.json`: `cli` and `node` runtime
- Dependencies in `package.json`: frameworks
- `index.html` near `vite.config.ts`: `browser` runtime
- `lib` and `types` in `tsconfig.json`: `browser` or `node` runtime

`vp pack` never creates `exports` or `bin`. It only refines the fields which already exist, so they are always committed and can be detected reliably.

### Declaration

When detection is wrong, facts can be declared with `.option()` in the root config.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({}).option({
  projects: {
    'apps/api': { runtime: 'node' }
  }
})
```

### Derivation

Every tool's config is derived from the same facts.

| Fact              | lint              | fmt                         | test                | pack                            |
| ----------------- | ----------------- | --------------------------- | ------------------- | ------------------------------- |
| `node` runtime    | Node rules        | —                           | Node environment    | —                               |
| `lib`             | —                 | —                           | —                   | Declarations, refined `exports` |
| `cli`             | `console` allowed | —                           | —                   | Node target, minified           |
| `browser` runtime | Browser rules     | —                           | Browser environment | —                               |
| `react` / `vue`   | Component rules   | JSX and embedded formatting | —                   | —                               |
| `tailwindcss`     | —                 | Tailwind CSS sorting        | —                   | —                               |

File roles (tests, scripts, config files) are applied by globs inside each project, and the globs are rebased under the project path. For example, `scripts/**` of `packages/foo` becomes `packages/foo/scripts/**`.

The generated overrides are ordered as: the base config, project facts, file roles, then user overrides.

## Build output

`pack` is derived from the `lib` and `cli` facts as well. `pack.entry` is still written by hand.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({
  pack: { entry: ['src/index.ts', 'src/cli.ts'] }
})
```

When a project is both `lib` and `cli`, the `lib` defaults take priority where they conflict. For example, the output is not minified and declarations are generated.

Website projects have neither fact, they use Vite's `build`.

All tasks in `run` are generated no matter what the detection result is.

## Diagnostics

`liangmi` resolves its position and the project model while the config is loaded, so it reports problems directly.

- A workspace member passes `lint` or `fmt`, which Vite+ ignores. Report an error and suggest declaring the project facts or overrides in the root config.
- A `vite.config.ts` has no `package.json` next to it. Report a warning, since it can't be discovered as a project.

## Open questions

- Whether project facts should be declared in each `package.json` instead of the root `projects` option.
