# RFC: lint config

Settings for `lint` part of Vite+ (Oxlint).

We enable `typeAware` and `typeCheck` linting by default.

We mark as `warn` for code format lint rules that process with linter (e.g. `import/first`), and other rules should report `error`.

`console.log` is not allowed, except in `cli` category.

## `liangmi` Oxlint Plugin

We define a `liangmi` Oxlint JsPlugin, it is mainly to make sure users load this config in a proper way.

Considering we have provided cli entry, it gives our ability to do runtime check for vite.config.ts. We generate a `node_modules/.vp-config/info.json`, it records necessary information used to do rule-checks, it should be deleted when running this rule. (If `node_modules` doesn't exist and is created by the entry function, delete it as well). If found this file is already existing, delete and regenerate a new one.

If a rule require runtime information, but there is not any, just simply ignore it. (except `liangmi/force-to-use-preset-config`)

### Concept

#### Is a website project

If any one of these conditions is satisfied, the directory of `vite.config.ts` is a website project.

- There is a `index.html` near `vite.config.ts` (Static analyze)
- There is at least one vite-specific configure field like `build`, `preview`, `plugin` (Just exclude Vite+ ones like `lint`). (Runtime-based analyze)

#### Is it a lib project

If any one of these conditions is satisfied, the directory of `vite.config.ts` is a library project.

- There is `pack` field passed in `vite.config.ts` (Runtime-based analyze)

#### Is it a cli project

If any one of these conditions is satisfied, the directory of `vite.config.ts` is a cli / tui project.

- This directory is a lib project
- There is at least one `bin` defined in `package.json` near the `vite.config.ts` (Runtime-based analyze)

#### Is it a project

If any one of these conditions is satisfied, the directory of `vite.config.ts` is a project.

- If it is a website project
- If it is a lib project

### Rules

#### `liangmi/no-orphan-vite-config`

_This rule does not need runtime information._

We want `vite.config.ts` to always occur with a `package.json`. (As a monorepo member)

Orphan nested config can work with Oxlint and Oxfmt, but it is confusing for other tools.

#### `liangmi/no-useless-vp-preset-imports"

_This rule does not need runtime information._

If find a import of `@liangmi/vp-config` outside of the `vite.config.ts`, report an error.

#### `liangmi/use-preset-vp-config`

This rule is a special one, it can run without runtime information, but it actually needs them.

Report an error if a `vite.config.ts` does not have a corresponding `info.json`.

#### `liangmi/load-proper-vp-config-category`

We hope users load project in these way:

- `base` category for `vite.config.ts` in a workspace root.
- `cli` | `lib` | `website` category for `vite.config.ts` in a project.

If a user uses the wrong category for a project, report an error, provide a autofix, infer the proper category based on the `concept` part (Order: `website` > `cli` > `lib`).

Note: We don't strictly check the category, it only reports the wrong type across workspace root and project. For example, if users use `lib` category but it is inferred as a `cli` category, just treat it as proper.

#### `liangmi/no-mixed-project`

If the project is inferred as both `lib` and `website`, report an error

#### `liangmi/cleanup`

This rule should not be disabled, it removes `node_modules/.vp-config/info.json`, if it is not enabled, some undefined behaviors can probably happen.
