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

## Select a preset

Choose one category for each `vite.config.ts`:

| Category  | Use for                                             | Included parts                         |
| --------- | --------------------------------------------------- | -------------------------------------- |
| `base`    | Workspace roots and projects without a clearer role | `fmt`, `lint`, `run`, `staged`         |
| `cli`     | Node.js CLI, TUI, React Ink, or Vue TUI projects    | `fmt`, `lint`, `pack`, `run`, `staged` |
| `lib`     | Published or reusable libraries                     | `fmt`, `lint`, `pack`, `run`, `staged` |
| `website` | Browser applications and websites                   | `fmt`, `lint`, `run`, `staged`         |

In a monorepo, use `base` at the workspace root and choose `cli`, `lib`, or `website` for member projects. Do not mix library and website signals in one project.

Treat `website` as experimental. It supports browser and component linting, but Vue template linting depends on improved upstream Oxlint support.

## Install with Vite+

Use Vite+ for package management:

```bash
vp install -D @liangmi/vp-config
```

Do not use `npm` or `pnpm` directly when the project is managed by Vite+.

Keep `vite-plus` current because both Vite+ and the preset may change while Vite+ is pre-stable. Respect an existing compatible version constraint unless the task requires an upgrade.

## Configure `vite.config.ts`

Wrap the configuration with the selected named export:

```typescript
import { lib } from '@liangmi/vp-config'

export default lib({
  pack: {
    entry: './src/index.ts'
  }
})
```

The wrapper accepts the same object, function, or promise shapes as Vite+'s `defineConfig`. User values deeply override the preset while untouched nested defaults remain enabled.

For `lib` and `cli`, define `pack.entry` explicitly from the project's real source entry points. The preset cannot infer the package's intended public entries.

Only select parts provided by the chosen category. Do not import a preset outside `vite.config.ts`.

## Work with preset defaults

Assume these defaults unless the project explicitly overrides them:

- Linting uses strict, type-aware Oxlint with type checking and warnings denied. Do not add a separate `tsc` check solely for type checking.
- `console.log` is rejected except in the `cli` category and Node.js script overrides.
- Formatting uses Oxfmt with single quotes, no semicolons, no unnecessary trailing commas, sorted imports, and sorted `package.json` fields.
- `lib` packaging generates declarations and package exports with fixed extensions.
- `cli` packaging targets Node.js, minifies, strips `node:` prefixes, and disables declaration generation.
- Staged files run `vp check --fix`.

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
4. Fix preset-plugin errors rather than disabling them. They detect orphan configs, imports outside `vite.config.ts`, missing preset wrappers, improper root or project categories, and mixed library and website signals.
