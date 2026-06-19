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

> [!WARN]
> Considering Vite+ is now still alpha, the internal API can be unstable and expected to change, please manage to use `@liangmi/vp-config` with the latest Vite+. If you found something that doesn't work expectedly, please [submit an issue](https://github.com/liangmiQwQ/vp-config/issues/new).

### Categories

We provide four config categories for different kinds of projects.

| Category  | Description                                            | Recommended for      |
| --------- | ------------------------------------------------------ | -------------------- |
| `base`    | Pure and basic config                                  | Workspace root       |
| `cli`     | Config for Node.js CLI and React/Vue Tui applications  | CLI and TUI projects |
| `lib`     | Config with library bundling defaults                  | Libraries            |
| `website` | Config for browser environment and website development | Websites             |

The `website` category is still a work in progress while waiting for [better Vue support in Oxlint](https://github.com/oxc-project/oxc/issues/15761).

For monorepos, different presets should be used in combination. We should use `base` the workspace root, and use other categories as needed.

### Customizable

Each category is a wrapper of Vite+'s `defineConfig`. The config passed to it overrides and deeply merges with the preset.

> [!TIPS]
>
> <!--Talk about what `deeply merge` means-->

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

Available config parts are `fmt`, `lint`, `pack`, `run`, `staged`, and `test`, depending on the selected category.

## What's included by default

<!-- I hope it can include more about design philosophy -->

Vite+ is a united toolchain for JavaScript development, it includes linting, formatting, library bundling, git hooks, test, task runner, website development, etc.

`@liangmi/vp-config` tries to extract reusable configurations from these, in order to improve the development experience as much as possible.

### Lint

All categories include a strict Oxlint config with type-aware linting and type checking enabled, means you do not need run `tsc` manually. Correctness, performance, suspicious, and nursery rules report errors, while style and fixable readability rules generally report warnings. Warnings also fail the lint command.

`console.log` is not allowed except in the `cli` category and Node.js script files. Test files enable Vitest rules, while the `cli` and `website` categories add React and Vue component rules. The `website` category also enables browser-specific rules.

The included `liangmi` Oxlint plugin checks that presets are loaded correctly. It reports orphan `vite.config.ts` files, preset imports outside config files, missing preset wrappers, improper root or project categories, and configs that mix library and website signals.

### Format

All categories include an Oxfmt config using single quotes, no semicolons, no unnecessary trailing commas, sorted imports, and sorted `package.json` fields. Embedded-language formatting is disabled for `base` and `lib`, and enabled for `cli` and `website`.

### Pack

The `lib` preset generates declarations and package exports with fixed extensions. The `cli` preset targets Node.js, minifies output, strips `node:` protocol prefixes, and disables declaration generation.

### Cached commands

All categories provide cached task wrappers for common Vite+ commands:

| Task      | Command     |
| --------- | ----------- |
| `cbuild`  | `vp build`  |
| `cpack`   | `vp pack`   |
| `clint`   | `vp lint`   |
| `cfmt`    | `vp fmt`    |
| `cformat` | `vp format` |
| `ccheck`  | `vp check`  |
| `ctest`   | `vp test`   |

Run them with `vp run <task>`, such as `vp run cpack`. They can also be used in `package.json` scripts while retaining Vite+ task caching.

### Staged files

All categories run `vp check --fix` for staged files. Run `vp config` to install Vite+'s commit hook.

## License

[MIT](./LICENSE) License © 2026-PRESENT Liang
