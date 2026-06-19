# @liangmi/vp-config

Liang's united [Vite+](https://viteplus.dev/) config presets for JavaScript development — opinionated, strict and designed to be universal with different kinds of projects.

## Usage

We can install `@liangmi/vp-config` as a `devDependency` with `Vite+`

```bash
vp install -D @liangmi/vp-config
```

And modify your `vite.config.ts` like that:

```typescript
import { base } from "@liangmi/vp-config";

export default base({
  /* Your personal config overrides, will be merged deeply */
});
```

> [!WARNING]
> Considering Vite+ is now still alpha, the internal API can be unstable and expected to change, please manage to use `@liangmi/vp-config` with the latest Vite+. If you found something that doesn't work expectedly, please [submit an issue](https://github.com/liangmiQwQ/vp-config/issues/new).

### Categories

We provide four config categories for different kinds of projects.

| Category  | Description                                            | Recommended for      |
| --------- | ------------------------------------------------------ | -------------------- |
| `base`    | Pure and basic config                                  | Workspace root       |
| `cli`     | Config for Node.js CLI and React/Vue Tui applications  | CLI and TUI projects |
| `lib`     | Config with library bundling defaults                  | Libraries            |
| `website` | Config for browser environment and website development | Websites             |

The `website` category is experimental and its defaults may change before the package reaches a stable release. React and browser linting are available, but Vue template linting is still waiting for [better Vue support in Oxlint](https://github.com/oxc-project/oxc/issues/15761).

For monorepos, different presets should be used in combination. We should use `base` the workspace root, and use other categories as needed.

### Customizable

Each category is a wrapper of Vite+'s `defineConfig`. The config passed to it overrides and deeply merges with the preset.

> [!TIP]
>
> Deep merging means your config only needs to specify what should change. Nested preset options that you do not override remain enabled, while values from your config take precedence.

Use `.only()` to load only selected parts of a preset:

```typescript
import { base } from "@liangmi/vp-config";

export default base.only(["lint", "fmt"], {
  lint: {
    /* Your own lint config */
  },
  fmt: {
    /* Your own format config */
  },
});
```

Use `.exclude()` to omit selected parts while keeping the rest:

```typescript
import { base } from "@liangmi/vp-config";

export default base.exclude(["staged"], {});
```

Available config parts are `fmt`, `lint`, `pack`, `run`, and `staged`, depending on the selected category.

## What's included by default

Vite+ is a united toolchain for JavaScript development, it includes linting, formatting, library bundling, git hooks, test, task runner, website development, etc.

`@liangmi/vp-config` tries to extract reusable configurations from these, in order to improve the development experience as much as possible.

### Lint

The lint config prioritizes correctness and fast feedback. Rules that prevent bugs report errors, while style and fixable readability rules generally report warnings and are left to autofixes. Warnings also fail the lint command, keeping the codebase consistent without treating every style concern as a hand-written task.

All categories include a strict Oxlint config with type-aware linting and type checking enabled, which means you do not need to run `tsc` manually. Correctness, performance, suspicious, and nursery rules report errors.

`console.log` is not allowed except in the `cli` category and Node.js script files. Test files enable Vitest rules, while the `cli` and `website` categories add React and Vue component rules. The `website` category also enables browser-specific rules.

The included `liangmi` Oxlint plugin checks that presets are loaded correctly. It reports orphan `vite.config.ts` files, preset imports outside config files, missing preset wrappers, improper root or project categories, and configs that mix library and website signals.

### Format

The format config follows a simple philosophy: remove syntax that does not improve readability, and let the formatter handle mechanical consistency.

All categories include an Oxfmt config using single quotes, no semicolons, no unnecessary trailing commas, sorted imports, and sorted `package.json` fields. Embedded-language formatting is disabled for `base` and `lib`, and enabled for `cli` and `website`.

### Pack

The packaging presets provide the best-practice defaults for each kind of project while leaving project-specific details explicit. Because the package entry depends on the project's source layout, you still need to define `pack.entry` manually.

The `lib` preset generates `.d.ts` and package exports with fixed extensions. The `cli` preset targets Node.js, minifies output, strips `node:` protocol prefixes, and disables `dts` generation.

### Cached commands

In order to make full use of Vite+'s powerful cache system without too much config and make it contributors-friendly, we provide cached tasks task wrappers for common Vite+ commands. This feature is included in all categories.

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

Run them with `vp run <task>`, such as `vp run cpack`, or shorthand `vpr cpack`. They can also be used in `package.json` scripts while retaining Vite+ task caching.

### Staged files

Staged-file checks keep automatic fixes close to the commit workflow, so only code that is about to be committed is processed.

All categories run `vp check --fix` for staged files. Run `vp config` to install Vite+'s commit hook.

## License

[MIT](./LICENSE) License © 2026-PRESENT Liang
