# RFC: lint config

Settings for `lint` part of Vite+ (Oxlint).

We enable `typeAware` and `typeCheck` linting by default.

We mark as `warn` for code format lint rules that process with linter (e.g. `import/first`), and other rules should report `error`.

`console.log` is not allowed, except in `cli` projects and script files.

Lint config is only emitted by the workspace root (or the only project in a single-package repo). Project-specific rules are generated as `overrides` from the project model, see [Config Entry](./config-entry.md).

## `liangmi` Oxlint Plugin

We define a `liangmi` Oxlint JsPlugin, it is mainly to make sure users load this config in a proper way.

Considering we have provided cli entry, it gives our ability to do runtime check for vite.config.ts. We generate a `node_modules/.vp-config/info.json`, it records raw runtime config signals used to do rule-checks. If found this file is already existing, delete and regenerate a new one.

The runtime information should only be created when it is read by Oxlint. Use the error stack import path to confirm that Vite+ or Oxlint is loading the config.

For orphan `vite.config.ts`, we do not generate runtime information, no rules but `liangmi/no-orphan-vite-config` should be run with orphan config files.

If a rule require runtime information, but there is not any, just simply ignore it. (except `liangmi/use-preset-config`).

### Concept

Projects and their facts follow the project model in [Config Entry](./config-entry.md). The plugin reads the resolved project model from runtime information instead of inferring categories by itself.

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

#### `liangmi/no-ineffective-vp-config-parts`

This rule need runtime information, the error span should be the whole `vite.config.ts` file.

Vite+ only reads `lint` and `fmt` from the workspace root. If a workspace member's `vite.config.ts` passes `lint` or `fmt` to `vpConfig`, report an error and suggest declaring the project facts or overrides in the root config.

#### `liangmi/report-project-model`

This rule need runtime information.

Report the detected facts of a project as a hint on its `vite.config.ts` when detection and declaration disagree, so users can see what is applied.
