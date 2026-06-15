# RFC: lint config

Settings for `lint` part of Vite+ (Oxlint).

We enable `typeAware` and `typeCheck` linting by default.

We mark as `warn` for code format lint rules that process with linter (e.g. `import/first`), and other rules should report `error`.

`console.log` is not allowed, except in `cli` category.

## `liangmi` Oxlint Plugin

We define a `liangmi` Oxlint JsPlugin, it is mainly to make sure users load this config in a proper way.

Considering we have provided cli entry, it gives our ability to do runtime check for vite.config.ts. We generate a `node_modules/.vp-config/info.json`, it records raw runtime config signals used to do rule-checks. If found this file is already existing, delete and regenerate a new one.

The runtime information should only be created when it is read by Oxlint. Use the error stack import path to confirm that Vite+ or Oxlint is loading the config.

For orphan `vite.config.ts`, we do not generate runtime information, no rules but `liangmi/no-orphan-vite-config` should be run with orphan config files.

If a rule require runtime information, but there is not any, just simply ignore it. (except `liangmi/use-preset-config`).

### Concept

#### Is a website project

If any one of these conditions is satisfied, the directory of `vite.config.ts` is a website project.

- There is a `index.html` near `vite.config.ts` (Static analyze)
- There is at least one vite-specific configure field like `build`, `preview`, `plugins` (Just exclude Vite+ ones like `lint`). (Runtime-based analyze)

#### Is it a lib project

If any one of these conditions is satisfied, the directory of `vite.config.ts` is a library project.

- There is `pack` field passed in `vite.config.ts` (Runtime-based analyze)

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

The error span should be the whole `vite.config.ts` file.

Report an error if a `vite.config.ts` does not have a corresponding `info.json`.

#### `liangmi/load-proper-vp-config-category`

This rule need runtime information, the error span should be the whole `vite.config.ts` file.

We hope users load project in these way:

- `base` category for `vite.config.ts` not in a project (workspace root).
- `cli` | `lib` | `website` category for `vite.config.ts` in a project.

If a user uses the wrong category, report an error.

Note: We don't strictly check the category, it only reports the wrong type across workspace root and project. For example, if users use `website` category but it is inferred as a `lib` category, just ignore it.

#### `liangmi/no-mixed-project`

This rule need runtime information, the error span should be the whole `vite.config.ts` file.

If the project is inferred as both `lib` and `website`, report an error
