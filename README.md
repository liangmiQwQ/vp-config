# @liangmi/vp-config

Liang's united [Vite+](https://viteplus.dev/) config presets for JavaScript development: opinionated, strict, and designed to work across different kinds of projects.

## Quick start

Install `@liangmi/vp-config` as a dev dependency.

```bash
npm install -D @liangmi/vp-config
```

Then use it in your `vite.config.ts`:

```typescript
import { liangmi } from '@liangmi/vp-config'

export default liangmi({
  /* Your own config, deeply merged over the preset */
})
```

An agent skill is available to handle migrations automatically:

```bash
npx skills add liangmiQwQ/vp-config
```

### Examples

There are some real-world projects using `@liangmi/vp-config`:

- [`mo`](https://github.com/liangmiQwQ/mo), a CLI and TUI project manager for open source developers on GitHub.
- [`oxlint-flat-config`](https://github.com/liangmiQwQ/oxlint-flat-config), a toolkit allows you to configure Oxlint with ESLint-style flat config arrays.
- `@liangmi/vp-config` itself.

## What's included

Vite+ is a united toolchain for JavaScript development. It includes linting, formatting, library bundling, git hooks, testing, a task runner, website development, and more. `@liangmi/vp-config` provides reusable configuration for these tools, so every project gets a good development experience with little setup.

### Lint

The lint config prioritizes correctness and fast feedback. Rules that prevent bugs report errors, while selected style and fixable readability rules report warnings and are left to autofixes. Warnings also fail the lint command, which keeps the codebase consistent without turning every style concern into manual work.

Style rules are explicitly allowlisted to keep lint behavior stable across Oxlint upgrades: new upstream style rules stay disabled until they are reviewed and added.

Every project gets a strict Oxlint config with type-aware linting and type checking enabled, so you do not need to run `tsc` separately. Correctness, performance, suspicious, and nursery rules report errors.

- `console.log` is not allowed, except in `cli` projects and [script files](#file-roles).
- `node` and `browser` projects enable their environment globals and rules, and React and Vue projects add component rules.
- Test files enable Vitest rules.
- Only `oxlint-disable` comments are respected. `eslint-disable` comments are ignored, and unused disable comments report warnings.
- `bin/**` is ignored.

### Format

The format config follows a simple philosophy: remove syntax that does not improve readability, and let the formatter handle mechanical consistency.

Every project gets an Oxfmt config with:

- Single quotes, no semicolons, and no trailing commas.
- No parentheses around a single arrow function parameter.
- Sorted imports, `package.json` fields, and `package.json` scripts.

Embedded-language formatting is off by default. React and Vue projects turn it on and use single quotes in JSX, including React Ink and Vue TUI projects. Tailwind CSS projects sort their classes.

### Pack

The packaging presets provide sensible defaults for each kind of project and leave project-specific details to you. The package entry depends on your source layout, so you still need to set `pack.entry` yourself.

- `lib` projects generate `.d.ts` files with `tsgo` and package exports with fixed extensions, without minifying.
- `cli` projects target Node.js, minify output, strip `node:` prefixes, and skip `.d.ts` generation.
- When a project is both, the `lib` defaults win where they conflict.

`vp pack` never creates `exports` or `bin`. It only refines the fields that already exist in `package.json`.

### Test

`node` projects run tests in the Node.js environment. `browser` projects use `happy-dom` or `jsdom`, whichever the project installs. A project that is both uses the browser environment when one of them is installed, and Node.js otherwise.

### Cached commands

Every config includes cached task wrappers for common Vite+ commands. They make full use of Vite+'s task cache with no extra config, and stay friendly to contributors who don't use the global Vite+ CLI.

Treat them as cached versions of Vite+ commands rather than ordinary user-defined tasks. For example, run `vpr ccheck` as a cached replacement for `vp check`.

| Task      | Command     |
| --------- | ----------- |
| `cbuild`  | `vp build`  |
| `cpack`   | `vp pack`   |
| `clint`   | `vp lint`   |
| `cfmt`    | `vp fmt`    |
| `cformat` | `vp format` |
| `ccheck`  | `vp check`  |
| `ctest`   | `vp test`   |

Run them with `vp run <task>`, such as `vp run cpack`, or the shorthand `vpr cpack`. They also keep their cache when called from `package.json` scripts, like `"build": "vp run cpack"`.

`clint` and `ccheck` also track `index.html`, since it decides whether a project is `browser`. Task cache options belong under `run.tasks.<name>.cache`, including `input`, `output`, `env`, and `untrackedEnv`.

### Staged files

Staged-file checks keep automatic fixes close to the commit workflow, so only code that is about to be committed is processed.

The root config runs `vp check --fix` on staged files. Run `vp config` to install Vite+'s commit hook.

## Project model

Each project is described by traits, which are derived from facts detected in committed files.

| Trait                         | Derived from                                                       |
| ----------------------------- | ------------------------------------------------------------------ |
| `node`                        | `bin` in `package.json`, `node` in `types` of `tsconfig.json`      |
| `browser`                     | `index.html`, `DOM` in `lib` of `tsconfig.json`                    |
| `react`, `vue`, `tailwindcss` | `package.json` dependencies, including dev, peer and optional ones |
| `lib`                         | `exports` in `package.json`                                        |
| `cli`                         | `bin` in `package.json`                                            |

`node` and `browser` are independent, so a universal project has both of them. Vue template linting is still waiting for [better Vue support in Oxlint](https://github.com/oxc-project/oxc/issues/15761).

When a derived trait is wrong, prefer fixing the committed files it comes from. If that is too complicated, declare it with `.option()` in the root config. It takes a flat list of projects identified by their `path` relative to the workspace root. Undeclared traits are still derived, and paths that are not workspace members are added as projects.

```typescript
import { liangmi } from '@liangmi/vp-config'

export default liangmi({}).option([
  { path: 'apps/api', node: true },
  { path: 'packages/ui', vue: true }
])
```

### File roles

Inside each project, some files get extra lint rules by their path. The globs are relative to the project.

| Role          | Files                                                         | Rules                                                  |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `test`        | `**/*.test.ts`, `**/*.spec.ts`                                | Vitest rules, and test files must be named `*.test.ts` |
| `script`      | `scripts/**`, `script/**`, `*.ts` and `*.js` at the top level | Node.js rules, `console` and `process.exit()` allowed  |
| `config-file` | `**/*.config.ts`                                              | Default exports allowed, `console` not allowed         |

## Monorepos

[Vite+ only reads `lint` and `fmt` from the workspace root](https://github.com/voidzero-dev/vite-plus/issues/997), so `liangmi` only emits the parts Vite+ reads from where the config is loaded.

| Position            | `lint` / `fmt` / `staged`                         | `pack` / `test` / `run` |
| ------------------- | ------------------------------------------------- | ----------------------- |
| Single-package repo | Top-level, for the only project                   | For the root project    |
| Workspace root      | For the whole workspace, with generated overrides | Root-level tasks only   |
| Workspace member    | Not emitted                                       | For this package        |

The workspace root generates lint config objects and `fmt.overrides` scoped to each project, so use `liangmi` in the root `vite.config.ts` and in every member. Passing `lint` or `fmt` in a member config, or chaining the [lint composer methods](#flat-lint-config) there, throws an error, since Vite+ would ignore it. Put project-specific changes in the root config instead.

## Customizing

`liangmi` wraps Vite+'s `defineConfig`, and accepts the same object, function, or promise. The config you pass is deeply merged over the preset, except `lint`, which is a [flat config](#flat-lint-config).

> [!TIP]
>
> Deep merging means your config only needs to specify what should change. Nested preset options that you do not override stay enabled, while values from your config take precedence.

Use `.only()` to load only selected parts of the preset:

```typescript
import { liangmi } from '@liangmi/vp-config'

export default liangmi({
  lint: [
    /* Your own flat config objects */
  ]
}).only(['lint', 'fmt'])
```

Use `.exclude()` to leave out selected parts and keep the rest:

```typescript
import { liangmi } from '@liangmi/vp-config'

export default liangmi({}).exclude(['staged'])
```

The available parts are `fmt`, `lint`, `pack`, `run`, `staged`, and `test`, depending on where the config is loaded.

### Flat lint config

`lint` is an ESLint-style flat config array built with [`oxlint-flat-config`](https://github.com/liangmiQwQ/oxlint-flat-config), not an Oxlint config object. Your config objects are applied after the preset, so a later object overrides an earlier one instead of being deeply merged. Paths in `files` are relative to the workspace root.

```typescript
import { liangmi } from '@liangmi/vp-config'

export default liangmi({
  lint: [
    { rules: { 'no-console': 'warn' } },
    { files: ['packages/cli/**'], rules: { 'no-console': 'off' } }
  ]
})
```

Every preset object has a name. To change preset objects instead of adding new ones, chain the methods of [`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/blob/main/docs/composer.md) on `liangmi()`: `append`, `prepend`, `insertBefore`, `insertAfter`, `override`, `replace`, `remove`, `overrideRules` and `removeRules`. They run after your config objects are appended.

```typescript
import { liangmi } from '@liangmi/vp-config'

// Keep the preset, without its style rules and type checking.
export default liangmi({})
  .remove('liangmi/style')
  .override('liangmi/options', { options: { typeCheck: false } })
```

| Name                                                                             | Content                                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `liangmi/ignores`                                                                | Global ignores                                                   |
| `liangmi/options`                                                                | Oxlint options, like `typeAware`, `typeCheck` and `denyWarnings` |
| `liangmi/correctness`, `liangmi/perf`, `liangmi/suspicious`, `liangmi/nursery`   | All rules of these categories in the default plugins             |
| `liangmi/restriction`, `liangmi/pedantic`, `liangmi/style`                       | Selected rules of these categories                               |
| `liangmi/node`, `liangmi/browser`, `liangmi/cli`, `liangmi/react`, `liangmi/vue` | Rules of the project's [traits](#project-model)                  |
| `liangmi/test`, `liangmi/script`, `liangmi/config-file`                          | Rules of the project's [file roles](#file-roles)                 |

In a workspace, member objects include the member's path, like `liangmi/packages/cli/react`.

Rule names are matched exactly as written. The `correctness`, `perf`, `suspicious` and `nursery` objects use plugin-prefixed names such as `eslint/no-debugger`, while the other preset objects mostly use unprefixed names such as `no-console`. Use the same spelling when calling `overrideRules` or `removeRules`.

## Credits

Huge thanks to [Anthony Fu](https://github.com/antfu) who creates [`@antfu/eslint-config`](https://github.com/antfu/eslint-config). The implementation and project trait detection logic of this project were heavily inspired by him.

## License

[MIT](./LICENSE) License © 2026-PRESENT Liang & Contributors
