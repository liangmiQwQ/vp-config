# @liangmi/vp-config

Liang's united [Vite+](https://viteplus.dev/) config presets for JavaScript development — opinionated, strict and designed to be universal with different kinds of projects.

## Usage

We can install `@liangmi/vp-config` as a `devDependency` with `Vite+`

```bash
vp install -D @liangmi/vp-config
```

And modify your `vite.config.ts` like that:

```typescript
import { liangmi } from "@liangmi/vp-config";

export default await liangmi({
  /* Your personal config overrides, will be merged deeply */
});
```

Every `vite.config.ts` uses the same `liangmi` entry. The config is derived from the facts of your projects, so there is no category to choose.

We provide a skill for agent to handle migrations automatically

```bash
skills add liangmiQwQ/vp-config
```

Here are some real-world examples using `@liangmi/vp-config`.

- `mo` is cli and tui tool to help you manage your opensource projects.
- `@liangmi/vp-config` uses itself to manage its own codebase.

> [!WARNING]
> This preset requires `vite-plus@1.0.0-rc.1`. Vite+ is still pre-stable, so keep the installed version aligned with the preset's peer dependency. If something does not work as expected, please [submit an issue](https://github.com/liangmiQwQ/vp-config/issues/new).

### Project model

Each project is described by facts, which are detected from committed files.

| Fact         | Detected from                                                               |
| ------------ | --------------------------------------------------------------------------- |
| `runtime`    | `bin` in `package.json`, `index.html`, `lib` and `types` in `tsconfig.json` |
| `frameworks` | `react`, `vue` and `tailwindcss` in `package.json` dependencies             |
| `lib`        | `exports` in `package.json`                                                 |
| `cli`        | `bin` in `package.json`                                                     |

`runtime` is `node`, `browser`, or `universal` when the signals conflict or are missing. Vue template linting is still waiting for [better Vue support in Oxlint](https://github.com/oxc-project/oxc/issues/15761).

When detection is wrong, declare the facts with `.option()`. Paths are relative to the config file, and directories that are not workspace members can be added as projects.

```typescript
import { liangmi } from "@liangmi/vp-config";

export default await liangmi({}).option({
  projects: {
    "apps/api": { runtime: "node" },
  },
});
```

### Monorepos

[Vite+ only reads `lint` and `fmt` from the workspace root](https://github.com/voidzero-dev/vite-plus/issues/997), so `liangmi` emits the parts Vite+ reads where the config is loaded.

| Position            | `lint` / `fmt` / `staged`                         | `pack` / `test` / `run` |
| ------------------- | ------------------------------------------------- | ----------------------- |
| Single-package repo | Top-level, for the only project                   | For the root project    |
| Workspace root      | For the whole workspace, with generated overrides | Root-level tasks only   |
| Workspace member    | Not emitted                                       | For this package        |

The workspace root generates `lint.overrides` and `fmt.overrides` scoped to each project, so use `liangmi` in the root `vite.config.ts` and in every member. Passing `lint` or `fmt` in a member config throws an error, since Vite+ would ignore it.

### Customizable

`liangmi` is a wrapper of Vite+'s `defineConfig`. The config passed to it overrides and deeply merges with the preset.

> [!TIP]
>
> Deep merging means your config only needs to specify what should change. Nested preset options that you do not override remain enabled, while values from your config take precedence.

Use `.only()` to load only selected parts of a preset:

```typescript
import { liangmi } from "@liangmi/vp-config";

export default await liangmi({
  lint: {
    /* Your own lint config */
  },
}).only(["lint", "fmt"]);
```

Use `.exclude()` to omit selected parts while keeping the rest:

```typescript
import { liangmi } from "@liangmi/vp-config";

export default await liangmi({}).exclude(["staged"]);
```

Available config parts are `fmt`, `lint`, `pack`, `run`, `staged`, and `test`, depending on the position of the config.

## What's included by default

Vite+ is a united toolchain for JavaScript development, it includes linting, formatting, library bundling, git hooks, test, task runner, website development, etc.

`@liangmi/vp-config` tries to extract reusable configurations from these, in order to improve the development experience as much as possible.

### Lint

The lint config prioritizes correctness and fast feedback. Rules that prevent bugs report errors, while selected style and fixable readability rules report warnings and are left to autofixes. Style rules are explicitly allowlisted to keep lint behavior stable across Oxlint upgrades: new upstream style rules stay disabled until they are reviewed and added. Warnings also fail the lint command, keeping the codebase consistent without treating every style concern as a hand-written task.

Every project gets a strict Oxlint config with type-aware linting and type checking enabled, which means you do not need to run `tsc` manually. Correctness, performance, suspicious, and nursery rules report errors.

`console.log` is not allowed except in `cli` projects and Node.js script files. `node` and `browser` runtimes enable their environment rules, and React and Vue projects add component rules. Test files enable Vitest rules.

### Format

The format config follows a simple philosophy: remove syntax that does not improve readability, and let the formatter handle mechanical consistency.

Every project gets an Oxfmt config using single quotes, no semicolons, no unnecessary trailing commas, sorted imports, and sorted `package.json` fields. Embedded-language formatting is disabled by default, and enabled for React and Vue projects, including React Ink and Vue TUI. Tailwind CSS projects sort their classes.

### Pack

The packaging presets provide the best-practice defaults for each kind of project while leaving project-specific details explicit. Because the package entry depends on the project's source layout, you still need to define `pack.entry` manually.

`lib` projects generate `.d.ts` and package exports with fixed extensions. `cli` projects target Node.js, minify output, strip `node:` protocol prefixes, and disable `dts` generation. When a project is both, the `lib` defaults take priority where they conflict.

`vp pack` never creates `exports` or `bin`, it only refines the fields which already exist in `package.json`.

### Test

`node` projects run tests in the Node.js environment. `browser` projects use `happy-dom` or `jsdom` when the project installs one of them.

### Cached commands

In order to make full use of Vite+'s powerful cache system without too much config and make it contributors-friendly, we provide cached tasks task wrappers for common Vite+ commands. This feature is included in every config.

In most cases, they should be treated more like cached versions of Vite+ commands rather than normal user-defined tasks. For example, users can run `vpr ccheck` as a cached replacement for `vp check`.

| Task      | Command     |
| --------- | ----------- |
| `cbuild`  | `vp build`  |
| `cpack`   | `vp pack`   |
| `clint`   | `vp lint`   |
| `cfmt`    | `vp fmt`    |
| `cformat` | `vp format` |
| `ccheck`  | `vp check`  |
| `ctest`   | `vp test`   |

Task cache options belong under `run.tasks.<name>.cache`, including `input`, `output`, `env`, and `untrackedEnv`.

Run them with `vp run <task>`, such as `vp run cpack`, or shorthand `vpr cpack`. They can also be used in `package.json` scripts while retaining Vite+ task caching.

### Staged files

Staged-file checks keep automatic fixes close to the commit workflow, so only code that is about to be committed is processed.

The root config runs `vp check --fix` for staged files. Run `vp config` to install Vite+'s commit hook.

## License

[MIT](./LICENSE) License © 2026-PRESENT Liang & Contributors
