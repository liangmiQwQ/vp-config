---
name: use-vp-config
description: Configure JavaScript and TypeScript projects with Liangmi's @liangmi/vp-config presets for Vite+. Use when you are requested to migrate to `@liangmi/vp-config` or create a project with `@liangmi/vp-config`
---

# Use Liangmi VP Config

Configure projects with `@liangmi/vp-config`, an opinionated preset for Vite+, the united JavaScript toolchain. Treat Vite+ as distinct from Vite.

## Inspect the project

Before editing:

1. Read the repository's `AGENTS.md` and existing `vite.config.ts`.
2. Inspect `package.json`, source entry points, workspace layout, and browser or Node.js signals.
3. Check local Vite+ documentation in `node_modules/vite-plus/docs` when an option is uncertain. Use <https://viteplus.dev/guide/> only when local docs are unavailable or outdated.
4. Preserve project-specific overrides instead of replacing them blindly.

## Understand the project model

There are no categories to choose. Every `vite.config.ts` uses the same `liangmi` entry, and the config is derived from facts detected from committed files:

| Fact         | Detected from                                                               |
| ------------ | --------------------------------------------------------------------------- |
| `runtime`    | `bin` in `package.json`, `index.html`, `lib` and `types` in `tsconfig.json` |
| `frameworks` | `react`, `vue` and `tailwindcss` in `package.json` dependencies             |
| `lib`        | `exports` in `package.json`                                                 |
| `cli`        | `bin` in `package.json`                                                     |

Make the committed files describe the project instead of overriding config. For example, keep `exports` for libraries and `bin` for executables, since `vp pack` only refines them and never creates them. Declare facts with `.option({ projects })` only when detection is wrong.

In a monorepo, use `liangmi` in the workspace root and in every member. Vite+ only reads `lint` and `fmt` from the workspace root, so the root generates scoped `lint.overrides` and `fmt.overrides` for each project, while members only emit `pack`, `test`, and `run`. Never pass `lint` or `fmt` in a member config, it throws an error. Put project-specific lint or format changes in the root config's `overrides` instead.

Vue template linting depends on improved upstream Oxlint support.

## Install with Vite+

Use Vite+ for package management:

```bash
vp install -D @liangmi/vp-config
```

Do not use `npm` or `pnpm` directly when the project is managed by Vite+.

This preset requires `vite-plus@1.0.0-rc.1`. Align the installed version with the preset's peer dependency; keep any `vite` alias to `@voidzero-dev/vite-plus-core` on the same version.

## Configure `vite.config.ts`

Await the `liangmi` entry:

```typescript
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({
  pack: {
    entry: './src/index.ts'
  }
})
```

The entry accepts the same object, function, or promise shapes as Vite+'s `defineConfig`. User values deeply override the preset while untouched nested defaults remain enabled.

Chain `.only([...])` or `.exclude([...])` to load selected parts (`fmt`, `lint`, `pack`, `run`, `staged`, `test`), and `.option({ projects })` to declare facts:

```typescript
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({}).option({
  projects: {
    'apps/api': { runtime: 'node' }
  }
})
```

For `lib` and `cli` projects, define `pack.entry` explicitly from the project's real source entry points. The preset cannot infer the package's intended public entries.

Do not import the preset outside `vite.config.ts`.

Since we already use vp config preset, most of the config items can be omiited. For example, we do not need to define `lint`, `staged`, and `fmt` config most of the time, `dts` generation, `fixedExtendions`, `export` generation or `minify` in `pack` are also set by default. If you are doing migration works, please handle them as well.

## Work with preset defaults

Assume these defaults unless the project explicitly overrides them:

- Linting uses strict, type-aware Oxlint with type checking and warnings denied. Do not add a separate `tsc` check solely for type checking.
- Style rules are explicitly allowlisted to keep lint behavior stable across Oxlint upgrades. New upstream style rules stay disabled until they are reviewed and added.
- `console.log` is rejected except in `cli` projects and Node.js script overrides.
- Formatting uses Oxfmt with single quotes, no semicolons, no unnecessary trailing commas, sorted imports, and sorted `package.json` fields. React and Vue projects enable embedded-language formatting, and Tailwind CSS projects sort classes.
- `lib` packaging generates declarations with `dts.generator: 'tsgo'` and package exports with fixed extensions.
- `cli` packaging targets Node.js, minifies, strips `node:` prefixes, and disables declaration generation. `lib` defaults win for projects that are both.
- `node` projects test in the Node.js environment, and `browser` projects use an installed `happy-dom` or `jsdom`.
- Staged files run `vp check --fix`.

Put task cache options (`input`, `output`, `env`, and `untrackedEnv`) inside `run.tasks.<name>.cache`.

Use the generated cached tasks when suitable:

| Task      | Underlying command |
| --------- | ------------------ |
| `cbuild`  | `vp build`         |
| `cpack`   | `vp pack`          |
| `clint`   | `vp lint`          |
| `cfmt`    | `vp fmt`           |
| `cformat` | `vp format`        |
| `ccheck`  | `vp check`         |
| `ctest`   | `vp test`          |

Run them with `vp run <task>` or `vpr <task>`. Package scripts may call them, for example `"build": "vp run cpack"`. If there is existing scripts calling `vp <command>` inside package.json, you are supposed to change them to `vp run c<xxx>` (Only for commands listed above.).

## Migration

`@liangmi/vp-config` has a stricter ruleset, to make the linting pass after migration, you need to change runtime code to fix linting errors.

If you meet cases that can't fix easily, we prefer `// oxlint-disable-xxxx` than disabling one rules global in `vite.config.ts`.

## Validate changes

After editing:

1. Run `vp config` when commit-hook configuration needs to be installed or refreshed.
2. Run `vp check`.
3. Run the relevant build, package, or test task for the changed project.
4. If a member config throws because it passes `lint` or `fmt`, move that config into the workspace root.
